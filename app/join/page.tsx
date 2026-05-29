import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Crown, Flower2, Scissors } from "lucide-react";
import { selectGender } from "@/src/lib/actions/gender-actions";
import { getGender } from "@/src/lib/gender";

const cards = [
  {
    gender: "male" as const,
    title: "Je suis coiffeur",
    subtitle: "Coupe homme, dégradé, barbier, rasage",
    description:
      "Rejoignez la plateforme et publiez vos prestations destinées à une clientèle masculine et mixte.",
    accent: {
      container:
        "border-amber-400/40 bg-linear-to-br from-amber-400/15 via-amber-500/10 to-zinc-950 ring-1 ring-amber-400/30",
      blob: "bg-amber-400/25",
      pill: "bg-amber-400 text-amber-950",
      icon: "from-amber-400/30 via-amber-500/15 to-amber-600/5 ring-amber-400/40 text-amber-100",
      cta: "bg-amber-400 text-amber-950 hover:bg-amber-300 shadow-amber-500/30",
    },
    Icon: Scissors,
    pillLabel: "Univers homme",
  },
  {
    gender: "female" as const,
    title: "Je suis coiffeuse",
    subtitle: "Coupe femme, tresses, coloration, événement",
    description:
      "Mettez en avant votre savoir-faire et touchez une clientèle qui cherche un univers à votre image.",
    accent: {
      container:
        "border-pink-400/40 bg-linear-to-br from-pink-400/15 via-fuchsia-500/10 to-zinc-950 ring-1 ring-pink-400/40",
      blob: "bg-pink-400/30",
      pill: "bg-pink-400 text-pink-950",
      icon: "from-pink-400/30 via-fuchsia-500/15 to-purple-600/5 ring-pink-400/40 text-pink-100",
      cta: "bg-pink-400 text-pink-950 hover:bg-pink-300 shadow-pink-500/30",
    },
    Icon: Flower2,
    pillLabel: "Univers femme",
  },
];

export default async function JoinPage() {
  const currentGender = await getGender();

  return (
    <main className="relative min-h-screen overflow-hidden bg-black text-white">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-size-[56px_56px] opacity-60"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -top-32 right-1/4 size-[36rem] rounded-full bg-amber-400/10 blur-[120px]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-32 left-1/4 size-[36rem] rounded-full bg-pink-400/15 blur-[120px]"
      />

      <div className="relative mx-auto flex min-h-screen w-full max-w-6xl flex-col px-4 py-4 sm:px-10 sm:py-6 lg:px-14 lg:py-8">
        <header className="flex items-center justify-between gap-3">
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
              className="h-14 w-auto sm:h-20 lg:h-24"
            />
          </Link>

          <Link
            href="/"
            className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-medium text-white/70 transition-colors hover:bg-white/10 hover:text-white"
          >
            <ArrowLeft className="size-3.5" />
            Retour
          </Link>
        </header>

        <section className="flex flex-1 flex-col items-center pt-4">
          <div className="max-w-2xl space-y-3 text-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.22em] text-white/70 backdrop-blur">
              <Crown className="size-3.5" />
              Rejoindre la plateforme
            </span>
            <h1 className="text-balance text-3xl font-semibold tracking-tight sm:text-4xl md:text-5xl">
              D&apos;abord, vous êtes{" "}
              <span className="bg-linear-to-r from-amber-300 via-pink-300 to-fuchsia-300 bg-clip-text text-transparent">
                coiffeur ou coiffeuse
              </span>{" "}
              ?
            </h1>
            <p className="mx-auto max-w-xl text-sm leading-6 text-white/60 sm:text-base">
              On adapte le formulaire d&apos;inscription et votre espace pro à
              votre univers. Vous pourrez modifier votre choix plus tard.
            </p>
          </div>

          <div className="mt-8 grid w-full max-w-4xl gap-5 sm:grid-cols-2">
            {cards.map(
              ({ gender, title, subtitle, description, accent, Icon, pillLabel }) => {
                const isCurrent = currentGender === gender;
                return (
                  <form
                    key={gender}
                    action={selectGender}
                    className="flex"
                  >
                    <input type="hidden" name="gender" value={gender} />
                    <button
                      type="submit"
                      aria-pressed={isCurrent}
                      className={`group/role relative flex h-full w-full flex-col gap-5 overflow-hidden rounded-3xl border p-6 text-left shadow-[0_10px_40px_-12px_rgba(0,0,0,0.7),inset_0_1px_0_rgba(255,255,255,0.06)] backdrop-blur-xl transition-all duration-500 ease-out will-change-transform hover:-translate-y-2 ${accent.container}`}
                    >
                      <span
                        aria-hidden
                        className={`pointer-events-none absolute -top-20 -right-16 size-48 rounded-full blur-3xl transition-opacity duration-500 ${accent.blob} group-hover/role:opacity-90`}
                      />
                      <span
                        aria-hidden
                        className="pointer-events-none absolute inset-x-6 top-0 h-px bg-linear-to-r from-transparent via-white/30 to-transparent"
                      />

                      <span
                        className={`relative inline-flex size-12 items-center justify-center rounded-2xl bg-linear-to-br shadow-inner shadow-black/40 ring-1 ${accent.icon}`}
                      >
                        <Icon className="size-6" />
                      </span>

                      <div className="relative space-y-1">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.18em] ${accent.pill}`}
                        >
                          {pillLabel}
                        </span>
                        <h2 className="mt-2 text-xl font-semibold tracking-tight text-white sm:text-2xl">
                          {title}
                        </h2>
                        <p className="text-xs text-white/55">{subtitle}</p>
                      </div>

                      <p className="relative text-sm leading-6 text-white/65">
                        {description}
                      </p>

                      <span
                        className={`relative mt-auto inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-semibold shadow-lg transition-colors ${accent.cta}`}
                      >
                        Continuer
                        <ArrowRight className="size-4" />
                      </span>
                    </button>
                  </form>
                );
              },
            )}
          </div>

          <p className="mt-8 max-w-md text-center text-xs text-white/40">
            Déjà un compte ?{" "}
            <Link
              href="/login"
              className="font-semibold text-amber-200 underline-offset-4 hover:underline"
            >
              Se connecter
            </Link>
          </p>
        </section>
      </div>
    </main>
  );
}
