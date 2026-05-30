import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  ArrowLeft,
  CalendarClock,
  Mail,
  MapPin,
  Phone,
  Sparkles,
  UserRound,
} from "lucide-react";
import { KycReviewActions } from "@/src/components/platform/kyc-review-actions";
import { auth } from "@/src/lib/auth";
import {
  SPECIALTY_LABEL,
  getKycStatus,
  getKycSubmission,
  getUserById,
  isPlatformAdmin,
} from "@/src/lib/users-store";

export default async function PlatformKycDetailPage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const session = await auth();
  const { userId } = await params;
  if (!session?.user?.email) {
    redirect(`/login?callbackUrl=/platform/kyc/${encodeURIComponent(userId)}`);
  }
  if (!isPlatformAdmin(session.user.email)) {
    redirect("/");
  }
  const [submission, user, status] = await Promise.all([
    getKycSubmission(userId),
    getUserById(userId),
    getKycStatus(userId),
  ]);
  if (!submission || !user) {
    notFound();
  }

  const age = computeAge(submission.dateOfBirth);

  return (
    <main className="relative min-h-screen overflow-hidden bg-black text-white">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.04)_1px,transparent_1px)] bg-size-[56px_56px] opacity-60"
      />

      <div className="relative mx-auto w-full max-w-5xl space-y-8 px-4 py-6 sm:px-6 sm:py-10 lg:px-8 lg:py-12">
        <Link
          href="/platform/kyc"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-white/60 transition-colors hover:text-amber-200 sm:text-sm"
        >
          <ArrowLeft className="size-4" />
          Retour à la file d&apos;attente
        </Link>

        <header className="flex flex-col gap-5 rounded-3xl border border-white/10 bg-linear-to-br from-zinc-800/60 via-zinc-900/70 to-zinc-950/90 p-6 backdrop-blur sm:flex-row sm:items-center sm:p-8">
          <div className="flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-white/5">
            {user.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={user.image}
                alt={`Avatar de ${user.name}`}
                className="size-full object-cover"
              />
            ) : (
              <UserRound className="size-7 text-white/50" />
            )}
          </div>

          <div className="flex-1 space-y-1.5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-amber-200">
              Dossier KYC
            </p>
            <h1 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">
              {submission.legalName}
            </h1>
            <p className="text-sm text-white/55">
              Compte&nbsp;: {user.name} · Statut actuel&nbsp;:{" "}
              <strong className="text-white">{statusLabel(status)}</strong>
            </p>
          </div>

          <div className="text-xs text-white/40">
            Soumis le{" "}
            {new Date(submission.submittedAt).toLocaleString("fr-FR")}
          </div>
        </header>

        <section className="grid gap-4 sm:grid-cols-2">
          <InfoCard
            icon={<UserRound className="size-4" />}
            label="État civil"
            value={submission.legalName}
            sublabel={`${age} ans · né(e) le ${new Date(submission.dateOfBirth).toLocaleDateString("fr-FR")}`}
          />
          <InfoCard
            icon={<Phone className="size-4" />}
            label="Téléphone"
            value={submission.phone}
            sublabel="Visible par les clientes une fois validé"
          />
          <InfoCard
            icon={<Mail className="size-4" />}
            label="Email du compte"
            value={user.email ?? "—"}
          />
          <InfoCard
            icon={<MapPin className="size-4" />}
            label="Domicile"
            value={submission.city}
            sublabel={`Zones d'intervention : ${submission.serviceAreas}`}
          />
          <InfoCard
            icon={<Sparkles className="size-4" />}
            label="Profil pro"
            value={`${submission.experienceYears} an${submission.experienceYears > 1 ? "s" : ""} d'expérience`}
            sublabel={submission.specialties
              .map((s) => SPECIALTY_LABEL[s])
              .join(" · ")}
          />
          <InfoCard
            icon={<UserRound className="size-4" />}
            label="Univers"
            value={submission.gender === "female" ? "Coiffeuse" : "Coiffeur"}
          />
        </section>

        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-white/80">Présentation</h2>
          <p className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm leading-6 text-white/70">
            {submission.bio}
          </p>
        </section>

        {status === "rejected" || status === "blocked" ? (
          <section className="rounded-2xl border border-amber-400/30 bg-amber-400/10 p-5 text-sm">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-amber-200">
              Dernier message envoyé
            </p>
            <blockquote className="mt-2 leading-6 text-amber-100">
              {submission.rejectionReason}
            </blockquote>
            {submission.rejectionDeadline ? (
              <p className="mt-3 inline-flex items-center gap-2 text-xs text-amber-200/80">
                <CalendarClock className="size-3.5" />
                Délai : jusqu&apos;au{" "}
                {new Date(submission.rejectionDeadline).toLocaleString(
                  "fr-FR",
                )}
              </p>
            ) : null}
          </section>
        ) : null}

        <section className="rounded-3xl border border-white/10 bg-linear-to-br from-zinc-800/60 via-zinc-900/70 to-zinc-950/90 p-6 backdrop-blur sm:p-8">
          <h2 className="mb-4 text-lg font-semibold text-white">
            Décision de l&apos;examinateur
          </h2>
          <KycReviewActions userId={userId} currentStatus={status === "none" ? "submitted" : status} />
        </section>
      </div>
    </main>
  );
}

function computeAge(iso: string): number {
  const dob = new Date(iso);
  const diff = Date.now() - dob.getTime();
  return Math.floor(diff / (365.25 * 24 * 60 * 60 * 1000));
}

function statusLabel(status: string): string {
  switch (status) {
    case "submitted":
      return "En attente";
    case "verified":
      return "Validé";
    case "rejected":
      return "Rejeté (délai en cours)";
    case "blocked":
      return "Bloqué (délai écoulé)";
    default:
      return status;
  }
}

function InfoCard({
  icon,
  label,
  value,
  sublabel,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sublabel?: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <p className="inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/40">
        {icon}
        {label}
      </p>
      <p className="mt-2 text-sm font-medium text-white">{value}</p>
      {sublabel ? (
        <p className="mt-1 text-xs text-white/45">{sublabel}</p>
      ) : null}
    </div>
  );
}
