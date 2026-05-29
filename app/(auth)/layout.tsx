import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { ShieldCheck, Sparkles, Store } from "lucide-react";

const features = [
  {
    Icon: ShieldCheck,
    title: "Base propre",
    description: "Routes App Router isolées dans un groupe (auth).",
  },
  {
    Icon: Store,
    title: "Cohérence produit",
    description: "Design aligné avec une plateforme beauté / coiffure.",
  },
  {
    Icon: Sparkles,
    title: "Prête à brancher",
    description: "Interface prête pour une Server Action ou un provider d'auth.",
  },
];

export default function AuthLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
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
            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.28em] text-white/80 backdrop-blur">
              <Sparkles className="size-3.5" />
              Espace authentification
            </span>
            <h1 className="max-w-lg text-3xl font-semibold tracking-tight text-white xl:text-4xl">
              Un point d&apos;entrée clair pour les clientes et l&apos;admin.
            </h1>
            <p className="max-w-xl text-sm leading-6 text-white/60 xl:text-base xl:leading-7">
              Le projet est structuré autour d&apos;une marketplace et d&apos;un
              espace admin. Cette zone auth prépare les routes dédiées à la
              connexion et à l&apos;inscription.
            </p>
          </div>

          <div className="grid gap-3 perspective-[1400px] sm:grid-cols-3 sm:gap-4">
            {features.map(({ Icon, title, description }) => (
              <article
                key={title}
                className="group/feature relative overflow-hidden rounded-2xl border border-white/10 bg-linear-to-br from-zinc-800/70 via-zinc-900/80 to-zinc-950/90 p-4 shadow-[0_10px_40px_-12px_rgba(0,0,0,0.7),inset_0_1px_0_rgba(255,255,255,0.06)] backdrop-blur-xl transition-all duration-500 ease-out will-change-transform hover:border-amber-400/30 hover:shadow-[0_24px_60px_-12px_rgba(251,191,36,0.25),inset_0_1px_0_rgba(255,255,255,0.12)] sm:p-5 lg:hover:transform-[translateY(-6px)_rotateX(5deg)_scale(1.02)]"
              >
                <span
                  aria-hidden
                  className="pointer-events-none absolute -top-12 -right-12 size-32 rounded-full bg-amber-400/15 blur-3xl transition-opacity duration-500 group-hover/feature:bg-amber-400/30"
                />
                <span
                  aria-hidden
                  className="pointer-events-none absolute inset-x-4 top-0 h-px bg-linear-to-r from-transparent via-white/30 to-transparent sm:inset-x-5"
                />

                <span className="relative mb-3 inline-flex size-9 items-center justify-center rounded-xl bg-linear-to-br from-amber-400/25 via-amber-500/15 to-amber-600/5 shadow-inner shadow-black/40 ring-1 ring-amber-400/30 sm:size-10 sm:rounded-2xl">
                  <Icon className="size-4 text-amber-200 drop-shadow-[0_0_8px_rgba(251,191,36,0.45)] sm:size-5" />
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
