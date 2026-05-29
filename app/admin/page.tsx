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
  UserRound,
} from "lucide-react"
import { AdminServicesPanel } from "@/src/components/admin/admin-services-panel"
import { SignOutButton } from "@/src/components/auth/sign-out-button"
import { auth } from "@/src/lib/auth"
import {
  countCataloguesByOwner,
} from "@/src/lib/catalogues-store"
import { countServicesPublishedToday } from "@/src/lib/services-store"
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

export default async function AdminPage() {
  const session = await auth()
  if (!session?.user?.id) {
    redirect("/login")
  }

  const [resolvedUser, submission, plan, limits, todayCount, cataloguesCount] =
    await Promise.all([
      getUserById(session.user.id),
      getKycSubmission(session.user.id),
      getUserPlan(session.user.id),
      getUserLimits(session.user.id),
      countServicesPublishedToday(session.user.id),
      countCataloguesByOwner(session.user.id),
    ])

  const user = resolvedUser ?? {
    id: session.user.id,
    name: session.user.name ?? "Utilisateur",
    email: session.user.email ?? "",
    image: undefined,
    kycStatus: "none" as KycStatus,
    plan,
  }
  const status = user.kycStatus
  const canPublish =
    status === "submitted" || status === "verified" || status === "rejected"
  const platformAdmin = isPlatformAdmin(session.user.email)

  return (
    <main className="min-h-screen bg-linear-to-b from-background via-background to-muted/30">
      <header className="sticky top-0 z-10 border-b border-border/60 bg-background/85 backdrop-blur">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-full border border-border/70 bg-muted sm:size-10">
              {user.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={user.image}
                  alt={`Photo de profil de ${user.name}`}
                  className="size-full object-cover"
                />
              ) : (
                <UserRound className="size-5 text-muted-foreground" />
              )}
            </div>
            <div className="min-w-0 leading-tight">
              <div className="flex flex-wrap items-center gap-1.5">
                <p className="truncate text-sm font-semibold">{user.name}</p>
                <KycBadge status={status} />
                <PlanBadge plan={plan} />
              </div>
              {user.email ? (
                <p className="hidden truncate text-xs text-muted-foreground sm:block">
                  {user.email}
                </p>
              ) : null}
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Link
              href="/admin/reservations"
              className="inline-flex items-center gap-2 rounded-full border border-pink-400/40 bg-pink-400/10 px-3 py-1.5 text-xs font-semibold text-pink-700 transition-colors hover:bg-pink-400/20 dark:text-pink-300"
            >
              <CalendarCheck className="size-4" />
              <span className="hidden sm:inline">Mes réservations</span>
            </Link>
            <Link
              href="/admin/catalogues"
              className="hidden items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted sm:inline-flex"
            >
              <Images className="size-4" />
              Catalogues
            </Link>
            {platformAdmin ? (
              <Link
                href="/platform/kyc"
                className="inline-flex items-center gap-2 rounded-full border border-amber-400/40 bg-amber-400/10 px-3 py-1.5 text-xs font-semibold text-amber-700 transition-colors hover:bg-amber-400/20 dark:text-amber-300"
              >
                <ShieldEllipsis className="size-4" />
                <span className="hidden sm:inline">Validation KYC</span>
              </Link>
            ) : null}
            <SignOutButton />
          </div>
        </div>
      </header>

      <section className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 sm:gap-8 sm:px-6 sm:py-10 lg:px-8 lg:py-14">
        <KycBanner status={status} submission={submission} />

        <div className="grid gap-5 rounded-3xl border border-border/70 bg-card/80 p-5 shadow-sm backdrop-blur sm:gap-6 sm:rounded-[2rem] sm:p-8 lg:grid-cols-[minmax(0,1.1fr)_320px] lg:items-end">
          <div className="space-y-4">
            <span className="inline-flex w-fit rounded-full border border-border/70 bg-muted/60 px-3 py-1 text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground sm:text-xs sm:tracking-[0.2em]">
              Espace pro
            </span>

            <div className="space-y-3">
              <h1 className="max-w-3xl font-heading text-2xl font-semibold tracking-tight sm:text-3xl lg:text-4xl">
                Gérez vos prestations et votre profil pro
              </h1>
              <p className="max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
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
            cataloguesCount={cataloguesCount}
          />
        </div>

        {canPublish ? <AdminServicesPanel plan={plan} /> : <KycGateCard status={status} />}
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
}: {
  status: KycStatus
  submission: KycSubmission | null
}) {
  if (status === "none") {
    return (
      <BannerShell tone="amber" Icon={ShieldAlert} eyebrow="Action requise">
        <h2 className="text-base font-semibold sm:text-lg">
          Soumettez votre vérification pour pouvoir publier vos services.
        </h2>
        <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
          Quelques minutes suffisent. Dès que vous l&apos;envoyez, vous pouvez
          publier vos prestations pendant que notre équipe vérifie votre dossier.
        </p>
        <BannerCta href="/admin/kyc" label="Commencer le KYC" tone="amber" />
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
      <BannerShell tone="emerald" Icon={CheckCircle2} eyebrow="Profil vérifié">
        <h2 className="text-base font-semibold sm:text-lg">
          Votre KYC est validé. Vous pouvez publier librement.
        </h2>
      </BannerShell>
    )
  }

  if (status === "rejected" && submission) {
    return (
      <BannerShell tone="amber" Icon={ShieldAlert} eyebrow="Document à fournir">
        <h2 className="text-base font-semibold sm:text-lg">
          Notre équipe a besoin d&apos;un complément pour valider votre profil.
        </h2>
        {submission.rejectionReason ? (
          <blockquote className="rounded-2xl border border-amber-500/30 bg-amber-500/5 px-4 py-3 text-sm leading-6 text-amber-900 dark:text-amber-200">
            {submission.rejectionReason}
          </blockquote>
        ) : null}
        {submission.rejectionDeadline ? (
          <p className="text-sm text-muted-foreground">
            Délai restant : <Countdown deadline={submission.rejectionDeadline} />.
            Passé ce délai, votre compte sera bloqué jusqu&apos;à correction.
          </p>
        ) : null}
        <BannerCta
          href="/admin/kyc"
          label="Mettre à jour mon KYC"
          tone="amber"
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

type BannerTone = "amber" | "blue" | "emerald" | "red"

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
      className={`overflow-hidden rounded-3xl border p-5 shadow-sm sm:rounded-[2rem] sm:p-6 ${c.container}`}
    >
      <div className="flex items-start gap-4">
        <span
          className={`flex size-10 shrink-0 items-center justify-center rounded-2xl ring-1 ${c.icon}`}
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
      : tone === "amber"
        ? "bg-amber-400 text-amber-950 hover:bg-amber-300 shadow-lg shadow-amber-500/20"
        : "bg-foreground text-background"
  return (
    <Link
      href={href}
      className={`inline-flex w-fit items-center gap-2 rounded-2xl px-5 py-2.5 text-sm font-semibold transition-colors ${cls}`}
    >
      {label}
      <ArrowRight className="size-4" />
    </Link>
  )
}

function Countdown({ deadline }: { deadline: string }) {
  const remaining = new Date(deadline).getTime() - Date.now()
  if (remaining <= 0) return <span>écoulé</span>

  const hours = Math.floor(remaining / (60 * 60 * 1000))
  const minutes = Math.floor((remaining % (60 * 60 * 1000)) / (60 * 1000))

  if (hours >= 24) {
    const days = Math.floor(hours / 24)
    const remHours = hours % 24
    return (
      <strong className="font-semibold text-foreground">
        {days} j {remHours} h
      </strong>
    )
  }

  return (
    <strong className="font-semibold text-foreground">
      {hours} h {minutes.toString().padStart(2, "0")} min
    </strong>
  )
}

function KycGateCard({ status }: { status: KycStatus }) {
  const blocked = status === "blocked"
  return (
    <div className="rounded-3xl border border-dashed border-border bg-card/50 p-8 text-center backdrop-blur sm:rounded-[2rem] sm:p-12">
      <div
        className={`mx-auto inline-flex size-12 items-center justify-center rounded-2xl ${
          blocked ? "bg-red-500/15" : "bg-muted"
        }`}
      >
        {blocked ? (
          <ShieldX className="size-6 text-red-500" />
        ) : (
          <ShieldAlert className="size-6 text-muted-foreground" />
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
        className={`mt-5 inline-flex items-center gap-2 rounded-2xl px-5 py-3 text-sm font-semibold shadow-lg transition-colors ${
          blocked
            ? "bg-red-500 text-white shadow-red-500/30 hover:bg-red-400"
            : "bg-amber-400 text-amber-950 shadow-amber-500/20 hover:bg-amber-300"
        }`}
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
  cataloguesCount,
}: {
  plan: Plan
  limits: { servicesPerDay: number; cataloguesMax: number }
  todayCount: number
  cataloguesCount: number
}) {
  const servicesLimitDisplay = Number.isFinite(limits.servicesPerDay)
    ? `${todayCount}/${limits.servicesPerDay}`
    : `${todayCount} (illimité)`
  const cataloguesLimitDisplay = Number.isFinite(limits.cataloguesMax)
    ? `${cataloguesCount}/${limits.cataloguesMax}`
    : `${cataloguesCount} (illimité)`

  return (
    <div className="grid gap-4 rounded-3xl border border-amber-400/30 bg-linear-to-br from-amber-400/10 via-amber-500/5 to-transparent p-5 shadow-sm">
      <div className="flex items-center justify-between gap-2">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-amber-700 dark:text-amber-300">
            Mon forfait
          </p>
          <p className="text-lg font-semibold">{PLAN_LABEL[plan]}</p>
        </div>
        <Crown className="size-6 text-amber-500" />
      </div>

      <ul className="space-y-1.5 text-sm">
        <li className="flex items-center justify-between gap-2">
          <span className="text-muted-foreground">Prestations aujourd&apos;hui</span>
          <strong>{servicesLimitDisplay}</strong>
        </li>
        <li className="flex items-center justify-between gap-2">
          <span className="text-muted-foreground">Catalogues</span>
          <strong>{cataloguesLimitDisplay}</strong>
        </li>
      </ul>

      {plan !== "premium" ? (
        <Link
          href="/admin/plans"
          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-amber-400 px-5 py-2.5 text-sm font-semibold text-amber-950 shadow-lg shadow-amber-500/20 transition-colors hover:bg-amber-300"
        >
          <Sparkles className="size-4" />
          Passer à un plan supérieur
          <ArrowRight className="size-4" />
        </Link>
      ) : (
        <p className="text-center text-xs text-amber-700 dark:text-amber-200">
          Vous êtes sur le forfait le plus complet 🎉
        </p>
      )}
    </div>
  )
}
