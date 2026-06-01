"use client";

import { useRef, useState, useTransition, type ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  Camera,
  CheckCircle2,
  Loader2,
  Plus,
  Sparkles,
  X,
} from "lucide-react";
import { ImageCropModal } from "@/src/components/ui/image-crop-modal";

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

type Photo = {
  key: string;
  image: string;
  caption: string;
  price: string;
};

type Submission =
  | { state: "idle" }
  | { state: "error"; message: string }
  | { state: "success"; message: string };

type Props = {
  remainingSlots: number;
  photoLimit: number;
};

export function AdminCatalogueForm({ remainingSlots, photoLimit }: Props) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [stagingImage, setStagingImage] = useState<string | null>(null);
  const [status, setStatus] = useState<Submission>({ state: "idle" });
  const [isPending, startTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  function handleFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setStatus({
        state: "error",
        message: "Le fichier doit être une image.",
      });
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      setStatus({
        state: "error",
        message: "Image trop volumineuse (max 5 Mo).",
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setStagingImage(reader.result);
        setStatus({ state: "idle" });
      }
    };
    reader.onerror = () => {
      setStatus({
        state: "error",
        message: "Lecture du fichier impossible.",
      });
    };
    reader.readAsDataURL(file);
  }

  function handleCropSave(croppedUrl: string) {
    setPhotos((prev) => [
      ...prev,
      {
        key: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        image: croppedUrl,
        caption: "",
        price: "",
      },
    ]);
    setStagingImage(null);
  }

  function updatePhoto(key: string, field: "caption" | "price", value: string) {
    setPhotos((prev) =>
      prev.map((p) => (p.key === key ? { ...p, [field]: value } : p)),
    );
  }

  function removePhoto(key: string) {
    setPhotos((prev) => prev.filter((p) => p.key !== key));
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!name.trim()) {
      setStatus({ state: "error", message: "Donnez un nom au catalogue." });
      return;
    }
    if (photos.length === 0) {
      setStatus({ state: "error", message: "Ajoutez au moins une photo." });
      return;
    }

    startTransition(async () => {
      try {
        const res = await fetch("/api/catalogues", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name,
            description: description.trim() || undefined,
            photos: photos.map((p) => ({
              image: p.image,
              caption: p.caption.trim() || undefined,
              price: p.price.trim() ? Number(p.price) : undefined,
            })),
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
          message: payload?.message ?? "Catalogue publié.",
        });
        setName("");
        setDescription("");
        setPhotos([]);
        router.refresh();
      } catch {
        setStatus({ state: "error", message: "Erreur réseau." });
      }
    });
  }

  const reachedMax = photos.length >= photoLimit;
  const noSlotLeft = remainingSlots <= 0;

  return (
    <>
    <form
      onSubmit={handleSubmit}
      className="space-y-5 rounded-3xl border border-white/10 bg-linear-to-br from-zinc-800/60 via-zinc-900/70 to-zinc-950/90 p-5 shadow-[0_10px_40px_-12px_rgba(0,0,0,0.6)] backdrop-blur-xl sm:rounded-[2rem] sm:p-7"
    >
      <header className="flex items-start gap-4">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-amber-400/15 ring-1 ring-amber-400/30">
          <Sparkles className="size-5 text-amber-200" />
        </span>
        <div className="flex-1 space-y-1">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-amber-200">
            Nouveau catalogue
          </p>
          <h2 className="text-lg font-semibold tracking-tight text-white sm:text-xl">
            Publiez vos realisations
          </h2>
          <p className="text-sm text-white/55">
            Chaque photo peut avoir un titre et un prix indicatif visible sur
            la fiche marketplace.
          </p>
        </div>
      </header>

      {noSlotLeft ? (
        <div className="rounded-2xl border border-amber-400/30 bg-amber-400/10 p-4 text-sm text-amber-100">
          Vous avez atteint la limite de catalogues de votre forfait actuel.
          Passez à un forfait supérieur pour en publier davantage.
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="grid gap-1.5 text-sm font-medium text-white/80">
          Nom du catalogue
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            placeholder="Ex : Tresses bohèmes été 2026"
            disabled={isPending || noSlotLeft}
            className={inputClass}
          />
        </label>

        <label className="grid gap-1.5 text-sm font-medium text-white/80">
          Description (optionnelle)
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Ce que ce catalogue regroupe"
            disabled={isPending || noSlotLeft}
            className={inputClass}
          />
        </label>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-white/80">
            Photos ({photos.length}/{photoLimit})
          </p>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isPending || reachedMax || noSlotLeft}
            className="inline-flex items-center gap-1.5 rounded-xl border border-amber-400/30 bg-amber-400/10 px-3 py-1.5 text-xs font-semibold text-amber-200 transition-colors hover:bg-amber-400/20 disabled:opacity-50"
          >
            <Plus className="size-3.5" />
            Ajouter une photo
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            onChange={handleFile}
            className="hidden"
          />
        </div>

        {photos.length === 0 ? (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isPending || noSlotLeft}
            className="flex aspect-16/10 w-full flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-white/15 bg-white/3 text-white/55 transition-colors hover:border-amber-400/40 hover:bg-amber-400/5 hover:text-amber-200 disabled:opacity-50"
          >
            <div className="flex size-9 items-center justify-center rounded-xl bg-white/5">
              <Camera className="size-4" />
            </div>
            <p className="text-xs">Cliquez pour téléverser une première photo</p>
          </button>
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2">
            {photos.map((photo) => (
              <li
                key={photo.key}
                className="overflow-hidden rounded-2xl border border-white/10 bg-white/3"
              >
                <div className="relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={photo.image}
                    alt=""
                    className="aspect-16/10 w-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => removePhoto(photo.key)}
                    disabled={isPending}
                    aria-label="Retirer la photo"
                    className="absolute top-2 right-2 inline-flex size-8 items-center justify-center rounded-full bg-zinc-950/80 text-white shadow backdrop-blur hover:bg-zinc-900"
                  >
                    <X className="size-4" />
                  </button>
                </div>
                <div className="grid gap-2 p-3">
                  <input
                    type="text"
                    value={photo.caption}
                    onChange={(e) =>
                      updatePhoto(photo.key, "caption", e.target.value)
                    }
                    placeholder="Titre de la realisation"
                    disabled={isPending}
                    className="h-9 rounded-lg border border-white/10 bg-white/5 px-3 text-sm text-white placeholder:text-white/40 focus:border-amber-400/40 focus:outline-none"
                  />
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      step="100"
                      value={photo.price}
                      onChange={(e) =>
                        updatePhoto(photo.key, "price", e.target.value)
                      }
                      placeholder="Prix"
                      disabled={isPending}
                      className="h-9 w-full rounded-lg border border-white/10 bg-white/5 pr-12 pl-3 text-sm text-white placeholder:text-white/40 focus:border-amber-400/40 focus:outline-none"
                    />
                    <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-[10px] font-semibold text-white/40">
                      FCFA
                    </span>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
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

      <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-white/40">
          Forfait actuel : {remainingSlots} catalogue
          {remainingSlots > 1 ? "s" : ""} restant
          {remainingSlots > 1 ? "s" : ""}.
        </p>
        <button
          type="submit"
          disabled={isPending || photos.length === 0 || noSlotLeft}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-amber-400 px-5 text-sm font-semibold text-amber-950 shadow-lg shadow-amber-500/30 transition-colors hover:bg-amber-300 disabled:opacity-60"
        >
          {isPending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Sparkles className="size-4" />
          )}
          Publier le catalogue
        </button>
      </div>
    </form>
    {stagingImage ? (
      <ImageCropModal
        src={stagingImage}
        aspect={1}
        title="Recadrer la photo du catalogue"
        onSave={handleCropSave}
        onCancel={() => setStagingImage(null)}
      />
    ) : null}
    </>
  );
}

const inputClass =
  "h-11 w-full rounded-xl border border-white/15 bg-white/5 px-3.5 text-sm text-white placeholder:text-white/35 shadow-inner shadow-black/20 transition-colors focus:border-amber-400/50 focus:outline-none focus:ring-2 focus:ring-amber-400/20 disabled:opacity-60";
