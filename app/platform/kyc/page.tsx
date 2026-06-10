import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  CheckCircle2,
  Clock4,
  Headphones,
  Inbox,
  ShieldAlert,
  ShieldCheck,
  ShieldX,
  UserRound,
} from "lucide-react";
import { SupportLink } from "@/src/components/support/support-link";
import { auth } from "@/src/lib/auth";
import {
  isPlatformAdmin,
  listKycSubmissions,
  type KycStatus,
} from "@/src/lib/users-store";

type TabKey = "submitted" | "rejected" | "blocked" | "verified" | "all";

const TAB_LABELS: Record<TabKey, string> = {
  all: "Tous",
  submitted: "En attente",
  verified: "Validés",
  rejected: "Rejetés",
  blocked: "Bloqués",
};

const TABS: TabKey[] = [
  "submitted",
  "rejected",
  "blocked",
  "verified",
  "all",
];

export default async function PlatformKycListPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.email) {
    redirect("/login?callbackUrl=/platform/kyc");
  }
  if (!isPlatformAdmin(session.user.email)) {
    redirect("/");
  }

  const sp = await searchParams;
  const raw = sp.status ?? "submitted";
  const status: TabKey =
    raw === "all" ||
    raw === "submitted" ||
    raw === "verified" ||
    raw === "rejected" ||
    raw === "blocked"
      ? raw
      : "submitted";

  const all = await listKycSubmissions();
  const entries =
    status === "all"
      ? all
      : all.filter((entry) => entry.effectiveStatus === status);
  const counts = {
    submitted: all.filter((e) => e.effectiveStatus === "submitted").length,
    rejected: all.filter((e) => e.effectiveStatus === "rejected").length,
    blocked: all.filter((e) => e.effectiveStatus === "blocked").length,
    verified: all.filter((e) => e.effectiveStatus === "verified").length,
    all: all.length,
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-black text-white">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.04)_1px,transparent_1px)] bg-size-[56px_56px] opacity-60"
      />

      <header className="relative border-b border-white/5 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6 sm:py-4 lg:px-8">
          <Link href="/" aria-label="Barberly · accueil">
            <Image
              src="/barberly.png"
              alt="Barberly"
              width={400}
              height={120}
              priority
              className="h-10 w-auto sm:h-12"
            />
          </Link>

          <div className="flex items-center gap-2">
            <SupportLink
              href="/platform/support"
              icon={Headphones}
              label="Support"
              className="inline-flex h-8 items-center gap-2 rounded-full border border-sky-400/30 bg-sky-400/10 px-3 text-xs font-semibold text-sky-100 transition-colors hover:bg-sky-400/20"
            />
            <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs">
              <ShieldCheck className="size-3.5 text-amber-300" />
              <span className="text-white/70">Admin plateforme</span>
            </div>
          </div>
        </div>
      </header>

      <div className="relative mx-auto w-full max-w-6xl space-y-6 px-4 py-6 sm:px-6 sm:py-10 lg:px-8 lg:py-12">
        <div className="space-y-2">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-amber-200">
            Vérification d&apos;identité
          </p>
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            File d&apos;attente KYC
          </h1>
          <p className="max-w-2xl text-sm text-white/55">
            Examinez chaque dossier soumis par les coiffeurs et validez ou
            demandez un complément. Les rejets activent un délai de 72 h, après
            quoi le compte est automatiquement bloqué.
          </p>
        </div>

        <nav className="flex flex-wrap gap-2">
          {TABS.map((tab) => {
            const active = tab === status;
            const count = counts[tab];
            return (
              <Link
                key={tab}
                href={`/platform/kyc?status=${tab}`}
                className={`inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-xs font-medium transition-colors ${
                  active
                    ? "border-amber-400/50 bg-amber-400/15 text-amber-100"
                    : "border-white/15 bg-white/5 text-white/65 hover:border-white/30 hover:text-white"
                }`}
              >
                {TAB_LABELS[tab]}
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] ${
                    active ? "bg-amber-400/20" : "bg-white/10"
                  }`}
                >
                  {count}
                </span>
              </Link>
            );
          })}
        </nav>

        {entries.length === 0 ? (
          <EmptyState />
        ) : (
          <ul className="space-y-3">
            {entries.map((entry) => (
              <li key={entry.user.id}>
                <Link
                  href={`/platform/kyc/${entry.user.id}`}
                  className="group flex flex-col gap-4 rounded-3xl border border-white/10 bg-linear-to-br from-zinc-800/60 via-zinc-900/70 to-zinc-950/90 p-4 backdrop-blur transition-colors hover:border-amber-400/30 sm:flex-row sm:items-center sm:p-5"
                >
                  <div className="flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-white/5">
                    {entry.user.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={entry.user.image}
                        alt=""
                        className="size-full object-cover"
                      />
                    ) : (
                      <UserRound className="size-5 text-white/40" />
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-base font-semibold text-white">
                        {entry.submission.legalName || entry.user.name}
                      </p>
                      <StatusPill status={entry.effectiveStatus} />
                    </div>
                    <p className="truncate text-xs text-white/55">
                      {entry.user.email} · {entry.submission.city} ·{" "}
                      {entry.submission.phone}
                    </p>
                    <p className="mt-1 text-[11px] text-white/40">
                      Soumis le{" "}
                      {new Date(entry.submission.submittedAt).toLocaleString(
                        "fr-FR",
                      )}
                    </p>
                  </div>

                  <div className="text-xs text-amber-200/80 sm:text-sm">
                    Examiner →
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}

function StatusPill({ status }: { status: KycStatus }) {
  if (status === "submitted") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-blue-500/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-blue-300">
        <Clock4 className="size-3" />
        En attente
      </span>
    );
  }
  if (status === "verified") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-emerald-300">
        <CheckCircle2 className="size-3" />
        Validé
      </span>
    );
  }
  if (status === "rejected") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-amber-300">
        <ShieldAlert className="size-3" />
        Rejeté
      </span>
    );
  }
  if (status === "blocked") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-red-500/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-red-300">
        <ShieldX className="size-3" />
        Bloqué
      </span>
    );
  }
  return null;
}

function EmptyState() {
  return (
    <div className="rounded-3xl border border-dashed border-white/15 bg-white/3 p-10 text-center backdrop-blur sm:rounded-[2rem]">
      <div className="mx-auto inline-flex size-12 items-center justify-center rounded-2xl border border-white/10 bg-white/5">
        <Inbox className="size-5 text-white/50" />
      </div>
      <p className="mt-4 text-base font-medium text-white/85">
        Aucune soumission dans cette catégorie.
      </p>
      <p className="mt-2 text-sm text-white/50">
        Revenez ici dès qu&apos;un coiffeur aura envoyé son dossier.
      </p>
    </div>
  );
}
