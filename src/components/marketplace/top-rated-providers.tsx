import Link from "next/link";
import { ChevronRight, Star, Trophy, UserRound } from "lucide-react";
import type { TopProvider } from "@/src/lib/reviews-store";
import {
  MARKETPLACE_TONES,
  getMarketplaceRoleLabel,
  getMarketplaceToneKey,
} from "@/src/components/marketplace/marketplace-theme";
import { cn } from "@/src/lib/utils";

export function TopRatedProviders({ providers }: { providers: TopProvider[] }) {
  if (providers.length === 0) return null;

  return (
    <section className="space-y-5 border-b border-white/10 pb-8 sm:pb-10">
      <div className="flex items-end justify-between gap-3">
        <div className="space-y-2">
          <span className="inline-flex items-center gap-2 rounded-full border border-amber-400/25 bg-amber-400/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.22em] text-amber-200 backdrop-blur">
            <Trophy className="size-3.5" />
            Coiffeurs les mieux notés
          </span>
          <p className="max-w-xl text-sm leading-6 text-white/55">
            Découvrez les professionnels les plus appréciés par la clientèle.
            Touchez un profil pour voir ses prestations et ses avis.
          </p>
        </div>
      </div>

      <div className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2 sm:grid sm:snap-none sm:grid-cols-2 sm:overflow-visible lg:grid-cols-3">
        {providers.map((provider, index) => (
          <ProviderCard key={provider.providerId} provider={provider} rank={index + 1} />
        ))}
      </div>
    </section>
  );
}

function ProviderCard({
  provider,
  rank,
}: {
  provider: TopProvider;
  rank: number;
}) {
  const toneKey = getMarketplaceToneKey(provider.gender, provider.category);
  const tone = MARKETPLACE_TONES[toneKey];
  const roleLabel = getMarketplaceRoleLabel(toneKey);

  return (
    <Link
      href={`/marketplace/${provider.serviceId}`}
      className={cn(
        "group/provider relative flex min-w-[80%] shrink-0 snap-start items-center gap-4 overflow-hidden rounded-3xl border border-white/10 bg-linear-to-br from-zinc-800/60 via-zinc-900/70 to-zinc-950/90 p-4 shadow-[0_10px_40px_-12px_rgba(0,0,0,0.7),inset_0_1px_0_rgba(255,255,255,0.06)] backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 sm:min-w-0",
        tone.cardHover,
      )}
    >
      <span
        aria-hidden
        className="absolute top-3 right-3 text-3xl font-bold leading-none text-white/5"
      >
        #{rank}
      </span>

      <span
        className={cn(
          "relative flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl border",
          tone.avatar,
        )}
      >
        {provider.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={provider.image} alt="" className="size-full object-cover" />
        ) : (
          <UserRound className={cn("size-7", tone.icon)} />
        )}
      </span>

      <div className="min-w-0 flex-1 space-y-1.5">
        <p className="truncate text-base font-semibold tracking-tight text-white">
          {provider.name}
        </p>
        <p className={cn("text-xs font-medium capitalize", tone.textSoft)}>
          {roleLabel}
          {provider.city ? (
            <span className="text-white/40"> · {provider.city}</span>
          ) : null}
        </p>
        <div className="flex items-center gap-2 text-xs">
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-400/10 px-2 py-1 text-amber-100">
            <Star className="size-3.5 fill-current text-amber-300" />
            <strong className="font-semibold">
              {provider.rating.toFixed(1).replace(".", ",")}
            </strong>
            <span className="text-amber-100/60">
              ({provider.reviewCount})
            </span>
          </span>
          <span className="inline-flex items-center gap-0.5 text-white/40 transition-colors group-hover/provider:text-white/70">
            Voir le profil
            <ChevronRight className="size-3.5" />
          </span>
        </div>
      </div>
    </Link>
  );
}
