import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Check, ChevronRight, Scissors, Sparkles } from "lucide-react";
import { selectRole } from "@/src/lib/role-actions";
import { getUserRole, type UserRole } from "@/src/lib/user-role";
import { auth } from "@/src/lib/auth";

type RoleCard = {
  role: UserRole;
  Icon: typeof Sparkles;
  badge: string;
  title: string;
  description: string;
  cta: string;
  accent: string;
  accentRing: string;
  accentText: string;
  accentBlob: string;
  accentHoverShadow: string;
  accentHoverBorder: string;
};

const roles: RoleCard[] = [
  {
    role: "client",
    Icon: Sparkles,
    badge: "Je suis cliente · client",
    title: "Réservez votre coiffeur idéal",
    description:
      "Parcourez les coiffeuses et coiffeurs à domicile près de chez vous, comparez les prestations et réservez en quelques clics.",
    cta: "Explorer la marketplace",
    accent: "from-pink-400/20 via-fuchsia-500/10 to-purple-600/5",
    accentRing: "ring-pink-400/30",
    accentText: "text-pink-200",
    accentBlob: "bg-pink-400/20",
    accentHoverShadow: "hover:shadow-[0_24px_60px_-12px_rgba(244,114,182,0.3)]",
    accentHoverBorder: "hover:border-pink-400/40",
  },
  {
    role: "coiffeur",
    Icon: Scissors,
    badge: "Je suis coiffeuse · coiffeur",
    title: "Rejoignez la plateforme",
    description:
      "Créez votre espace pro, publiez vos prestations et recevez des demandes de clientes prêtes à réserver.",
    cta: "Créer mon compte pro",
    accent: "from-amber-400/25 via-amber-500/15 to-amber-600/5",
    accentRing: "ring-amber-400/30",
    accentText: "text-amber-200",
    accentBlob: "bg-amber-400/20",
    accentHoverShadow: "hover:shadow-[0_24px_60px_-12px_rgba(251,191,36,0.3)]",
    accentHoverBorder: "hover:border-amber-400/40",
  },
];

const ROLE_LABEL: Record<UserRole, string> = {
  client: "client",
  coiffeur: "coiffeur",
};

export default async function Home() {
  const [currentRole, session] = await Promise.all([getUserRole(), auth()]);
  const isConnected = Boolean(session?.user?.id);
  return (
    <main className="relative min-h-screen overflow-hidden bg-black text-white">
      <div
        aria-hidden
        className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-size-[56px_56px] opacity-60"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -top-32 left-1/2 size-[40rem] -translate-x-1/2 rounded-full bg-amber-400/10 blur-[120px]"
      />

      <div className="relative mx-auto flex min-h-screen w-full max-w-6xl flex-col px-4 py-3 sm:px-10 sm:py-4 lg:px-14">
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
              className="h-14 w-auto sm:h-20 lg:h-28"
            />
          </Link>

          <Link
            href={isConnected ? "/admin" : "/login"}
            className="inline-flex shrink-0 items-center gap-1 text-xs font-medium text-white/70 transition-colors hover:text-amber-200 sm:text-sm"
          >
            <span className="hidden sm:inline">
              {isConnected ? "Vous êtes connecté" : "Déjà inscrit ?"}
            </span>
            <span className="text-amber-300 underline-offset-4 hover:underline">
              {isConnected ? "Mon espace" : "Se connecter"}
            </span>
            <ChevronRight className="size-4" />
          </Link>
        </header>

        <section className="flex flex-1 flex-col items-center pt-0 pb-4">
          <div className="max-w-2xl space-y-3 text-center">
            {currentRole ? (
              <span className="inline-flex items-center gap-2 rounded-full border border-amber-400/30 bg-amber-400/10 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.22em] text-amber-200 backdrop-blur sm:px-4 sm:py-2 sm:text-xs sm:tracking-[0.28em]">
                <Check className="size-3.5" />
                Choix précédent : {ROLE_LABEL[currentRole]}
              </span>
            ) : (
              <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/4 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.22em] text-white/70 backdrop-blur sm:px-4 sm:py-2 sm:text-xs sm:tracking-[0.28em]">
                <Sparkles className="size-3.5" />
                Bienvenue
              </span>
            )}

            <h1 className="text-balance text-3xl font-semibold tracking-tight sm:text-4xl md:text-5xl lg:text-6xl">
              D&apos;abord, dites-nous{" "}
              <span className="bg-linear-to-r from-amber-300 via-amber-400 to-amber-500 bg-clip-text text-transparent">
                qui vous êtes
              </span>
              .
            </h1>

            <p className="mx-auto max-w-xl text-sm leading-6 text-white/60 sm:text-base sm:leading-7 lg:text-lg">
              Notre plateforme connecte les coiffeuses et coiffeurs à domicile
              avec une clientèle exigeante. Choisissez votre profil pour
              continuer.
            </p>
          </div>

          <div className="mt-4 grid w-full max-w-3xl gap-4 perspective-[1600px] sm:grid-cols-2">
            {roles.map(
              ({
                role,
                Icon,
                badge,
                title,
                description,
                cta,
                accent,
                accentRing,
                accentText,
                accentBlob,
                accentHoverShadow,
                accentHoverBorder,
              }) => {
                const isCurrent = currentRole === role;
                return (
                  <form key={role} action={selectRole} className="flex">
                    <input type="hidden" name="role" value={role} />
                    <button
                      type="submit"
                      aria-pressed={isCurrent}
                      className={`group/role relative flex h-full w-full flex-col overflow-hidden rounded-3xl border bg-linear-to-br from-zinc-800/70 via-zinc-900/85 to-zinc-950/95 p-6 text-left shadow-[0_10px_40px_-12px_rgba(0,0,0,0.7),inset_0_1px_0_rgba(255,255,255,0.06)] backdrop-blur-xl transition-all duration-500 ease-out will-change-transform hover:-translate-y-2 ${accentHoverBorder} ${accentHoverShadow} hover:transform-[translateY(-8px)_rotateX(4deg)_scale(1.015)] ${
                        isCurrent
                          ? "border-amber-400/50 ring-2 ring-amber-400/30"
                          : "border-white/10"
                      }`}
                    >
                      <span
                        aria-hidden
                        className={`pointer-events-none absolute -top-20 -right-16 size-48 rounded-full blur-3xl transition-opacity duration-500 ${accentBlob} group-hover/role:opacity-90`}
                      />
                      <span
                        aria-hidden
                        className="pointer-events-none absolute inset-x-6 top-0 h-px bg-linear-to-r from-transparent via-white/30 to-transparent"
                      />

                      {isCurrent ? (
                        <span className="absolute top-4 right-4 inline-flex items-center gap-1 rounded-full bg-amber-400/15 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-amber-200 ring-1 ring-amber-400/30">
                          <Check className="size-3" />
                          Sélectionné
                        </span>
                      ) : null}

                      <div className="relative flex flex-1 flex-col gap-3.5">
                        <span
                          className={`inline-flex size-11 items-center justify-center rounded-2xl bg-linear-to-br shadow-inner shadow-black/40 ring-1 ${accent} ${accentRing}`}
                        >
                          <Icon
                            className={`size-5 ${accentText} drop-shadow-[0_0_10px_currentColor]`}
                          />
                        </span>

                        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/55">
                          {badge}
                        </p>

                        <h2 className="text-lg font-semibold tracking-tight text-white sm:text-xl">
                          {title}
                        </h2>

                        <p className="text-[13px] leading-5 text-white/60">
                          {description}
                        </p>

                        <div
                          className={`mt-auto inline-flex items-center gap-2 pt-3 text-xs font-semibold ${accentText} transition-all group-hover/role:gap-3`}
                        >
                          {cta}
                          <ArrowRight className="size-4" />
                        </div>
                      </div>
                    </button>
                  </form>
                );
              },
            )}
          </div>
        </section>

        <footer className="border-t border-white/10 pt-6 text-center text-xs text-white/40">
          Vous pourrez changer de profil plus tard depuis votre espace.
        </footer>
      </div>
    </main>
  );
}
