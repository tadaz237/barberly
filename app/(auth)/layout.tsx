import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { ShieldCheck, Sparkles, Store } from "lucide-react";
import { getGender } from "@/src/lib/gender";
import { cn } from "@/src/lib/utils";

const features = [
  {
    Icon: ShieldCheck,
    title: "Confiance d'abord",
    description: "Des profils vérifiés pour réserver et publier avec sérénité.",
  },
  {
    Icon: Store,
    title: "La beauté se rapproche",
    description: "Une vitrine claire pour trouver le bon talent près de chez soi.",
  },
  {
    Icon: Sparkles,
    title: "Chaque style compte",
    description: "Des prestations soignées, visibles, et simples à réserver.",
  },
];

const AUTH_LAYOUT_TONES = {
  male: {
    badge: "border-white/15 bg-white/10 text-white/80",
    cardHover:
      "hover:border-amber-400/30 hover:shadow-[0_24px_60px_-12px_rgba(251,191,36,0.25),inset_0_1px_0_rgba(255,255,255,0.12)]",
    glow: "bg-amber-400/15 group-hover/feature:bg-amber-400/30",
    iconWrap:
      "from-amber-400/25 via-amber-500/15 to-amber-600/5 ring-amber-400/30",
    icon: "text-amber-200 drop-shadow-[0_0_8px_rgba(251,191,36,0.45)]",
  },
  female: {
    badge: "border-pink-400/20 bg-pink-400/10 text-pink-100",
    cardHover:
      "hover:border-pink-400/30 hover:shadow-[0_24px_60px_-12px_rgba(244,114,182,0.24),inset_0_1px_0_rgba(255,255,255,0.12)]",
    glow: "bg-pink-400/15 group-hover/feature:bg-pink-400/30",
    iconWrap:
      "from-pink-400/25 via-fuchsia-500/15 to-purple-600/5 ring-pink-400/30",
    icon: "text-pink-200 drop-shadow-[0_0_8px_rgba(244,114,182,0.45)]",
  },
};

export default async function AuthLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  const gender = await getGender();
  const accent = AUTH_LAYOUT_TONES[gender ?? "male"];

  return (
    <div className="relative min-h-screen overflow-hidden bg-black text-white">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-size-[56px_56px] opacity-60"
      />

      <header className="relative flex items-center px-4 pt-3 pb-2 sm:px-10 sm:pt-5 lg:hidden">
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
            className="h-12 w-auto sm:h-16"
          />
        </Link>
      </header>

      <div className="relative flex flex-col lg:grid lg:min-h-screen lg:grid-cols-[1.1fr_0.9fr]">
        <section className="order-2 flex flex-col gap-5 px-4 pb-8 sm:gap-6 sm:px-10 sm:pb-10 lg:order-1 lg:gap-8 lg:px-14 lg:py-10">
          <Link
            href="/"
            aria-label="Barberly · accueil"
            className="hidden lg:inline-flex lg:items-center lg:transition-opacity lg:hover:opacity-90"
          >
            <Image
              src="/barberly.png"
              alt="Barberly"
              width={400}
              height={120}
              priority
              className="h-20 w-auto"
            />
          </Link>

          <div className="hidden max-w-xl space-y-3 lg:block">
            <span
              className={cn(
                "inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.28em] backdrop-blur",
                accent.badge,
              )}
            >
              <Sparkles className="size-3.5" />
              Espace authentification
            </span>
            <h1 className="max-w-lg text-3xl font-semibold tracking-tight text-white xl:text-4xl">
              Barberly rapproche les talents coiffure de celles et ceux qui les cherchent.
            </h1>
            <p className="max-w-xl text-sm leading-6 text-white/60 xl:text-base xl:leading-7">
              Connectez-vous pour réserver, publier vos prestations ou gérer
              votre activité dans un espace simple, fiable et pensé pour le quotidien.
            </p>
          </div>

          <div className="grid gap-3 perspective-[1400px] sm:grid-cols-3 sm:gap-4">
            {features.map(({ Icon, title, description }) => (
              <article
                key={title}
                className={cn(
                  "group/feature relative overflow-hidden rounded-2xl border border-white/10 bg-linear-to-br from-zinc-800/70 via-zinc-900/80 to-zinc-950/90 p-4 shadow-[0_10px_40px_-12px_rgba(0,0,0,0.7),inset_0_1px_0_rgba(255,255,255,0.06)] backdrop-blur-xl transition-all duration-500 ease-out will-change-transform sm:p-5 lg:hover:transform-[translateY(-6px)_rotateX(5deg)_scale(1.02)]",
                  accent.cardHover,
                )}
              >
                <span
                  aria-hidden
                  className={cn(
                    "pointer-events-none absolute -top-12 -right-12 size-32 rounded-full blur-3xl transition-opacity duration-500",
                    accent.glow,
                  )}
                />
                <span
                  aria-hidden
                  className="pointer-events-none absolute inset-x-4 top-0 h-px bg-linear-to-r from-transparent via-white/30 to-transparent sm:inset-x-5"
                />

                <span
                  className={cn(
                    "relative mb-3 inline-flex size-9 items-center justify-center rounded-xl bg-linear-to-br shadow-inner shadow-black/40 ring-1 sm:size-10 sm:rounded-2xl",
                    accent.iconWrap,
                  )}
                >
                  <Icon className={cn("size-4 sm:size-5", accent.icon)} />
                </span>

                <h2 className="relative text-sm font-semibold tracking-tight text-white sm:text-base">
                  {title}
                </h2>
                <p className="relative mt-1 text-xs leading-5 text-white/55 sm:text-sm sm:leading-6">
                  {description}
                </p>
              </article>
            ))}
          </div>
        </section>

        <main className="order-1 flex items-start justify-center px-4 py-2 sm:px-10 sm:py-4 lg:order-2 lg:items-center lg:px-14 lg:py-10">
          {children}
        </main>
      </div>
    </div>
  );
}
