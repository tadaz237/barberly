import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowLeft,
  CheckCircle2,
  Clock4,
  ShieldAlert,
  ShieldCheck,
  ShieldX,
} from "lucide-react";
import { KycForm } from "@/src/components/kyc/kyc-form";
import { auth } from "@/src/lib/auth";
import { getGender } from "@/src/lib/gender";
import {
  getKycStatus,
  getKycSubmission,
  getUserById,
  type KycStatus,
} from "@/src/lib/users-store";

export default async function KycPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const [user, submission, status, cookieGender] = await Promise.all([
    getUserById(session.user.id),
    getKycSubmission(session.user.id),
    getKycStatus(session.user.id),
    getGender(),
  ]);
  const gender = user?.gender ?? submission?.gender ?? cookieGender ?? null;

  const showForm =
    status === "none" || status === "rejected" || status === "blocked";

  return (
    <main className="relative min-h-screen overflow-hidden bg-black text-white">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.04)_1px,transparent_1px)] bg-size-[56px_56px] opacity-60"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -top-40 left-1/2 size-[40rem] -translate-x-1/2 rounded-full bg-amber-400/10 blur-[120px]"
      />

      <div className="relative mx-auto w-full max-w-3xl space-y-8 px-4 py-6 sm:px-6 sm:py-10 lg:py-12">
        <header className="space-y-4">
          <Link
            href="/admin"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-white/60 transition-colors hover:text-amber-200 sm:text-sm"
          >
            <ArrowLeft className="size-4" />
            Retour au tableau de bord
          </Link>

          <StatusHero status={status} />
        </header>

        {status === "rejected" && submission?.rejectionReason ? (
          <RejectionInfo
            reason={submission.rejectionReason}
            deadline={submission.rejectionDeadline}
            tone="amber"
          />
        ) : null}

        {status === "blocked" && submission?.rejectionReason ? (
          <RejectionInfo
            reason={submission.rejectionReason}
            deadline={submission.rejectionDeadline}
            tone="red"
          />
        ) : null}

        {status === "submitted" ? (
          <SubmittedCard />
        ) : status === "verified" ? (
          <VerifiedCard />
        ) : null}

        {showForm ? (
          <KycForm
            defaultName={user?.name}
            gender={gender}
            resubmission={status === "rejected" || status === "blocked"}
            initialValues={
              submission
                ? {
                    legalName: submission.legalName,
                    dateOfBirth: submission.dateOfBirth,
                    phone: submission.phone,
                    city: submission.city,
                    postalCode: submission.postalCode,
                    specialties: submission.specialties,
                    experienceYears: String(submission.experienceYears ?? ""),
                    bio: submission.bio,
                    serviceAreas: submission.serviceAreas,
                  }
                : undefined
            }
          />
        ) : null}
      </div>
    </main>
  );
}

function StatusHero({ status }: { status: KycStatus }) {
  if (status === "submitted") {
    return (
      <div className="space-y-3">
        <span className="inline-flex items-center gap-2 rounded-full border border-blue-400/30 bg-blue-400/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.22em] text-blue-200">
          <Clock4 className="size-3.5" />
          En cours de vérification
        </span>
        <h1 className="text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
          On vérifie votre dossier.
        </h1>
        <p className="max-w-2xl text-sm leading-6 text-white/55 sm:text-base">
          Vous pouvez déjà publier vos prestations. Le badge &laquo;&nbsp;Vérifié&nbsp;&raquo;
          apparaîtra sur votre profil dès la validation.
        </p>
      </div>
    );
  }

  if (status === "verified") {
    return (
      <div className="space-y-3">
        <span className="inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.22em] text-emerald-200">
          <ShieldCheck className="size-3.5" />
          Profil vérifié
        </span>
        <h1 className="text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
          Votre identité est validée.
        </h1>
      </div>
    );
  }

  if (status === "rejected") {
    return (
      <div className="space-y-3">
        <span className="inline-flex items-center gap-2 rounded-full border border-amber-400/30 bg-amber-400/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.22em] text-amber-200">
          <ShieldAlert className="size-3.5" />
          Document à fournir
        </span>
        <h1 className="text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
          Mettez à jour vos documents.
        </h1>
        <p className="max-w-2xl text-sm leading-6 text-white/55 sm:text-base">
          Corrigez le point signalé ci-dessous et renvoyez votre dossier. Vous
          continuez à publier vos prestations tant que le délai n&apos;est pas
          écoulé.
        </p>
      </div>
    );
  }

  if (status === "blocked") {
    return (
      <div className="space-y-3">
        <span className="inline-flex items-center gap-2 rounded-full border border-red-400/30 bg-red-400/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.22em] text-red-200">
          <ShieldX className="size-3.5" />
          Compte bloqué
        </span>
        <h1 className="text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
          Fournissez le document manquant pour réactiver votre compte.
        </h1>
        <p className="max-w-2xl text-sm leading-6 text-white/55 sm:text-base">
          La publication est suspendue. Dès votre nouvelle soumission, votre
          compte est immédiatement débloqué pendant la nouvelle vérification.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <span className="inline-flex items-center gap-2 rounded-full border border-amber-400/30 bg-amber-400/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.22em] text-amber-200">
        <ShieldCheck className="size-3.5" />
        Vérification du profil
      </span>
      <h1 className="text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
        Complétez votre KYC en quelques minutes.
      </h1>
      <p className="max-w-2xl text-sm leading-6 text-white/55 sm:text-base">
        Dès l&apos;envoi du dossier, vous pouvez publier vos prestations
        pendant que notre équipe vérifie votre profil.
      </p>
    </div>
  );
}

function RejectionInfo({
  reason,
  deadline,
  tone,
}: {
  reason: string;
  deadline?: string;
  tone: "amber" | "red";
}) {
  const c =
    tone === "red"
      ? "border-red-400/30 bg-red-500/10 text-red-200"
      : "border-amber-400/30 bg-amber-400/10 text-amber-100";

  return (
    <section
      className={`space-y-3 rounded-3xl border p-5 backdrop-blur sm:rounded-[2rem] sm:p-6 ${c}`}
    >
      <p className="text-[11px] font-semibold uppercase tracking-[0.22em]">
        Message de notre équipe
      </p>
      <blockquote className="text-sm leading-6">{reason}</blockquote>
      {deadline ? (
        <p className="text-xs text-white/60">
          Délai pour corriger : <DeadlineText deadline={deadline} />
        </p>
      ) : null}
    </section>
  );
}

function DeadlineText({ deadline }: { deadline: string }) {
  const remaining = new Date(deadline).getTime() - Date.now();
  if (remaining <= 0) {
    return <strong className="text-red-200">délai écoulé</strong>;
  }
  const hours = Math.floor(remaining / (60 * 60 * 1000));
  const minutes = Math.floor((remaining % (60 * 60 * 1000)) / (60 * 1000));
  if (hours >= 24) {
    const days = Math.floor(hours / 24);
    const remHours = hours % 24;
    return (
      <strong>
        {days} j {remHours} h
      </strong>
    );
  }
  return (
    <strong>
      {hours} h {minutes.toString().padStart(2, "0")} min restantes
    </strong>
  );
}

function SubmittedCard() {
  return (
    <div className="rounded-3xl border border-blue-400/30 bg-blue-500/5 p-6 backdrop-blur sm:rounded-[2rem] sm:p-8">
      <div className="flex items-start gap-4">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-blue-400/20 ring-1 ring-blue-400/40">
          <Clock4 className="size-5 text-blue-200" />
        </span>
        <div className="space-y-2">
          <h2 className="text-lg font-semibold text-white">
            Votre dossier est en cours de vérification.
          </h2>
          <p className="text-sm text-white/60">
            Notre équipe revient vers vous très vite. En attendant, retournez
            au tableau de bord pour publier vos prestations.
          </p>
          <Link
            href="/admin"
            className="inline-flex items-center gap-2 rounded-xl bg-blue-500 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-400"
          >
            Retour au tableau de bord
          </Link>
        </div>
      </div>
    </div>
  );
}

function VerifiedCard() {
  return (
    <div className="rounded-3xl border border-emerald-400/30 bg-emerald-400/10 p-6 backdrop-blur sm:rounded-[2rem] sm:p-8">
      <div className="flex items-start gap-4">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-400/20 ring-1 ring-emerald-400/40">
          <CheckCircle2 className="size-5 text-emerald-200" />
        </span>
        <div className="space-y-2">
          <h2 className="text-lg font-semibold text-white">
            Votre profil est déjà vérifié.
          </h2>
          <p className="text-sm text-white/60">
            Pour modifier des informations sensibles (état civil, pièce
            d&apos;identité), contactez notre support.
          </p>
          <Link
            href="/admin"
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-400 px-4 py-2 text-sm font-semibold text-emerald-950 hover:bg-emerald-300"
          >
            Aller au tableau de bord
          </Link>
        </div>
      </div>
    </div>
  );
}
