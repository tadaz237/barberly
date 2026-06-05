import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowLeft,
  Camera,
  Check,
  Crown,
  Rocket,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import { PlanSubscribeButton } from "@/src/components/admin/plan-subscribe-button";
import { auth } from "@/src/lib/auth";
import { PLAN_PRICES, type PaidPlan } from "@/src/lib/plans";
import { getUserById, getUserPlan, type Plan } from "@/src/lib/users-store";

type PlanCardData = {
  plan: PaidPlan;
  name: string;
  price: number;
  tagline: string;
  Icon: typeof Sparkles;
  highlight: boolean;
  perks: string[];
  cardAccent: string;
};

type PlansPageProps = {
  searchParams?: Promise<{ payment?: string | string[] }>;
};

const PLANS: PlanCardData[] = [
  {
    plan: "essential",
    name: "Essentiel",
    price: PLAN_PRICES.essential,
    tagline: "Pour démarrer sereinement et publier plus chaque jour.",
    Icon: Sparkles,
    highlight: false,
    perks: [
      "3 prestations par jour",
      "10 catalogues maximum",
      "10 photos par catalogue",
      "10 produits boutique",
      "Statistiques de base",
      "Support par e-mail",
    ],
    cardAccent:
      "border-sky-400/30 bg-linear-to-br from-sky-400/10 via-sky-500/5 to-transparent",
  },
  {
    plan: "pro",
    name: "Pro",
    price: PLAN_PRICES.pro,
    tagline: "Pour les coiffeurs actifs qui veulent gagner en visibilité.",
    Icon: TrendingUp,
    highlight: true,
    perks: [
      "6 prestations par jour",
      "20 catalogues maximum",
      "20 photos par catalogue",
      "20 produits boutique",
      "Boost dans le classement marketplace",
      "Badge Pro visible par les clientes",
      "Support prioritaire",
    ],
    cardAccent:
      "border-violet-400/40 bg-linear-to-br from-violet-400/15 via-purple-500/10 to-transparent ring-1 ring-violet-400/30",
  },
  {
    plan: "premium",
    name: "Premium",
    price: PLAN_PRICES.premium,
    tagline: "Pour les pros qui veulent être en tête, sans aucune limite.",
    Icon: Crown,
    highlight: false,
    perks: [
      "Prestations illimitées",
      "Catalogues illimités",
      "30 photos par catalogue",
      "Produits boutique illimités",
      "Top du classement marketplace",
      "Badge Premium dore",
      "Support dedie",
    ],
    cardAccent:
      "border-amber-400/40 bg-linear-to-br from-amber-400/15 via-amber-500/10 to-transparent",
  },
];

export default async function PlansPage({ searchParams }: PlansPageProps) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login?callbackUrl=/admin/plans");
  }
  const user = await getUserById(session.user.id);
  if (user?.role === "client") {
    redirect("/client");
  }
  const currentPlan: Plan = await getUserPlan(session.user.id);
  const query = searchParams ? await searchParams : {};
  const payment =
    typeof query.payment === "string" ? query.payment : query.payment?.[0];
  const paymentNotice = getPaymentNotice(payment);

  return (
    <main className="relative min-h-screen overflow-hidden bg-black text-white">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.04)_1px,transparent_1px)] bg-size-[56px_56px] opacity-60"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -top-40 left-1/2 size-[40rem] -translate-x-1/2 rounded-full bg-amber-400/10 blur-[120px]"
      />

      <div className="relative mx-auto w-full max-w-6xl space-y-10 px-4 py-6 sm:px-6 sm:py-10 lg:px-8 lg:py-12">
        <Link
          href="/admin"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-white/60 transition-colors hover:text-amber-200 sm:text-sm"
        >
          <ArrowLeft className="size-4" />
          Retour au tableau de bord
        </Link>

        <header className="mx-auto max-w-3xl space-y-4 text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-amber-400/30 bg-amber-400/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.22em] text-amber-200">
            <Rocket className="size-3.5" />
            Forfaits Barberly
          </span>
          <h1 className="text-balance text-4xl font-semibold tracking-tight sm:text-5xl">
            Boostez votre activité avec le forfait qui vous correspond.
          </h1>
          <p className="text-sm leading-6 text-white/60 sm:text-base">
            Publiez plus de prestations, créez plus de catalogues, ajoutez plus
            de produits boutique, et apparaissez plus haut dans la marketplace.
            Tarifs mensuels en francs CFA.
          </p>
        </header>

        {paymentNotice ? (
          <div
            className={`rounded-3xl border p-4 text-center text-sm font-medium sm:rounded-[2rem] ${paymentNotice.className}`}
          >
            {paymentNotice.message}
          </div>
        ) : null}

        <section className="grid gap-5 sm:gap-6 lg:grid-cols-3">
          {PLANS.map(
            ({
              plan,
              name,
              price,
              tagline,
              Icon,
              highlight,
              perks,
              cardAccent,
            }) => {
              const isCurrent = currentPlan === plan;
              return (
                <article
                  key={plan}
                  className={`relative flex h-full flex-col gap-5 rounded-3xl border p-6 backdrop-blur sm:rounded-[2rem] sm:p-7 ${cardAccent}`}
                >
                  {highlight ? (
                    <span className="absolute -top-3 left-1/2 inline-flex -translate-x-1/2 items-center gap-1 rounded-full bg-violet-500 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-white shadow-lg shadow-violet-500/40">
                      <TrendingUp className="size-3" />
                      Le plus choisi
                    </span>
                  ) : null}

                  <header className="space-y-3">
                    <span className="inline-flex size-12 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/15">
                      <Icon className="size-6" />
                    </span>
                    <div>
                      <h2 className="text-2xl font-semibold tracking-tight text-white">
                        {name}
                      </h2>
                      <p className="mt-1 text-sm text-white/55">{tagline}</p>
                    </div>
                  </header>

                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-bold tracking-tight text-white">
                      {price.toLocaleString("fr-FR")}
                    </span>
                    <span className="text-sm font-semibold text-white/55">
                      FCFA / mois
                    </span>
                  </div>

                  <ul className="space-y-2 text-sm">
                    {perks.map((perk) => (
                      <li key={perk} className="flex items-start gap-2">
                        <Check className="mt-0.5 size-4 shrink-0 text-emerald-300" />
                        <span className="text-white/75">{perk}</span>
                      </li>
                    ))}
                  </ul>

                  <div className="mt-auto">
                    <PlanSubscribeButton isCurrent={isCurrent} />
                  </div>
                </article>
              );
            },
          )}
        </section>

        <section className="rounded-3xl border border-white/10 bg-white/3 p-5 text-center text-xs text-white/45 sm:rounded-[2rem] sm:p-6">
          <p className="mb-2 text-white/55">
            Forfait Gratuit : 10 prestations maximum, 2 publications par jour,
            5 catalogues, 5 photos par catalogue et 2 produits boutique.
          </p>
          <p>
            <Camera className="mr-1 inline-block size-3.5 text-amber-300" />
            Les souscriptions payantes sont temporairement désactivées. Les plans
            restent visibles, et leur activation sera bientôt disponible.
          </p>
        </section>
      </div>
    </main>
  );
}

function getPaymentNotice(payment: string | undefined) {
  if (payment === "accepted") {
    return {
      className: "border-amber-400/30 bg-amber-400/10 text-amber-100",
      message:
        "Paiement enregistré, mais l'activation automatique est temporairement désactivée.",
    };
  }

  if (payment === "disabled" || payment === "waiting" || payment === "pending") {
    return {
      className: "border-amber-400/30 bg-amber-400/10 text-amber-100",
      message:
        "La souscription payante sera bientôt disponible. Aucun forfait n'a été modifié.",
    };
  }

  if (payment === "refused" || payment === "cancelled") {
    return {
      className: "border-red-400/30 bg-red-400/10 text-red-100",
      message: "Paiement refusé ou annulé. Votre forfait n'a pas été modifié.",
    };
  }

  if (payment === "failed" || payment === "error" || payment === "missing") {
    return {
      className: "border-red-400/30 bg-red-400/10 text-red-100",
      message: "Vérification du paiement impossible. Réessayez dans un instant.",
    };
  }

  return null;
}
