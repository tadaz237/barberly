"use client";

import {
  useRef,
  useState,
  useTransition,
  type ChangeEvent,
  type FormEvent,
} from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  CheckCircle2,
  Edit3,
  ImagePlus,
  Loader2,
  Save,
  Trash2,
} from "lucide-react";
import { ImageCropModal } from "@/src/components/ui/image-crop-modal";
import type { ProductCategoryOption } from "@/src/lib/product-categories";
import type { ProductItem } from "@/src/lib/products-store";

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

type Status =
  | { state: "idle" }
  | { state: "error"; message: string }
  | { state: "success"; message: string };

type Props = {
  product: ProductItem;
  categoryOptions: ProductCategoryOption[];
};

export function AdminProductCard({ product, categoryOptions }: Props) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(product.name);
  const [category, setCategory] = useState(product.category);
  const [description, setDescription] = useState(product.description ?? "");
  const [price, setPrice] = useState(String(product.price));
  const [available, setAvailable] = useState(product.available);
  const [image, setImage] = useState(product.image);
  const [stagingImage, setStagingImage] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [status, setStatus] = useState<Status>({ state: "idle" });
  const [isPending, startTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  function resetDraft() {
    setName(product.name);
    setCategory(product.category);
    setDescription(product.description ?? "");
    setPrice(String(product.price));
    setAvailable(product.available);
    setImage(product.image);
  }

  function startEdit() {
    resetDraft();
    setStatus({ state: "idle" });
    setEditing(true);
  }

  function cancelEdit() {
    resetDraft();
    setStatus({ state: "idle" });
    setEditing(false);
  }

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

  function submitUpdate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
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
        const res = await fetch(`/api/products/${product.id}`, {
          method: "PATCH",
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
            message: payload?.message ?? "Mise a jour impossible.",
          });
          return;
        }

        setStatus({
          state: "success",
          message: payload?.message ?? "Produit mis a jour.",
        });
        setEditing(false);
        router.refresh();
      } catch {
        setStatus({ state: "error", message: "Erreur reseau." });
      }
    });
  }

  async function handleDelete() {
    if (!window.confirm(`Supprimer definitivement le produit "${product.name}" ?`)) {
      return;
    }

    setDeleting(true);
    setStatus({ state: "idle" });

    try {
      const res = await fetch(`/api/products/${product.id}`, {
        method: "DELETE",
      });
      const payload = (await res.json().catch(() => null)) as
        | { message?: string }
        | null;

      if (!res.ok) {
        setStatus({
          state: "error",
          message: payload?.message ?? "Suppression impossible.",
        });
        return;
      }

      setStatus({
        state: "success",
        message: payload?.message ?? "Produit supprime.",
      });
      router.refresh();
    } catch {
      setStatus({ state: "error", message: "Erreur reseau." });
    } finally {
      setDeleting(false);
    }
  }

  return (
    <>
      <li className="overflow-hidden rounded-3xl border border-white/10 bg-linear-to-br from-zinc-800/60 via-zinc-900/70 to-zinc-950/90">
        {!editing ? (
          <>
            <div className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={product.image}
                alt=""
                className="aspect-square w-full object-cover"
              />
              <div className="absolute top-3 left-3 flex flex-wrap gap-2">
                <span className="inline-flex rounded-full bg-zinc-950/75 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-white/80 backdrop-blur">
                  {product.categoryLabel}
                </span>
                <span
                  className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] backdrop-blur ${
                    product.available
                      ? "bg-emerald-400 text-emerald-950"
                      : "bg-white/10 text-white/60"
                  }`}
                >
                  {product.available ? "Disponible" : "Masque"}
                </span>
              </div>
            </div>

            <div className="space-y-3 p-4">
              <div className="space-y-1">
                <p className="text-base font-semibold text-white">
                  {product.name}
                </p>
                {product.description ? (
                  <p className="line-clamp-2 text-xs leading-5 text-white/55">
                    {product.description}
                  </p>
                ) : null}
                <p className="text-lg font-semibold text-white">
                  {product.price.toLocaleString("fr-FR")}
                  <span className="ml-1 text-xs text-white/55">FCFA</span>
                </p>
              </div>

              <div className="grid gap-2 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={startEdit}
                  disabled={deleting}
                  className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-2xl border border-emerald-400/30 bg-emerald-400/10 px-4 text-sm font-semibold text-emerald-200 transition-colors hover:bg-emerald-400/20 disabled:opacity-60"
                >
                  <Edit3 className="size-4" />
                  Modifier
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={deleting}
                  className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-2xl border border-red-400/30 bg-red-500/10 px-4 text-sm font-semibold text-red-200 transition-colors hover:bg-red-500/20 disabled:opacity-60"
                >
                  {deleting ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Trash2 className="size-4" />
                  )}
                  Supprimer
                </button>
              </div>

              <ProductStatus status={status} />
            </div>
          </>
        ) : (
          <form onSubmit={submitUpdate} className="space-y-4 p-4">
            <div className="grid gap-4 lg:grid-cols-[180px_1fr]">
              <div className="space-y-2">
                <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/5">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={image} alt="" className="aspect-square w-full object-cover" />
                </div>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isPending}
                  className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-2xl border border-emerald-400/30 bg-emerald-400/10 px-4 text-sm font-semibold text-emerald-200 transition-colors hover:bg-emerald-400/20 disabled:opacity-50"
                >
                  <ImagePlus className="size-4" />
                  Photo
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={handleFile}
                  className="hidden"
                />
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <label className="grid gap-1.5 text-sm font-medium text-white/80">
                  Nom du produit
                  <input
                    type="text"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    disabled={isPending}
                    className={inputClass}
                  />
                </label>

                <label className="grid gap-1.5 text-sm font-medium text-white/80">
                  Categorie
                  <select
                    value={category}
                    onChange={(event) => setCategory(event.target.value)}
                    disabled={isPending}
                    className={inputClass}
                  >
                    {categoryOptions.map((option) => (
                      <option
                        key={option.key}
                        value={option.key}
                        className="bg-zinc-900"
                      >
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
                      disabled={isPending}
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
                    disabled={isPending}
                    className="size-4 rounded border-white/15 accent-emerald-400"
                  />
                  Disponible
                </label>

                <label className="grid gap-1.5 text-sm font-medium text-white/80 sm:col-span-2">
                  Description
                  <textarea
                    value={description}
                    onChange={(event) => setDescription(event.target.value)}
                    rows={3}
                    disabled={isPending}
                    className={`${inputClass} h-auto min-h-24 py-3`}
                  />
                </label>
              </div>
            </div>

            <ProductStatus status={status} />

            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={cancelEdit}
                disabled={isPending}
                className="inline-flex h-10 items-center justify-center rounded-2xl border border-white/15 px-4 text-sm font-semibold text-white/70 transition-colors hover:bg-white/5 disabled:opacity-60"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={isPending}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-2xl bg-emerald-400 px-4 text-sm font-semibold text-emerald-950 shadow-lg shadow-emerald-500/25 transition-colors hover:bg-emerald-300 disabled:opacity-60"
              >
                {isPending ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Save className="size-4" />
                )}
                Mettre a jour
              </button>
            </div>
          </form>
        )}
      </li>

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

function ProductStatus({ status }: { status: Status }) {
  if (status.state === "idle") return null;

  const isError = status.state === "error";
  return (
    <div
      role={isError ? "alert" : "status"}
      className={`flex items-start gap-3 rounded-2xl border px-4 py-3 text-sm ${
        isError
          ? "border-red-400/30 bg-red-500/10 text-red-200"
          : "border-emerald-400/30 bg-emerald-400/10 text-emerald-200"
      }`}
    >
      {isError ? (
        <AlertCircle className="mt-0.5 size-4 shrink-0" />
      ) : (
        <CheckCircle2 className="mt-0.5 size-4 shrink-0" />
      )}
      <p>{status.message}</p>
    </div>
  );
}

const inputClass =
  "h-11 w-full rounded-xl border border-white/15 bg-white/5 px-3.5 text-sm text-white placeholder:text-white/35 shadow-inner shadow-black/20 transition-colors focus:border-emerald-400/50 focus:outline-none focus:ring-2 focus:ring-emerald-400/20 disabled:opacity-60";
