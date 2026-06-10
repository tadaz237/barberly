import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowLeft,
  BadgeCheck,
  Clock3,
  Crown,
  FileText,
  MapPin,
  Scissors,
  ShieldCheck,
  Users,
} from "lucide-react";
import { PlatformUserTabs } from "@/src/components/platform/platform-user-tabs";
import { PublicationModerationActions } from "@/src/components/platform/publication-moderation-actions";
import { auth } from "@/src/lib/auth";
import { listPlatformServicePublications } from "@/src/lib/services-store";
import {
  PLAN_LABEL,
  getUserById,
  isAccountActive,
  isPlatformAdmin,
} from "@/src/lib/users-store";

export const metadata = {
  title: "Publications - Super admin",
};

export default async function PlatformPublicationsPage() {
  const session = await auth();
  if (!session?.user?.id || !session.user.email) {
    redirect("/login?callbackUrl=/platform/publications");
  }
  const admin = await getUserById(session.user.id);
  if (!isAccountActive(admin) || !isPlatformAdmin(session.user.email)) {
    redirect("/");
  }

  const publications = await listPlatformServicePublications();
  const orphanedCount = publications.filter((item) => !item.ownerId).length;

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
            className="inline-flex items-center gap-1.5 text-xs font-medium text-white/60 transition-colors hover:text-amber-200 sm:text-sm"
          >
            <ArrowLeft className="size-4" />
            Retour au tableau de bord
          </Link>
          <PlatformNav />
        </div>

        <header className="grid gap-5 rounded-3xl border border-white/10 bg-linear-to-br from-zinc-800/60 via-zinc-900/70 to-zinc-950/90 p-5 backdrop-blur sm:p-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
          <div className="space-y-3">
            <p className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-amber-200">
              <FileText className="size-3.5" />
              Moderation marketplace
            </p>
            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              Publications des professionnels
            </h1>
            <p className="max-w-2xl text-sm leading-6 text-white/55">
              Supprimez les prestations qui ne correspondent pas a la plateforme.
              La suppression retire aussi l&apos;image Cloudinary liee a la prestation.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2 text-center text-xs">
            <Metric label="Publications" value={publications.length} />
            <Metric label="Sans compte" value={orphanedCount} tone="amber" />
          </div>
        </header>

        <PlatformUserTabs active="publications" />

        {publications.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-white/15 bg-white/3 p-10 text-center backdrop-blur">
            <Scissors className="mx-auto size-8 text-white/40" />
            <p className="mt-4 text-sm text-white/60">
              Aucune prestation publiee pour le moment.
            </p>
          </div>
        ) : (
          <section className="grid gap-4 lg:grid-cols-2">
            {publications.map((publication) => (
              <article
                key={publication.id}
                className="grid gap-4 rounded-3xl border border-white/10 bg-zinc-950/80 p-4 shadow-[0_18px_60px_-42px_rgba(0,0,0,0.9)] backdrop-blur sm:grid-cols-[160px_minmax(0,1fr)] sm:p-5"
              >
                <div className="h-40 overflow-hidden rounded-2xl border border-white/10 bg-white/5 sm:h-full">
                  {publication.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={publication.image}
                      alt=""
                      className="size-full object-cover"
                    />
                  ) : (
                    <div className="flex size-full items-center justify-center">
                      <Scissors className="size-8 text-white/35" />
                    </div>
                  )}
                </div>

                <div className="min-w-0 space-y-4">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-white/8 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.14em] text-white/55">
                        {publication.category}
                      </span>
                      {publication.featured ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-400 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.14em] text-amber-950">
                          <Crown className="size-3" />
                          Vedette
                        </span>
                      ) : null}
                    </div>
                    <h2 className="text-lg font-semibold tracking-tight text-white">
                      {publication.name}
                    </h2>
                    <p className="line-clamp-2 text-xs leading-5 text-white/52">
                      {publication.description}
                    </p>
                  </div>

                  <div className="grid gap-2 text-xs text-white/50 sm:grid-cols-2">
                    <span className="inline-flex items-center gap-1.5">
                      <Users className="size-3.5 text-cyan-200" />
                      {publication.ownerName}
                    </span>
                    <span className="truncate">{publication.ownerEmail}</span>
                    <span className="inline-flex items-center gap-1.5">
                      <MapPin className="size-3.5 text-emerald-200" />
                      {publication.city} - {publication.neighborhood}
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <Clock3 className="size-3.5 text-amber-200" />
                      {publication.duration} min
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-3">
                    <div className="space-y-1">
                      <p className="text-xl font-semibold text-white">
                        {publication.price.toLocaleString("fr-FR")} FCFA
                      </p>
                      <p className="text-[11px] text-white/40">
                        Plan proprietaire :{" "}
                        {publication.ownerPlan
                          ? PLAN_LABEL[publication.ownerPlan]
                          : "Aucun"}
                      </p>
                    </div>
                    <Link
                      href={`/marketplace/${publication.id}`}
                      className="inline-flex h-9 items-center rounded-xl border border-white/12 bg-white/5 px-3 text-xs font-semibold text-white/70 transition-colors hover:bg-white/10 hover:text-white"
                    >
                      Voir
                    </Link>
                  </div>

                  <PublicationModerationActions serviceId={publication.id} />
                </div>
              </article>
            ))}
          </section>
        )}
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
      <Link
        href="/platform/users"
        className="inline-flex h-9 items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 font-semibold text-white/70 transition-colors hover:bg-white/10 hover:text-white"
      >
        <ShieldCheck className="size-3.5" />
        Utilisateurs
      </Link>
    </nav>
  );
}

function Metric({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone?: "amber";
}) {
  return (
    <div
      className={`rounded-2xl border px-3 py-2 ${
        tone === "amber"
          ? "border-amber-400/25 bg-amber-400/10 text-amber-100"
          : "border-white/10 bg-white/5 text-white/75"
      }`}
    >
      <p className="text-lg font-semibold">{value}</p>
      <p className="text-[10px] uppercase tracking-[0.16em] text-white/38">
        {label}
      </p>
    </div>
  );
}
