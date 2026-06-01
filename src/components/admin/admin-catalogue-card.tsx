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
  Loader2,
  Plus,
  Save,
  Trash2,
  X,
} from "lucide-react";
import { ImageCropModal } from "@/src/components/ui/image-crop-modal";
import type { Catalogue } from "@/src/lib/catalogues-store";

const MAX_PHOTOS = 4;
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

type Photo = {
  key: string;
  image: string;
  caption: string;
  price: string;
};

type Status =
  | { state: "idle" }
  | { state: "error"; message: string }
  | { state: "success"; message: string };

function catalogueToPhotos(catalogue: Catalogue): Photo[] {
  return catalogue.photos.map((photo) => ({
    key: photo.id,
    image: photo.image,
    caption: photo.caption ?? "",
    price: photo.price === undefined ? "" : String(photo.price),
  }));
}

export function AdminCatalogueCard({ catalogue }: { catalogue: Catalogue }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(catalogue.name);
  const [description, setDescription] = useState(catalogue.description ?? "");
  const [photos, setPhotos] = useState<Photo[]>(() =>
    catalogueToPhotos(catalogue),
  );
  const [stagingImage, setStagingImage] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [status, setStatus] = useState<Status>({ state: "idle" });
  const [isPending, startTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  function handleFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setStatus({ state: "error", message: "Le fichier doit être une image." });
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

  function updatePhoto(key: string, field: "caption" | "price", value: string) {
    setPhotos((prev) =>
      prev.map((photo) =>
        photo.key === key ? { ...photo, [field]: value } : photo,
      ),
    );
  }

  function removePhoto(key: string) {
    setPhotos((prev) => prev.filter((photo) => photo.key !== key));
  }

  function cancelEdit() {
    setEditing(false);
    setName(catalogue.name);
    setDescription(catalogue.description ?? "");
    setPhotos(catalogueToPhotos(catalogue));
    setStatus({ state: "idle" });
  }

  function startEdit() {
    setName(catalogue.name);
    setDescription(catalogue.description ?? "");
    setPhotos(catalogueToPhotos(catalogue));
    setStatus({ state: "idle" });
    setEditing(true);
  }

  function submitUpdate(event: FormEvent<HTMLFormElement>) {
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
        const res = await fetch(`/api/catalogues/${catalogue.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: name.trim(),
            description: description.trim() || undefined,
            photos: photos.map((photo) => ({
              image: photo.image,
              caption: photo.caption.trim() || undefined,
              price: photo.price.trim() ? Number(photo.price) : undefined,
            })),
          }),
        });
        const payload = (await res.json().catch(() => null)) as
          | { message?: string }
          | null;

        if (!res.ok) {
          setStatus({
            state: "error",
            message: payload?.message ?? "Mise à jour impossible.",
          });
          return;
        }

        setStatus({
          state: "success",
          message: payload?.message ?? "Catalogue mis à jour.",
        });
        setEditing(false);
        router.refresh();
      } catch {
        setStatus({ state: "error", message: "Erreur réseau." });
      }
    });
  }

  async function handleDelete() {
    if (
      !window.confirm(
        `Supprimer définitivement le catalogue "${catalogue.name}" ?`,
      )
    ) {
      return;
    }

    setDeleting(true);
    setStatus({ state: "idle" });

    try {
      const res = await fetch(`/api/catalogues/${catalogue.id}`, {
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
        message: payload?.message ?? "Catalogue supprimé.",
      });
      router.refresh();
    } catch {
      setStatus({ state: "error", message: "Erreur réseau." });
    } finally {
      setDeleting(false);
    }
  }

  const reachedMax = photos.length >= MAX_PHOTOS;

  return (
    <>
      <li className="overflow-hidden rounded-3xl border border-white/10 bg-linear-to-br from-zinc-800/60 via-zinc-900/70 to-zinc-950/90">
        {!editing ? (
          <>
            <CataloguePreview catalogue={catalogue} />
            <div className="space-y-3 p-4">
              <div className="space-y-1">
                <p className="text-base font-semibold text-white">
                  {catalogue.name}
                </p>
                {catalogue.description ? (
                  <p className="text-xs text-white/55">
                    {catalogue.description}
                  </p>
                ) : null}
                <p className="text-xs text-white/45">
                  {catalogue.photos.length} photo
                  {catalogue.photos.length > 1 ? "s" : ""}
                </p>
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={startEdit}
                  disabled={deleting}
                  className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-2xl border border-amber-400/30 bg-amber-400/10 px-4 text-sm font-semibold text-amber-200 transition-colors hover:bg-amber-400/20 disabled:opacity-60"
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
            </div>
          </>
        ) : (
          <form onSubmit={submitUpdate} className="space-y-4 p-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="grid gap-1.5 text-sm font-medium text-white/80">
                Nom du portfolio
                <input
                  type="text"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  disabled={isPending}
                  className={inputClass}
                />
              </label>
              <label className="grid gap-1.5 text-sm font-medium text-white/80">
                Description
                <input
                  type="text"
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  disabled={isPending}
                  className={inputClass}
                />
              </label>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-medium text-white/80">
                  Photos ({photos.length}/{MAX_PHOTOS})
                </p>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isPending || reachedMax}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-amber-400/30 bg-amber-400/10 px-3 py-1.5 text-xs font-semibold text-amber-200 transition-colors hover:bg-amber-400/20 disabled:opacity-50"
                >
                  <Plus className="size-3.5" />
                  Ajouter
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={handleFile}
                  className="hidden"
                />
              </div>

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
                        disabled={isPending || photos.length <= 1}
                        aria-label="Retirer la photo"
                        className="absolute top-2 right-2 inline-flex size-8 items-center justify-center rounded-full bg-zinc-950/80 text-white shadow backdrop-blur hover:bg-zinc-900 disabled:opacity-50"
                      >
                        <X className="size-4" />
                      </button>
                    </div>
                    <div className="grid gap-2 p-3">
                      <input
                        type="text"
                        value={photo.caption}
                        onChange={(event) =>
                          updatePhoto(photo.key, "caption", event.target.value)
                        }
                        placeholder="Titre de la realisation"
                        disabled={isPending}
                        className={smallInputClass}
                      />
                      <div className="relative">
                        <input
                          type="number"
                          min="0"
                          step="100"
                          value={photo.price}
                          onChange={(event) =>
                            updatePhoto(photo.key, "price", event.target.value)
                          }
                          placeholder="Prix"
                          disabled={isPending}
                          className={`${smallInputClass} pr-12`}
                        />
                        <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-[10px] font-semibold text-white/40">
                          FCFA
                        </span>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
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
                disabled={isPending || photos.length === 0}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-2xl bg-amber-400 px-4 text-sm font-semibold text-amber-950 shadow-lg shadow-amber-500/30 transition-colors hover:bg-amber-300 disabled:opacity-60"
              >
                {isPending ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Save className="size-4" />
                )}
                Mettre à jour
              </button>
            </div>
          </form>
        )}
      </li>

      {stagingImage ? (
        <ImageCropModal
          src={stagingImage}
          aspect={1}
          title="Recadrer la photo du catalogue"
          onSave={(croppedUrl) => {
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
          }}
          onCancel={() => setStagingImage(null)}
        />
      ) : null}
    </>
  );
}

function CataloguePreview({ catalogue }: { catalogue: Catalogue }) {
  return (
    <div className="grid grid-cols-3 gap-1">
      {catalogue.photos.slice(0, 3).map((photo) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={photo.id}
          src={photo.image}
          alt=""
          className="aspect-square w-full object-cover"
        />
      ))}
    </div>
  );
}

const inputClass =
  "h-11 w-full rounded-xl border border-white/15 bg-white/5 px-3.5 text-sm text-white placeholder:text-white/35 shadow-inner shadow-black/20 transition-colors focus:border-amber-400/50 focus:outline-none focus:ring-2 focus:ring-amber-400/20 disabled:opacity-60";

const smallInputClass =
  "h-9 w-full rounded-lg border border-white/10 bg-white/5 px-3 text-sm text-white placeholder:text-white/40 focus:border-amber-400/40 focus:outline-none disabled:opacity-60";
