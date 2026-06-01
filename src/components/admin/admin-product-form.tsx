"use client";

import { useRef, useState, useTransition, type ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  CheckCircle2,
  ImagePlus,
  Loader2,
  PackagePlus,
  ShoppingBag,
  X,
} from "lucide-react";
import { ImageCropModal } from "@/src/components/ui/image-crop-modal";
import type {
  ProductAudience,
  ProductCategoryOption,
} from "@/src/lib/product-categories";

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

type Submission =
  | { state: "idle" }
  | { state: "error"; message: string }
  | { state: "success"; message: string };

type Props = {
  audience: ProductAudience | null;
  categoryOptions: ProductCategoryOption[];
};

export function AdminProductForm({ audience, categoryOptions }: Props) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [category, setCategory] = useState(categoryOptions[0]?.key ?? "");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [available, setAvailable] = useState(true);
  const [image, setImage] = useState<string | null>(null);
  const [stagingImage, setStagingImage] = useState<string | null>(null);
  const [status, setStatus] = useState<Submission>({ state: "idle" });
  const [isPending, startTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  function handleFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setStatus({ state: "error", message: "Le fichier doit etre une image." });
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      setStatus({ state: "error", message: "Image trop volumineuse (max 5 Mo)." });
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setStagingImage(reader.result);
        setStatus({ state: "idle" });
      }
    };
    reader.onerror = () =>
      setStatus({ state: "error", message: "Lecture du fichier impossible." });
    reader.readAsDataURL(file);
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!audience || categoryOptions.length === 0) {
      setStatus({
        state: "error",
        message: "Completez le genre de votre profil pro avant de publier.",
      });
      return;
    }
    if (!name.trim()) {
      setStatus({ state: "error", message: "Donnez un nom au produit." });
      return;
    }
    if (!category) {
      setStatus({ state: "error", message: "Choisissez une categorie." });
      return;
    }
    if (!image) {
      setStatus({ state: "error", message: "Ajoutez une photo produit." });
      return;
    }
    if (!price.trim() || Number(price) < 0) {
      setStatus({ state: "error", message: "Indiquez un prix valide." });
      return;
    }

    startTransition(async () => {
      try {
        const res = await fetch("/api/products", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: name.trim(),
            category,
            description: description.trim() || undefined,
            price: Number(price),
            image,
            available,
          }),
        });
        const payload = (await res.json().catch(() => null)) as
          | { message?: string }
          | null;

        if (!res.ok) {
          setStatus({
            state: "error",
            message: payload?.message ?? "Publication impossible.",
          });
          return;
        }

        setStatus({
          state: "success",
          message: payload?.message ?? "Produit publie.",
        });
        setName("");
        setCategory(categoryOptions[0]?.key ?? "");
        setDescription("");
        setPrice("");
        setAvailable(true);
        setImage(null);
        router.refresh();
      } catch {
        setStatus({ state: "error", message: "Erreur reseau." });
      }
    });
  }

  const title =
    audience === "male"
      ? "Vendez les produits utiles aux coupes homme"
      : "Vendez meches, lace et accessoires";
  const subtitle =
    audience === "male"
      ? "Categories limitees aux soins barbe, coiffage et produits homme."
      : "Categories limitees aux produits femme: meches, extensions, lace, perruques et soins.";

  return (
    <>
      <form
        onSubmit={handleSubmit}
        className="space-y-5 rounded-3xl border border-emerald-400/20 bg-linear-to-br from-emerald-400/10 via-zinc-900/70 to-zinc-950/90 p-5 shadow-[0_10px_40px_-12px_rgba(0,0,0,0.6)] backdrop-blur-xl sm:rounded-[2rem] sm:p-7"
      >
        <header className="flex items-start gap-4">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-emerald-400/15 ring-1 ring-emerald-400/30">
            <ShoppingBag className="size-5 text-emerald-200" />
          </span>
          <div className="flex-1 space-y-1">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-emerald-200">
              Boutique du pro
            </p>
            <h2 className="text-lg font-semibold tracking-tight text-white sm:text-xl">
              {title}
            </h2>
            <p className="text-sm text-white/55">{subtitle}</p>
          </div>
        </header>

        {!audience ? (
          <div className="rounded-2xl border border-amber-400/30 bg-amber-400/10 p-4 text-sm text-amber-100">
            Completez le genre de votre profil ou votre KYC pour activer les
            categories de produits adaptees a votre compte.
          </div>
        ) : null}

        <div className="grid gap-4 lg:grid-cols-[220px_1fr]">
          <div className="space-y-3">
            {image ? (
              <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/5">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={image} alt="" className="aspect-square w-full object-cover" />
                <button
                  type="button"
                  onClick={() => setImage(null)}
                  disabled={isPending}
                  aria-label="Retirer la photo"
                  className="absolute top-2 right-2 inline-flex size-8 items-center justify-center rounded-full bg-zinc-950/80 text-white shadow backdrop-blur hover:bg-zinc-900"
                >
                  <X className="size-4" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isPending || !audience}
                className="flex aspect-square w-full flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-white/15 bg-white/3 text-white/55 transition-colors hover:border-emerald-400/40 hover:bg-emerald-400/5 hover:text-emerald-200 disabled:opacity-50"
              >
                <ImagePlus className="size-5" />
                <span className="text-xs">Photo produit</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isPending || !audience}
              className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-2xl border border-emerald-400/30 bg-emerald-400/10 px-4 text-sm font-semibold text-emerald-200 transition-colors hover:bg-emerald-400/20 disabled:opacity-50"
            >
              <ImagePlus className="size-4" />
              Choisir une photo
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={handleFile}
              className="hidden"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="grid gap-1.5 text-sm font-medium text-white/80">
              Nom du produit
              <input
                type="text"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder={
                  audience === "male" ? "Ex : Pommade coiffante" : "Ex : Meches bresiliennes"
                }
                disabled={isPending || !audience}
                className={inputClass}
              />
            </label>

            <label className="grid gap-1.5 text-sm font-medium text-white/80">
              Categorie
              <select
                value={category}
                onChange={(event) => setCategory(event.target.value)}
                disabled={isPending || !audience || categoryOptions.length === 0}
                className={inputClass}
              >
                {categoryOptions.map((option) => (
                  <option key={option.key} value={option.key} className="bg-zinc-900">
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="grid gap-1.5 text-sm font-medium text-white/80">
              Prix
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  step="100"
                  value={price}
                  onChange={(event) => setPrice(event.target.value)}
                  placeholder="15000"
                  disabled={isPending || !audience}
                  className={`${inputClass} pr-14`}
                />
                <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-[10px] font-semibold text-white/40">
                  FCFA
                </span>
              </div>
            </label>

            <label className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/80">
              <input
                type="checkbox"
                checked={available}
                onChange={(event) => setAvailable(event.target.checked)}
                disabled={isPending || !audience}
                className="size-4 rounded border-white/15 accent-emerald-400"
              />
              Disponible a la demande
            </label>

            <label className="grid gap-1.5 text-sm font-medium text-white/80 sm:col-span-2">
              Description
              <textarea
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                rows={3}
                placeholder="Matiere, couleur, longueur, conseil d'utilisation..."
                disabled={isPending || !audience}
                className={`${inputClass} h-auto min-h-24 py-3`}
              />
            </label>
          </div>
        </div>

        {status.state === "error" ? (
          <div
            role="alert"
            className="flex items-start gap-3 rounded-2xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-200"
          >
            <AlertCircle className="mt-0.5 size-4 shrink-0" />
            <p>{status.message}</p>
          </div>
        ) : null}

        {status.state === "success" ? (
          <div
            role="status"
            className="flex items-start gap-3 rounded-2xl border border-emerald-400/30 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-200"
          >
            <CheckCircle2 className="mt-0.5 size-4 shrink-0" />
            <p>{status.message}</p>
          </div>
        ) : null}

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isPending || !audience}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-emerald-400 px-5 text-sm font-semibold text-emerald-950 shadow-lg shadow-emerald-500/25 transition-colors hover:bg-emerald-300 disabled:opacity-60"
          >
            {isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <PackagePlus className="size-4" />
            )}
            Publier le produit
          </button>
        </div>
      </form>

      {stagingImage ? (
        <ImageCropModal
          src={stagingImage}
          aspect={1}
          title="Recadrer la photo du produit"
          onSave={(croppedUrl) => {
            setImage(croppedUrl);
            setStagingImage(null);
          }}
          onCancel={() => setStagingImage(null)}
        />
      ) : null}
    </>
  );
}

const inputClass =
  "h-11 w-full rounded-xl border border-white/15 bg-white/5 px-3.5 text-sm text-white placeholder:text-white/35 shadow-inner shadow-black/20 transition-colors focus:border-emerald-400/50 focus:outline-none focus:ring-2 focus:ring-emerald-400/20 disabled:opacity-60";
