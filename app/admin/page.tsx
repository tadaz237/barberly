import Link from "next/link"
import { redirect } from "next/navigation"
import {
  ArrowRight,
  CalendarCheck,
  CheckCircle2,
  Clock4,
  Crown,
  Images,
  ShieldAlert,
  ShieldCheck,
  ShieldEllipsis,
  ShieldX,
  Sparkles,
  Store,
  UserRound,
} from "lucide-react"
import {
  ADMIN_TONES,
  getAdminToneKey,
  type AdminToneKey,
} from "@/src/components/admin/admin-theme"
import { AdminServicesPanel } from "@/src/components/admin/admin-services-panel"
import { KycVerifiedNotice } from "@/src/components/admin/kyc-verified-notice"
import { SignOutButton } from "@/src/components/auth/sign-out-button"
import { MessagesLinkWithNotifications } from "@/src/components/messages/message-notifications"
import { SupportLink } from "@/src/components/support/support-link"
import { QuickAccessButton } from "@/src/components/quick-access-button"
import { auth } from "@/src/lib/auth"
import {
  countCataloguesByOwner,
} from "@/src/lib/catalogues-store"
import { countProductsByOwner } from "@/src/lib/products-store"
import {
  countServicesByOwner,
  countServicesPublishedToday,
} from "@/src/lib/services-store"
import {
  PLAN_LABEL,
  getKycSubmission,
  getUserById,
  getUserLimits,
  getUserPlan,
  isPlatformAdmin,
  type KycStatus,
  type KycSubmission,
  type Plan,
} from "@/src/lib/users-store"
import { cn } from "@/src/lib/utils"

export default async function AdminPage() {
  const session = await auth()
  if (!session?.user?.id) {
    redirect("/login")
  }

  const [
    resolvedUser,
    submission,
    plan,
    limits,
    todayCount,
    servicesCount,
    cataloguesCount,
    productsCount,
  ] = await Promise.all([
    getUserById(session.user.id),
    getKycSubmission(session.user.id),
    getUserPlan(session.user.id),
    getUserLimits(session.user.id),
    countServicesPublishedToday(session.user.id),
    countServicesByOwner(session.user.id),
    countCataloguesByOwner(session.user.id),
    countProductsByOwner(session.user.id),
  ])

  const user = resolvedUser ?? {
    id: session.user.id,
    name: session.user.name ?? "Utilisateur",
    email: session.user.email ?? "",
    image: undefined,
    role: "professional" as const,
    kycStatus: "none" as KycStatus,
    plan,
  }
  if (user.role === "client") {
    redirect("/client")
  }
  const status = user.kycStatus
  const toneKey = getAdminToneKey(user.gender ?? submission?.gender ?? null)
  const tone = ADMIN_TONES[toneKey]
  const canPublish =
    status === "submitted" || status === "verified" || status === "rejected"
  const platformAdmin = isPlatformAdmin(session.user.email)

  return (
    <main className="relative min-h-screen overflow-x-clip bg-black text-white">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.045)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.045)_1px,transparent_1px)] bg-size-[56px_56px] opacity-50"
      />
      <div
        aria-hidden
        className={cn(
          "pointer-events-none absolute inset-x-0 top-0 h-72 bg-linear-to-b",
          tone.topGlow,
        )}
      />

      <header className="fixed inset-x-0 top-0 z-[80] border-b border-white/10 bg-black/90 shadow-2xl shadow-black/40 backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-7xl flex-col items-stretch gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <Link
            href="/admin/profile"
            aria-label="Ouvrir mon profil"
            className="flex min-w-0 items-center gap-3 rounded-2xl pr-2 transition-colors hover:bg-white/[0.04] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/25"
          >
            <div
              className={cn(
                "flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-full border sm:size-10",
                tone.avatar,
              )}
            >
              {user.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={user.image}
                  alt={`Photo de profil de ${user.name}`}
                  className="size-full object-cover"
                />
              ) : (
                <UserRound className={cn("size-5", tone.avatarIcon)} />
              )}
            </div>
            <div className="min-w-0 leading-tight">
              <div className="flex flex-wrap items-center gap-1.5">
                <p className="truncate text-sm font-semibold text-white">{user.name}</p>
                <KycBadge status={status} />
                <PlanBadge plan={plan} />
              </div>
              {user.email ? (
                <p className="hidden truncate text-xs text-white/45 sm:block">
                  {user.email}
                </p>
              ) : null}
            </div>
          </Link>
          <div className="flex shrink-0 flex-wrap items-center gap-2 sm:justify-end">
            <Link
              href="/marketplace"
              className="inline-flex h-9 items-center gap-2 rounded-full border border-emerald-300/30 bg-emerald-300/10 px-3 text-xs font-semibold text-emerald-100 transition-all duration-200 hover:-translate-y-0.5 hover:bg-emerald-300/20"
            >
              <Store className="size-4" />
              <span className="hidden sm:inline">Marketplace</span>
            </Link>
            <Link
              href="/admin/reservations"
              className="inline-flex h-9 items-center gap-2 rounded-full border border-pink-300/30 bg-pink-300/10 px-3 text-xs font-semibold text-pink-100 transition-all duration-200 hover:-translate-y-0.5 hover:bg-pink-300/20"
            >
              <CalendarCheck className="size-4" />
              <span className="hidden sm:inline">Mes réservations</span>
            </Link>
            <Link
              href="/admin/catalogues"
              className="inline-flex h-9 items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 text-xs font-medium text-white/70 transition-all duration-200 hover:-translate-y-0.5 hover:bg-white/10 hover:text-white"
            >
              <Images className="size-4" />
              Catalogue
            </Link>
            <MessagesLinkWithNotifications
              href="/admin/messages"
              className="inline-flex h-9 items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 text-xs font-medium text-white/70 transition-all duration-200 hover:-translate-y-0.5 hover:bg-white/10 hover:text-white"
            >
              <span className="hidden sm:inline">Messages</span>
            </MessagesLinkWithNotifications>
            {platformAdmin ? (
              <>
                <Link
                  href="/platform/kyc"
                  className="inline-flex h-9 items-center gap-2 rounded-full border border-amber-300/30 bg-amber-300/10 px-3 text-xs font-semibold text-amber-100 transition-all duration-200 hover:-translate-y-0.5 hover:bg-amber-300/20"
                >
                  <ShieldEllipsis className="size-4" />
                  <span className="hidden sm:inline">Validation KYC</span>
                </Link>
                <SupportLink
                  href="/platform/support"
                  icon="headphones"
                  label="Support"
                  className="inline-flex h-9 items-center gap-2 rounded-full border border-sky-400/30 bg-sky-400/10 px-3 text-xs font-semibold text-sky-100 transition-all duration-200 hover:-translate-y-0.5 hover:bg-sky-400/20"
                />
              </>
            ) : (
              <SupportLink
                href="/support"
                icon="life-buoy"
                label="Support"
                className="inline-flex h-9 items-center gap-2 rounded-full border border-sky-400/30 bg-sky-400/10 px-3 text-xs font-semibold text-sky-100 transition-all duration-200 hover:-translate-y-0.5 hover:bg-sky-400/20"
              />
            )}
            <QuickAccessButton />
            <SignOutButton />
          </div>
        </div>
      </header>
      <div aria-hidden className="h-36 sm:h-24 lg:h-[4.5rem]" />

      <section className="relative mx-auto flex w-full max-w-7xl flex-col gap-5 px-4 py-5 sm:gap-6 sm:px-6 sm:py-8 lg:px-8 lg:py-10">
        <KycBanner
          status={status}
          submission={submission}
          toneKey={toneKey}
          userId={user.id}
        />

        <div
          className={cn(
            "grid gap-5 rounded-2xl border p-5 shadow-[0_24px_80px_-50px_rgba(0,0,0,0.9)] backdrop-blur-xl sm:gap-6 sm:p-6 lg:grid-cols-[minmax(0,1.1fr)_320px] lg:items-end",
            tone.heroCard,
          )}
        >
          <div className="space-y-4 lg:self-start">
            <span
              className={cn(
                "inline-flex w-fit rounded-full border px-3 py-1 text-[10px] font-medium uppercase tracking-[0.18em] shadow-lg sm:text-xs sm:tracking-[0.2em]",
                tone.eyebrow,
              )}
            >
              Espace pro
            </span>

            <div className="space-y-3">
              <h1 className="max-w-3xl font-heading text-2xl font-semibold tracking-tight text-white sm:text-3xl lg:text-4xl">
                Gérez vos prestations et votre profil pro
              </h1>
              <p className="max-w-2xl text-sm leading-6 text-white/60 sm:text-base">
                Publiez de nouvelles coiffures, suivez leur visibilité sur la
                marketplace et maintenez votre profil à jour pour rassurer
                votre clientèle.
              </p>
            </div>
          </div>

          <PlanCard
            plan={plan}
            limits={limits}
            todayCount={todayCount}
            servicesCount={servicesCount}
            cataloguesCount={cataloguesCount}
            productsCount={productsCount}
            toneKey={toneKey}
          />
        </div>

        {canPublish ? (
          <AdminServicesPanel plan={plan} />
        ) : (
          <KycGateCard status={status} toneKey={toneKey} />
        )}
      </section>
    </main>
  )
}

function KycBadge({ status }: { status: KycStatus }) {
  if (status === "verified") {
    return (
      <span
        title="Profil vérifié"
        className="inline-flex shrink-0 items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-emerald-700 dark:text-emerald-300"
      >
        <ShieldCheck className="size-3" />
        Vérifié
      </span>
    )
  }
  if (status === "submitted") {
    return (
      <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-blue-500/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-blue-700 dark:text-blue-300">
        <Clock4 className="size-3" />
        En vérification
      </span>
    )
  }
  if (status === "rejected") {
    return (
      <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-amber-700 dark:text-amber-300">
        <ShieldAlert className="size-3" />
        À corriger
      </span>
    )
  }
  if (status === "blocked") {
    return (
      <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-red-500/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-red-700 dark:text-red-300">
        <ShieldX className="size-3" />
        Bloqué
      </span>
    )
  }
  return null
}

function KycBanner({
  status,
  submission,
  toneKey,
  userId,
}: {
  status: KycStatus
  submission: KycSubmission | null
  toneKey: AdminToneKey
  userId: string
}) {
  const accentTone = toneKey === "female" ? "pink" : "amber"

  if (status === "none") {
    return (
      <BannerShell tone={accentTone} Icon={ShieldAlert} eyebrow="Action requise">
        <h2 className="text-base font-semibold sm:text-lg">
          Soumettez votre vérification pour pouvoir publier vos services.
        </h2>
        <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
          Quelques minutes suffisent. Dès que vous l&apos;envoyez, vous pouvez
          publier vos prestations pendant que notre équipe vérifie votre dossier.
        </p>
        <BannerCta href="/admin/kyc" label="Commencer le KYC" tone={accentTone} />
      </BannerShell>
    )
  }

  if (status === "submitted") {
    return (
      <BannerShell tone="blue" Icon={Clock4} eyebrow="KYC en cours de vérification">
        <h2 className="text-base font-semibold sm:text-lg">
          Votre dossier est entre les mains de notre équipe.
        </h2>
        <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
          Vous pouvez publier vos prestations dès maintenant. Le badge
          &laquo;&nbsp;Vérifié&nbsp;&raquo; apparaîtra sur votre profil dès la
          validation.
        </p>
      </BannerShell>
    )
  }

  if (status === "verified") {
    return (
      <KycVerifiedNotice userId={userId}>
        <BannerShell tone="emerald" Icon={CheckCircle2} eyebrow="Profil vérifié">
          <h2 className="text-base font-semibold sm:text-lg">
            Votre KYC est validé. Vous pouvez publier librement.
          </h2>
        </BannerShell>
      </KycVerifiedNotice>
    )
  }

  if (status === "rejected" && submission) {
    const quoteClass =
      toneKey === "female"
        ? "border-pink-500/30 bg-pink-500/5 text-pink-900 dark:text-pink-200"
        : "border-amber-500/30 bg-amber-500/5 text-amber-900 dark:text-amber-200"

    return (
      <BannerShell tone={accentTone} Icon={ShieldAlert} eyebrow="Document à fournir">
        <h2 className="text-base font-semibold sm:text-lg">
          Notre équipe a besoin d&apos;un complément pour valider votre profil.
        </h2>
        {submission.rejectionReason ? (
          <blockquote
            className={cn(
              "rounded-2xl border px-4 py-3 text-sm leading-6",
              quoteClass,
            )}
          >
            {submission.rejectionReason}
          </blockquote>
        ) : null}
        {submission.rejectionDeadline ? (
          <p className="text-sm text-muted-foreground">
            Date limite : <DeadlineDate deadline={submission.rejectionDeadline} />.
            Passé ce délai, votre compte sera bloqué jusqu&apos;à correction.
          </p>
        ) : null}
        <BannerCta
          href="/admin/kyc"
          label="Mettre à jour mon KYC"
          tone={accentTone}
        />
      </BannerShell>
    )
  }

  if (status === "blocked" && submission) {
    return (
      <BannerShell tone="red" Icon={ShieldX} eyebrow="Compte bloqué">
        <h2 className="text-base font-semibold sm:text-lg">
          La publication est suspendue jusqu&apos;à correction de votre KYC.
        </h2>
        {submission.rejectionReason ? (
          <blockquote className="rounded-2xl border border-red-500/30 bg-red-500/5 px-4 py-3 text-sm leading-6 text-red-900 dark:text-red-200">
            {submission.rejectionReason}
          </blockquote>
        ) : null}
        <p className="text-sm text-muted-foreground">
          Renvoyez les documents demandés pour débloquer votre compte
          immédiatement.
        </p>
        <BannerCta href="/admin/kyc" label="Renvoyer mes documents" tone="red" />
      </BannerShell>
    )
  }

  return null
}

type BannerTone = "amber" | "pink" | "blue" | "emerald" | "red"

const TONE_CLASSES: Record<
  BannerTone,
  { container: string; icon: string; eyebrow: string }
> = {
  amber: {
    container:
      "border-amber-400/30 bg-linear-to-br from-amber-400/10 via-amber-500/5 to-transparent",
    icon: "bg-amber-400/20 ring-amber-400/40 text-amber-700 dark:text-amber-300",
    eyebrow: "text-amber-700 dark:text-amber-300",
  },
  pink: {
    container:
      "border-pink-400/30 bg-linear-to-br from-pink-400/10 via-fuchsia-500/5 to-transparent",
    icon: "bg-pink-400/20 ring-pink-400/40 text-pink-700 dark:text-pink-300",
    eyebrow: "text-pink-700 dark:text-pink-300",
  },
  blue: {
    container:
      "border-blue-400/30 bg-linear-to-br from-blue-400/10 via-blue-500/5 to-transparent",
    icon: "bg-blue-400/20 ring-blue-400/40 text-blue-700 dark:text-blue-300",
    eyebrow: "text-blue-700 dark:text-blue-300",
  },
  emerald: {
    container: "border-emerald-500/30 bg-emerald-500/10",
    icon: "bg-emerald-500/20 ring-emerald-500/40 text-emerald-700 dark:text-emerald-300",
    eyebrow: "text-emerald-700 dark:text-emerald-300",
  },
  red: {
    container:
      "border-red-500/30 bg-linear-to-br from-red-500/10 via-red-500/5 to-transparent",
    icon: "bg-red-500/20 ring-red-500/40 text-red-700 dark:text-red-300",
    eyebrow: "text-red-700 dark:text-red-300",
  },
}

function BannerShell({
  tone,
  Icon,
  eyebrow,
  children,
}: {
  tone: BannerTone
  Icon: typeof ShieldCheck
  eyebrow: string
  children: React.ReactNode
}) {
  const c = TONE_CLASSES[tone]
  return (
    <div
      className={`overflow-hidden rounded-2xl border p-5 shadow-[0_18px_60px_-42px_rgba(0,0,0,0.9)] backdrop-blur-xl sm:p-6 ${c.container}`}
    >
      <div className="flex items-start gap-4">
        <span
          className={`flex size-10 shrink-0 items-center justify-center rounded-xl ring-1 ${c.icon}`}
        >
          <Icon className="size-5" />
        </span>
        <div className="flex-1 space-y-2">
          <p
            className={`text-[11px] font-semibold uppercase tracking-[0.2em] ${c.eyebrow}`}
          >
            {eyebrow}
          </p>
          {children}
        </div>
      </div>
    </div>
  )
}

function BannerCta({
  href,
  label,
  tone,
}: {
  href: string
  label: string
  tone: BannerTone
}) {
  const cls =
    tone === "red"
      ? "bg-red-500 text-white hover:bg-red-400 shadow-lg shadow-red-500/20"
      : tone === "pink"
        ? "bg-pink-400 text-pink-950 hover:bg-pink-300 shadow-lg shadow-pink-500/20"
      : tone === "amber"
        ? "bg-amber-400 text-amber-950 hover:bg-amber-300 shadow-lg shadow-amber-500/20"
        : "bg-foreground text-background"
  return (
    <Link
      href={href}
      className={`inline-flex w-fit items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold transition-all duration-200 hover:-translate-y-0.5 ${cls}`}
    >
      {label}
      <ArrowRight className="size-4" />
    </Link>
  )
}

function DeadlineDate({ deadline }: { deadline: string }) {
  const date = new Date(deadline)
  if (!Number.isFinite(date.getTime())) {
    return <strong className="font-semibold text-foreground">à confirmer</strong>
  }

  return (
    <strong className="font-semibold text-foreground">
      {date.toLocaleDateString("fr-FR")} à{" "}
      {date.toLocaleTimeString("fr-FR", {
        hour: "2-digit",
        minute: "2-digit",
      })}
    </strong>
  )
}

function KycGateCard({
  status,
  toneKey,
}: {
  status: KycStatus
  toneKey: AdminToneKey
}) {
  const blocked = status === "blocked"
  const tone = ADMIN_TONES[toneKey]
  return (
    <div className="rounded-2xl border border-dashed border-white/15 bg-white/[0.04] p-8 text-center shadow-[0_18px_60px_-42px_rgba(0,0,0,0.9)] backdrop-blur-xl sm:p-12">
      <div
        className={cn(
          "mx-auto inline-flex size-12 items-center justify-center rounded-xl",
          blocked ? "bg-red-500/15" : tone.softPanel,
        )}
      >
        {blocked ? (
          <ShieldX className="size-6 text-red-500" />
        ) : (
          <ShieldAlert className={cn("size-6", tone.icon)} />
        )}
      </div>
      <h3 className="mt-4 text-lg font-semibold sm:text-xl">
        {blocked
          ? "Votre compte est bloqué — fournissez le document demandé pour le débloquer."
          : "Soumettez votre KYC pour publier vos prestations."}
      </h3>
      <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
        {blocked
          ? "La publication est suspendue jusqu'à ce que votre dossier soit corrigé et soumis à nouveau."
          : "Une fois votre dossier envoyé, vous pourrez publier en attendant la validation par notre équipe."}
      </p>
      <Link
        href="/admin/kyc"
        className={cn(
          "mt-5 inline-flex items-center gap-2 rounded-2xl px-5 py-3 text-sm font-semibold shadow-lg transition-colors",
          blocked
            ? "bg-red-500 text-white shadow-red-500/30 hover:bg-red-400"
            : tone.planButton,
        )}
      >
        {blocked ? "Renvoyer mes documents" : "Compléter mon KYC"}
        <ArrowRight className="size-4" />
      </Link>
    </div>
  )
}

function PlanBadge({ plan }: { plan: Plan }) {
  const cls =
    plan === "premium"
      ? "bg-amber-500/15 text-amber-700 dark:text-amber-300"
      : plan === "pro"
        ? "bg-violet-500/15 text-violet-700 dark:text-violet-300"
        : plan === "essential"
          ? "bg-sky-500/15 text-sky-700 dark:text-sky-300"
          : "bg-muted text-muted-foreground"
  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] ${cls}`}
    >
      <Crown className="size-3" />
      {PLAN_LABEL[plan]}
    </span>
  )
}

function PlanCard({
  plan,
  limits,
  todayCount,
  servicesCount,
  cataloguesCount,
  productsCount,
  toneKey,
}: {
  plan: Plan
  limits: {
    servicesPerDay: number
    servicesMax: number
    servicePublishCooldownDays: number
    cataloguesMax: number
    cataloguePhotosMax: number
    productsMax: number
  }
  todayCount: number
  servicesCount: number
  cataloguesCount: number
  productsCount: number
  toneKey: AdminToneKey
}) {
  const tone = ADMIN_TONES[toneKey]
  const servicesLimitDisplay = Number.isFinite(limits.servicesMax)
    ? `${servicesCount}/${limits.servicesMax}`
    : `${servicesCount} (illimité)`
  const publishRhythmDisplay =
    limits.servicePublishCooldownDays > 0
      ? `1 prestation tous les ${limits.servicePublishCooldownDays} jours`
      : Number.isFinite(limits.servicesPerDay)
        ? `${todayCount}/${limits.servicesPerDay} aujourd'hui`
        : "illimité"
  const cataloguesLimitDisplay = Number.isFinite(limits.cataloguesMax)
    ? `${cataloguesCount}/${limits.cataloguesMax}`
    : `${cataloguesCount} (illimité)`
  const productsLimitDisplay = Number.isFinite(limits.productsMax)
    ? `${productsCount}/${limits.productsMax}`
    : `${productsCount} (illimité)`

  return (
    <div className={cn("grid gap-4 rounded-2xl border p-5", tone.planCard)}>
      <div className="flex items-center justify-between gap-2">
        <div>
          <p
            className={cn(
              "text-[10px] font-semibold uppercase tracking-[0.22em]",
              tone.planText,
            )}
          >
            Mon forfait
          </p>
          <p className="text-lg font-semibold text-white">{PLAN_LABEL[plan]}</p>
        </div>
        <Crown className={cn("size-6", tone.planIcon)} />
      </div>

      <ul className="space-y-1.5 text-sm">
        <li className="flex items-center justify-between gap-2">
          <span className="text-white/55">Prestations publiées</span>
          <strong className="text-white">{servicesLimitDisplay}</strong>
        </li>
        <li className="flex items-center justify-between gap-2">
          <span className="text-white/55">Rythme de publication</span>
          <strong className="text-white">{publishRhythmDisplay}</strong>
        </li>
        <li className="flex items-center justify-between gap-2">
          <span className="text-white/55">Catalogue</span>
          <strong className="text-white">{cataloguesLimitDisplay}</strong>
        </li>
        <li className="flex items-center justify-between gap-2">
          <span className="text-white/55">Produits boutique</span>
          <strong className="text-white">{productsLimitDisplay}</strong>
        </li>
        <li className="flex items-center justify-between gap-2">
          <span className="text-white/55">Photos par catalogue</span>
          <strong className="text-white">{limits.cataloguePhotosMax}</strong>
        </li>
      </ul>

      {plan !== "premium" ? (
        <Link
          href="/admin/plans"
          className={cn(
            "inline-flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold shadow-lg transition-all duration-200 hover:-translate-y-0.5",
            tone.planButton,
          )}
        >
          <Sparkles className="size-4" />
          Passer à un plan supérieur
          <ArrowRight className="size-4" />
        </Link>
      ) : (
        <p className={cn("text-center text-xs", tone.planText)}>
          Vous êtes sur le forfait le plus complet 🎉
        </p>
      )}
    </div>
  )
}
