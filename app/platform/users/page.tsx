import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowLeft,
  BadgeCheck,
  ShieldCheck,
  ShieldX,
  Users,
} from "lucide-react";
import { PlatformUserTabs } from "@/src/components/platform/platform-user-tabs";
import { PlatformUserControls } from "@/src/components/platform/platform-user-controls";
import { auth } from "@/src/lib/auth";
import {
  PLAN_LABEL,
  getUserById,
  isAccountActive,
  isPlatformAdmin,
  listPlatformUsers,
} from "@/src/lib/users-store";

export const metadata = {
  title: "Utilisateurs - Super admin",
};

export default async function PlatformUsersPage() {
  const session = await auth();
  if (!session?.user?.id || !session.user.email) {
    redirect("/login?callbackUrl=/platform/users");
  }
  const admin = await getUserById(session.user.id);
  if (!isAccountActive(admin) || !isPlatformAdmin(session.user.email)) {
    redirect("/");
  }

  const users = await listPlatformUsers();
  const activeCount = users.filter((user) => user.accountStatus === "active").length;
  const blockedCount = users.length - activeCount;
  const proCount = users.filter((user) => user.role === "professional").length;

  return (
    <main className="relative min-h-screen overflow-hidden bg-black text-white">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.04)_1px,transparent_1px)] bg-size-[56px_56px] opacity-60"
      />

      <div className="relative mx-auto w-full max-w-7xl space-y-6 px-4 py-6 sm:px-6 sm:py-10 lg:px-8 lg:py-12">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link
            href="/admin"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-white/60 transition-colors hover:text-cyan-200 sm:text-sm"
          >
            <ArrowLeft className="size-4" />
            Retour au tableau de bord
          </Link>
          <PlatformNav />
        </div>

        <header className="grid gap-5 rounded-3xl border border-white/10 bg-linear-to-br from-zinc-800/60 via-zinc-900/70 to-zinc-950/90 p-5 backdrop-blur sm:p-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
          <div className="space-y-3">
            <p className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-cyan-200">
              <Users className="size-3.5" />
              Super admin
            </p>
            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              Gestion des utilisateurs
            </h1>
            <p className="max-w-2xl text-sm leading-6 text-white/55">
              Bloquez les comptes problematiques et attribuez manuellement un
              forfait aux utilisateurs inscrits sans reactiver le paiement public.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center text-xs">
            <Metric label="Inscrits" value={users.length} />
            <Metric label="Pros" value={proCount} />
            <Metric label="Bloques" value={blockedCount} tone="red" />
          </div>
        </header>

        <PlatformUserTabs active="accounts" />

        <section className="grid gap-4 lg:grid-cols-2">
          {users.map((user) => {
            const protectedAdmin = isPlatformAdmin(user.email);
            return (
              <article
                key={user.id}
                className="grid gap-4 rounded-3xl border border-white/10 bg-zinc-950/80 p-4 shadow-[0_18px_60px_-42px_rgba(0,0,0,0.9)] backdrop-blur sm:p-5"
              >
                <div className="flex items-start gap-4">
                  <div className="flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-white/5">
                    {user.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={user.image} alt="" className="size-full object-cover" />
                    ) : (
                      <Users className="size-5 text-white/40" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="truncate text-base font-semibold text-white">
                        {user.name}
                      </h2>
                      <StatusPill status={user.accountStatus} />
                      {protectedAdmin ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-400/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em] text-amber-200">
                          <ShieldCheck className="size-3" />
                          Super admin
                        </span>
                      ) : null}
                    </div>
                    <p className="truncate text-xs text-white/45">{user.email}</p>
                    <div className="mt-2 flex flex-wrap gap-2 text-[11px] text-white/45">
                      <span>{user.role === "client" ? "Client" : "Professionnel"}</span>
                      <span aria-hidden>/</span>
                      <span>{PLAN_LABEL[user.plan]}</span>
                      {user.planExpiresAt ? (
                        <>
                          <span aria-hidden>/</span>
                          <span>
                            expire le{" "}
                            {new Date(user.planExpiresAt).toLocaleDateString("fr-FR")}
                          </span>
                        </>
                      ) : null}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-2 text-center text-xs">
                  <Metric label="Prest." value={user.servicesCount} compact />
                  <Metric label="Cat." value={user.cataloguesCount} compact />
                  <Metric label="Prod." value={user.productsCount} compact />
                  <Metric label="Reserv." value={user.reservationsCount} compact />
                </div>

                {user.blockedReason ? (
                  <p className="rounded-2xl border border-red-400/20 bg-red-500/10 px-3 py-2 text-xs leading-5 text-red-100">
                    {user.blockedReason}
                  </p>
                ) : null}

                <PlatformUserControls user={user} protectedAdmin={protectedAdmin} />
              </article>
            );
          })}
        </section>
      </div>
    </main>
  );
}

function PlatformNav() {
  return (
    <nav className="flex flex-wrap gap-2 text-xs">
      <Link
        href="/platform/kyc"
        className="inline-flex h-9 items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 font-semibold text-white/70 transition-colors hover:bg-white/10 hover:text-white"
      >
        <BadgeCheck className="size-3.5" />
        KYC
      </Link>
    </nav>
  );
}

function Metric({
  label,
  value,
  tone,
  compact,
}: {
  label: string;
  value: number;
  tone?: "red";
  compact?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border px-3 py-2 ${
        tone === "red"
          ? "border-red-400/25 bg-red-500/10 text-red-100"
          : "border-white/10 bg-white/5 text-white/75"
      }`}
    >
      <p className={compact ? "text-base font-semibold" : "text-lg font-semibold"}>
        {value}
      </p>
      <p className="text-[10px] uppercase tracking-[0.16em] text-white/38">
        {label}
      </p>
    </div>
  );
}

function StatusPill({ status }: { status: "active" | "blocked" }) {
  return status === "blocked" ? (
    <span className="inline-flex items-center gap-1 rounded-full bg-red-500/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em] text-red-200">
      <ShieldX className="size-3" />
      Bloque
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-400/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em] text-emerald-200">
      <ShieldCheck className="size-3" />
      Actif
    </span>
  );
}
