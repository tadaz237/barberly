import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, ImageIcon, ShoppingBag, Sparkles } from "lucide-react";
import { AdminCatalogueCard } from "@/src/components/admin/admin-catalogue-card";
import { AdminCatalogueForm } from "@/src/components/admin/admin-catalogue-form";
import { AdminProductCard } from "@/src/components/admin/admin-product-card";
import { AdminProductForm } from "@/src/components/admin/admin-product-form";
import { auth } from "@/src/lib/auth";
import { getCataloguesByOwner } from "@/src/lib/catalogues-store";
import { getProductCategoryOptions } from "@/src/lib/product-categories";
import {
  getProductsByOwner,
  normalizeProductAudience,
} from "@/src/lib/products-store";
import {
  getKycSubmission,
  getUserById,
  getUserLimits,
  getUserPlan,
  PLAN_LABEL,
} from "@/src/lib/users-store";

export default async function AdminCataloguesPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }
  const user = await getUserById(session.user.id);
  if (user?.role === "client") {
    redirect("/client");
  }

  const [catalogues, products, limits, plan, submission] = await Promise.all([
    getCataloguesByOwner(session.user.id),
    getProductsByOwner(session.user.id),
    getUserLimits(session.user.id),
    getUserPlan(session.user.id),
    getKycSubmission(session.user.id),
  ]);

  const productAudience = normalizeProductAudience(
    user?.gender ?? submission?.gender,
  );
  const productCategoryOptions = getProductCategoryOptions(productAudience);
  const remaining = Number.isFinite(limits.cataloguesMax)
    ? Math.max(0, limits.cataloguesMax - catalogues.length)
    : 999;
  const formattedMax = Number.isFinite(limits.cataloguesMax)
    ? limits.cataloguesMax
    : "∞";

  return (
    <main className="relative min-h-screen overflow-hidden bg-black text-white">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.04)_1px,transparent_1px)] bg-size-[56px_56px] opacity-60"
      />

      <div className="relative mx-auto w-full max-w-5xl space-y-8 px-4 py-6 sm:px-6 sm:py-10 lg:px-8 lg:py-12">
        <Link
          href="/admin"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-white/60 transition-colors hover:text-amber-200 sm:text-sm"
        >
          <ArrowLeft className="size-4" />
          Retour au tableau de bord
        </Link>

        <header className="space-y-3">
          <span className="inline-flex items-center gap-2 rounded-full border border-amber-400/30 bg-amber-400/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.22em] text-amber-200">
            <ImageIcon className="size-3.5" />
            Portfolio & boutique
          </span>
          <h1 className="text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
            Vos realisations et produits, separes proprement.
          </h1>
          <p className="max-w-2xl text-sm leading-6 text-white/55 sm:text-base">
            {catalogues.length} catalogue{catalogues.length > 1 ? "s" : ""}{" "}
            publié{catalogues.length > 1 ? "s" : ""} · {formattedMax} max avec
            le forfait <strong className="text-amber-200">{PLAN_LABEL[plan]}</strong>{" "}
            · {products.length} produit{products.length > 1 ? "s" : ""} en
            boutique.
          </p>
        </header>

        <AdminCatalogueForm remainingSlots={remaining} />

        {catalogues.length > 0 ? (
          <section className="space-y-4">
            <h2 className="text-lg font-semibold text-white sm:text-xl">
              Portfolio / realisations
            </h2>
            <ul className="grid gap-4 sm:grid-cols-2">
              {catalogues.map((catalogue) => (
                <AdminCatalogueCard key={catalogue.id} catalogue={catalogue} />
              ))}
            </ul>
          </section>
        ) : null}

        <section className="space-y-4">
          <div className="space-y-2">
            <span className="inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.22em] text-emerald-200">
              <ShoppingBag className="size-3.5" />
              Produits du pro
            </span>
            <h2 className="text-lg font-semibold text-white sm:text-xl">
              Boutique visible sur vos fiches marketplace
            </h2>
            <p className="max-w-2xl text-sm leading-6 text-white/55">
              Les clientes ou clients demandent la disponibilite du produit
              avant de commander.
            </p>
          </div>

          <AdminProductForm
            audience={productAudience}
            categoryOptions={productCategoryOptions}
          />

          {products.length > 0 ? (
            <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {products.map((product) => (
                <AdminProductCard
                  key={product.id}
                  product={product}
                  categoryOptions={productCategoryOptions}
                />
              ))}
            </ul>
          ) : null}
        </section>

        <section className="rounded-3xl border border-amber-400/20 bg-amber-400/5 p-5 text-sm sm:rounded-[2rem] sm:p-6">
          <div className="flex items-start gap-3">
            <Sparkles className="mt-0.5 size-5 text-amber-300" />
            <div className="space-y-1">
              <p className="font-semibold text-white">
                Envie de publier davantage&nbsp;?
              </p>
              <p className="text-white/60">
                Les forfaits supérieurs débloquent plus de catalogues et un
                meilleur placement sur la marketplace.
              </p>
              <Link
                href="/admin/plans"
                className="mt-2 inline-flex items-center gap-2 rounded-xl bg-amber-400 px-4 py-2 text-xs font-semibold text-amber-950 hover:bg-amber-300"
              >
                Voir les forfaits
              </Link>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
