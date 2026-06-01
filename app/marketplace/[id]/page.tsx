import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  CalendarCheck,
  Clock3,
  Crown,
  MapPin,
  Phone,
  ShieldCheck,
  Sparkles,
  Star,
  TrendingUp,
  UserRound,
} from "lucide-react";
import { ImageLightbox } from "@/src/components/ui/image-lightbox";
import { ReservationCta } from "@/src/components/marketplace/reservation-cta";
import {
  MARKETPLACE_TONES,
  getMarketplaceRoleLabel,
  getMarketplaceRoleTitle,
  getMarketplaceToneKey,
  type MarketplaceTone,
  type MarketplaceToneKey,
} from "@/src/components/marketplace/marketplace-theme";
import { getCataloguesByOwner } from "@/src/lib/catalogues-store";
import { auth } from "@/src/lib/auth";
import {
  getProviderReviewSummary,
  getProviderReviews,
  type ReviewItem,
  type ReviewSummary,
} from "@/src/lib/reviews-store";
import { hasActiveReservationForService } from "@/src/lib/reservations-store";
import { getServiceById } from "@/src/lib/services-store";
import { getUserById } from "@/src/lib/users-store";
import { cn } from "@/src/lib/utils";

export default async function ServiceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const service = await getServiceById(id);

  if (!service) {
    notFound();
  }

  const session = await auth();
  const [
    coiffeur,
    catalogues,
    currentUser,
    reviewSummary,
    reviews,
    hasActiveReservation,
  ] =
    await Promise.all([
      service.ownerId ? getUserById(service.ownerId) : Promise.resolve(null),
      service.ownerId
        ? getCataloguesByOwner(service.ownerId)
        : Promise.resolve([]),
      session?.user?.id ? getUserById(session.user.id) : Promise.resolve(null),
      service.ownerId
        ? getProviderReviewSummary(service.ownerId)
        : Promise.resolve({ average: 0, count: 0 }),
      service.ownerId ? getProviderReviews(service.ownerId) : Promise.resolve([]),
      session?.user?.id
        ? hasActiveReservationForService({
            serviceId: service.id,
            clientId: session.user.id,
          })
        : Promise.resolve(false),
    ]);
  const toneKey = getMarketplaceToneKey(
    service.ownerGender ?? coiffeur?.gender,
    service.category,
  );
  const tone = MARKETPLACE_TONES[toneKey];
  const roleLabel = getMarketplaceRoleLabel(toneKey);
  const fallbackProviderName =
    toneKey === "male" ? "ce coiffeur" : "cette coiffeuse";

  return (
    <main className="relative min-h-screen overflow-hidden bg-black text-white">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.04)_1px,transparent_1px)] bg-size-[56px_56px] opacity-60"
      />

      <header className="relative border-b border-white/5 backdrop-blur">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6 sm:py-4 lg:px-8">
          <Link
            href="/"
            aria-label="Barberly · accueil"
            className="inline-flex items-center transition-opacity hover:opacity-90"
          >
            <Image
              src="/barberly.png"
              alt="Barberly"
              width={400}
              height={120}
              priority
              className="h-10 w-auto sm:h-14"
            />
          </Link>

          <Link
            href="/marketplace"
            className={cn(
              "inline-flex items-center gap-1.5 text-xs font-medium text-white/70 transition-colors sm:text-sm",
              tone.linkHover,
            )}
          >
            <ArrowLeft className="size-4" />
            Retour à la marketplace
          </Link>
        </div>
      </header>

      <div className="relative mx-auto w-full max-w-6xl space-y-8 px-4 py-6 sm:px-6 sm:py-10 lg:px-8 lg:py-12">
        <article className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
          <div
            className={cn(
              "relative overflow-hidden rounded-3xl border border-white/10 bg-linear-to-br shadow-[0_20px_60px_-20px_rgba(0,0,0,0.8)] sm:rounded-[2rem]",
              tone.detailMediaBg,
            )}
          >
            {service.image ? (
              <ImageLightbox src={service.image} alt={`Photo de ${service.name}`}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={service.image}
                  alt={`Photo de ${service.name}`}
                  className="aspect-video w-full object-cover sm:aspect-4/3"
                />
              </ImageLightbox>
            ) : (
              <div className="flex aspect-video items-center justify-center sm:aspect-4/3">
                <Sparkles className={cn("size-16", tone.placeholderIconSoft)} />
              </div>
            )}
            <div className="absolute top-4 left-4 flex flex-wrap gap-2">
              <span className="inline-flex rounded-full bg-zinc-950/70 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/80 backdrop-blur">
                {service.category}
              </span>
              {service.featured ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-400 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-zinc-950 shadow-lg shadow-amber-500/30">
                  <Star className="size-3 fill-current" />
                  Vedette
                </span>
              ) : null}
            </div>
          </div>

          <div className="flex flex-col gap-5 rounded-3xl border border-white/10 bg-linear-to-br from-zinc-800/60 via-zinc-900/70 to-zinc-950/90 p-6 shadow-[0_20px_60px_-20px_rgba(0,0,0,0.8)] backdrop-blur sm:rounded-[2rem] sm:p-8">
            <div className="space-y-3">
              <h1 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">
                {service.name}
              </h1>
              <p className="text-sm leading-6 text-white/65">
                {service.description}
              </p>
            </div>

            <dl className="grid gap-3 rounded-2xl bg-white/5 p-4 text-sm">
              <DetailRow
                icon={<MapPin className={cn("size-4", tone.icon)} />}
                label="Zone d'intervention"
                value={`${service.city} · ${service.neighborhood}`}
              />
              <DetailRow
                icon={<Clock3 className={cn("size-4", tone.icon)} />}
                label="Durée"
                value={`${service.duration} min`}
              />
              <DetailRow
                icon={<CalendarCheck className={cn("size-4", tone.icon)} />}
                label="Tarif"
                value={`${service.price.toLocaleString("fr-FR")} FCFA`}
              />
            </dl>

            <ReservationCta
              serviceId={service.id}
              serviceName={service.name}
              servicePrice={service.price}
              serviceDurationMin={service.duration}
              isOwnService={
                Boolean(currentUser?.id) && currentUser?.id === service.ownerId
              }
              hasActiveReservation={hasActiveReservation}
              ownerGender={service.ownerGender ?? coiffeur?.gender}
              serviceCategory={service.category}
              viewer={
                currentUser
                  ? {
                      name: currentUser.name,
                      email: currentUser.email,
                      phone: currentUser.phone,
                    }
                  : null
              }
            />

            <p className="text-center text-[11px] text-white/40">
              Réservation directe — confirmation par votre {roleLabel}.
            </p>
          </div>
        </article>

        <CoiffeurCard
          coiffeur={coiffeur}
          tone={tone}
          toneKey={toneKey}
          reviewSummary={reviewSummary}
        />

        <ReviewsSection reviews={reviews} tone={tone} />

        {catalogues.length > 0 ? (
          <section className="space-y-5">
            <div className="space-y-1">
              <p
                className={cn(
                  "text-[11px] font-semibold uppercase tracking-[0.22em]",
                  tone.text,
                )}
              >
                Portfolio
              </p>
              <h2 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">
                Catalogues de réalisations
              </h2>
              <p className="text-sm text-white/55">
                Les coiffures déjà réalisées par{" "}
                {coiffeur?.name ?? fallbackProviderName}.
              </p>
            </div>

            <div className="space-y-6">
              {catalogues.map((cat) => (
                <article
                  key={cat.id}
                  className="rounded-3xl border border-white/10 bg-linear-to-br from-zinc-800/60 via-zinc-900/70 to-zinc-950/90 p-5 backdrop-blur sm:p-6"
                >
                  <div className="mb-4 space-y-1">
                    <h3 className="text-lg font-semibold text-white">
                      {cat.name}
                    </h3>
                    {cat.description ? (
                      <p className="text-sm text-white/55">{cat.description}</p>
                    ) : null}
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {cat.photos.map((photo) => (
                      <figure
                        key={photo.id}
                        className="overflow-hidden rounded-2xl border border-white/10 bg-white/5"
                      >
                        <ImageLightbox
                          src={photo.image}
                          alt={photo.caption ?? "Photo du catalogue"}
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={photo.image}
                            alt={photo.caption ?? "Photo du catalogue"}
                            className="aspect-square w-full object-cover"
                          />
                        </ImageLightbox>
                        {photo.caption || photo.price !== undefined ? (
                          <figcaption className="flex items-center justify-between gap-2 px-3 py-2 text-[11px]">
                            <span className="truncate text-white/65">
                              {photo.caption ?? ""}
                            </span>
                            {photo.price !== undefined ? (
                              <span
                                className={cn(
                                  "shrink-0 rounded-full px-2 py-0.5 font-semibold",
                                  tone.chip,
                                )}
                              >
                                {photo.price.toLocaleString("fr-FR")} FCFA
                              </span>
                            ) : null}
                          </figcaption>
                        ) : null}
                      </figure>
                    ))}
                  </div>
                </article>
              ))}
            </div>
          </section>
        ) : null}
      </div>
    </main>
  );
}

function DetailRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-white/45">
        {icon}
        {label}
      </dt>
      <dd className="text-right text-sm font-medium text-white">{value}</dd>
    </div>
  );
}

type CoiffeurInfo = {
  id: string;
  name: string;
  email: string;
  image?: string;
  phone?: string;
  bio?: string;
  gender?: "male" | "female";
  kycStatus?: "none" | "submitted" | "verified" | "rejected" | "blocked";
  plan?: "free" | "essential" | "pro" | "premium";
} | null | undefined;

function CoiffeurCard({
  coiffeur,
  tone,
  toneKey,
  reviewSummary,
}: {
  coiffeur: CoiffeurInfo;
  tone: MarketplaceTone;
  toneKey: MarketplaceToneKey;
  reviewSummary: ReviewSummary;
}) {
  const roleTitle = getMarketplaceRoleTitle(toneKey);

  if (!coiffeur) {
    return (
      <section className="rounded-3xl border border-dashed border-white/15 bg-white/3 p-6 text-center backdrop-blur sm:rounded-[2rem]">
        <p className="text-sm text-white/60">
          Cette prestation a été publiée par notre équipe de démonstration. Les
          informations du {getMarketplaceRoleLabel(toneKey)} seront disponibles
          dès qu&apos;un pro l&apos;aura adoptée.
        </p>
      </section>
    );
  }

  return (
    <section className="overflow-hidden rounded-3xl border border-white/10 bg-linear-to-br from-zinc-800/60 via-zinc-900/70 to-zinc-950/90 p-6 shadow-[0_20px_60px_-20px_rgba(0,0,0,0.8)] backdrop-blur sm:rounded-[2rem] sm:p-8">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
        <div
          className={cn(
            "flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl border",
            tone.avatar,
          )}
        >
          {coiffeur.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={coiffeur.image}
              alt={`Photo de ${coiffeur.name}`}
              className="size-full object-cover"
            />
          ) : (
            <UserRound className={cn("size-9", tone.iconSoft)} />
          )}
        </div>

        <div className="flex-1 space-y-3">
          <div className="space-y-2">
            <p
              className={cn(
                "text-[11px] font-semibold uppercase tracking-[0.22em]",
                tone.text,
              )}
            >
              {roleTitle}
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-xl font-semibold tracking-tight text-white sm:text-2xl">
                {coiffeur.name}
              </h2>
              <CoiffeurPlanBadge plan={coiffeur.plan} />
            </div>
            <RatingLine summary={reviewSummary} tone={tone} />
            {coiffeur.bio ? (
              <p className="text-sm leading-6 text-white/60">{coiffeur.bio}</p>
            ) : (
              <p className="text-sm leading-6 text-white/45">
                Profil en cours de complétion par le {getMarketplaceRoleLabel(toneKey)}.
              </p>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3 text-sm">
            {coiffeur.phone ? (
              <a
                href={`tel:${coiffeur.phone}`}
                className={cn(
                  "inline-flex items-center gap-2 rounded-xl border px-3.5 py-2 text-xs font-semibold transition-colors",
                  tone.softButton,
                )}
              >
                <Phone className="size-3.5" />
                {coiffeur.phone}
              </a>
            ) : (
              <span
                className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3.5 py-2 text-xs text-white/50"
                title={`${roleTitle} doit compléter sa vérification KYC pour afficher son numéro.`}
              >
                <ShieldCheck className="size-3.5" />
                Numéro disponible après KYC
              </span>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function RatingLine({
  summary,
  tone,
}: {
  summary: ReviewSummary;
  tone: MarketplaceTone;
}) {
  if (summary.count === 0) {
    return (
      <p className="text-xs text-white/40">
        Aucun avis vérifié pour le moment.
      </p>
    );
  }

  return (
    <p className="inline-flex items-center gap-2 text-sm text-white/70">
      <span className={cn("inline-flex items-center gap-1", tone.text)}>
        <Star className="size-4 fill-current" />
        <strong>{summary.average.toFixed(1).replace(".", ",")}/5</strong>
      </span>
      <span>
        {summary.count} avis vérifié{summary.count > 1 ? "s" : ""}
      </span>
    </p>
  );
}

function ReviewsSection({
  reviews,
  tone,
}: {
  reviews: ReviewItem[];
  tone: MarketplaceTone;
}) {
  if (reviews.length === 0) return null;

  return (
    <section className="space-y-4">
      <div className="space-y-1">
        <p
          className={cn(
            "text-[11px] font-semibold uppercase tracking-[0.22em]",
            tone.text,
          )}
        >
          Avis vérifiés
        </p>
        <h2 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">
          Retours de clients coiffés
        </h2>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {reviews.map((review) => (
          <article
            key={review.id}
            className="rounded-3xl border border-white/10 bg-white/[0.04] p-5 backdrop-blur"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-semibold text-white">{review.clientName}</p>
                <p className="text-xs text-white/45">{review.serviceName}</p>
              </div>
              <span className={cn("inline-flex items-center gap-1 text-sm font-semibold", tone.text)}>
                <Star className="size-4 fill-current" />
                {review.rating}/5
              </span>
            </div>
            {review.comment ? (
              <p className="mt-3 text-sm leading-6 text-white/62">
                {review.comment}
              </p>
            ) : null}
          </article>
        ))}
      </div>
    </section>
  );
}

function CoiffeurPlanBadge({
  plan,
}: {
  plan?: "free" | "essential" | "pro" | "premium";
}) {
  if (!plan || plan === "free") return null;
  if (plan === "premium") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-amber-400 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em] text-amber-950 shadow-lg shadow-amber-500/30">
        <Crown className="size-3" />
        Premium
      </span>
    );
  }
  if (plan === "pro") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-violet-500 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em] text-white shadow-lg shadow-violet-500/30">
        <TrendingUp className="size-3" />
        Pro
      </span>
    );
  }
  if (plan === "essential") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-sky-500 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em] text-white shadow">
        <Sparkles className="size-3" />
        Essentiel
      </span>
    );
  }
  return null;
}
