"use client";

import {
  Loader2,
  LockKeyhole,
  Mail,
  Save,
  Trash2,
  Upload,
  UserRound,
  X,
} from "lucide-react";
import { signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";
import {
  ADMIN_TONES,
  type AdminToneKey,
} from "@/src/components/admin/admin-theme";
import { ImageCropModal } from "@/src/components/ui/image-crop-modal";
import { cn } from "@/src/lib/utils";

type ProfileUser = {
  name: string;
  email: string;
  image?: string;
};

type Props = {
  user: ProfileUser;
  toneKey: AdminToneKey;
};

type ApiPayload = {
  message?: unknown;
  user?: {
    name?: string;
    image?: string | null;
  };
};

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const DELETE_CONFIRMATION = "SUPPRIMER";

function getApiMessage(payload: ApiPayload, fallback: string) {
  return typeof payload.message === "string" ? payload.message : fallback;
}

export function ProfileForm({ user, toneKey }: Props) {
  const tone = ADMIN_TONES[toneKey];
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState(user.name);
  const [imageDataUrl, setImageDataUrl] = useState<string | null>(
    user.image ?? null,
  );
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  function resetFeedback() {
    setMessage("");
    setErrorMessage("");
  }

  function handleImageChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    resetFeedback();

    if (!file.type.startsWith("image/")) {
      setErrorMessage("Choisissez une image valide.");
      return;
    }

    if (file.size > MAX_IMAGE_BYTES) {
      setErrorMessage("La photo ne doit pas depasser 5 Mo avant recadrage.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setCropSrc(reader.result);
      }
    };
    reader.onerror = () => setErrorMessage("Impossible de lire cette image.");
    reader.readAsDataURL(file);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    resetFeedback();

    const trimmedName = name.trim();
    if (trimmedName.length < 2) {
      setErrorMessage("Le nom doit contenir au moins 2 caracteres.");
      return;
    }

    setSaving(true);
    try {
      const response = await fetch("/api/account/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: trimmedName,
          image: imageDataUrl,
        }),
      });
      const payload = (await response.json().catch(() => ({}))) as ApiPayload;

      if (!response.ok) {
        throw new Error(getApiMessage(payload, "Mise a jour impossible."));
      }

      setName(payload.user?.name ?? trimmedName);
      setImageDataUrl(payload.user?.image ?? null);
      setMessage(getApiMessage(payload, "Profil mis a jour."));
      router.refresh();
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Mise a jour impossible.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteAccount() {
    if (deleteConfirmation.trim() !== DELETE_CONFIRMATION || deleting) return;

    resetFeedback();
    setDeleting(true);
    try {
      const response = await fetch("/api/account", { method: "DELETE" });
      const payload = (await response.json().catch(() => ({}))) as ApiPayload;

      if (!response.ok) {
        throw new Error(getApiMessage(payload, "Suppression impossible."));
      }

      await signOut({ redirectTo: "/" });
    } catch (error) {
      setDeleting(false);
      setErrorMessage(
        error instanceof Error ? error.message : "Suppression impossible.",
      );
    }
  }

  const canDelete =
    deleteConfirmation.trim() === DELETE_CONFIRMATION && !deleting;

  return (
    <div className="space-y-6">
      <form
        onSubmit={handleSubmit}
        className={cn(
          "grid gap-6 rounded-3xl border p-5 shadow-[0_22px_70px_-48px_rgba(0,0,0,0.9)] backdrop-blur-xl sm:p-6 lg:grid-cols-[260px_minmax(0,1fr)]",
          tone.heroCard,
        )}
      >
        <section className="space-y-4">
          <div className="relative mx-auto size-40 overflow-hidden rounded-[2rem] border border-white/10 bg-black/40 shadow-2xl sm:mx-0">
            {imageDataUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={imageDataUrl}
                alt={`Photo de profil de ${name || user.name}`}
                className="size-full object-cover"
              />
            ) : (
              <div className="flex size-full items-center justify-center">
                <UserRound className={cn("size-14", tone.icon)} />
              </div>
            )}
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif"
            className="hidden"
            onChange={handleImageChange}
          />

          <div className="grid gap-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className={cn(
                "inline-flex h-11 items-center justify-center gap-2 rounded-2xl border px-4 text-sm font-semibold transition-colors",
                tone.softButton,
              )}
            >
              <Upload className="size-4" />
              Changer la photo
            </button>
            {imageDataUrl ? (
              <button
                type="button"
                onClick={() => {
                  resetFeedback();
                  setImageDataUrl(null);
                }}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 text-sm font-semibold text-white/70 transition-colors hover:bg-white/10 hover:text-white"
              >
                <X className="size-4" />
                Retirer la photo
              </button>
            ) : null}
          </div>
        </section>

        <section className="space-y-5">
          <div>
            <p
              className={cn(
                "text-[11px] font-semibold uppercase tracking-[0.22em]",
                tone.text,
              )}
            >
              Profil
            </p>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight text-white">
              Mes informations
            </h1>
          </div>

          <div className="grid gap-4">
            <label className="grid gap-2 text-sm font-medium text-white/80">
              Nom et prenom
              <span
                className={cn(
                  "flex h-12 items-center gap-3 rounded-2xl border bg-black/30 px-4 ring-1 ring-transparent transition-colors focus-within:ring-2",
                  tone.focusSoft,
                )}
              >
                <UserRound className={cn("size-4 shrink-0", tone.icon)} />
                <input
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  maxLength={80}
                  className="min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-white/35"
                  placeholder="Votre nom complet"
                />
              </span>
            </label>

            <label className="grid gap-2 text-sm font-medium text-white/80">
              Adresse email
              <span className="flex h-12 items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] px-4 text-white/45">
                <Mail className="size-4 shrink-0" />
                <input
                  value={user.email}
                  readOnly
                  aria-readonly="true"
                  className="min-w-0 flex-1 bg-transparent text-sm outline-none"
                />
                <LockKeyhole className="size-4 shrink-0" />
              </span>
            </label>
          </div>

          {(message || errorMessage) ? (
            <p
              className={cn(
                "rounded-2xl border px-4 py-3 text-sm",
                errorMessage
                  ? "border-red-400/30 bg-red-500/10 text-red-200"
                  : "border-emerald-400/30 bg-emerald-500/10 text-emerald-200",
              )}
            >
              {errorMessage || message}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={saving}
            className={cn(
              "inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl px-5 text-sm font-semibold shadow-lg transition-all duration-200 hover:-translate-y-0.5 disabled:pointer-events-none disabled:opacity-60 sm:w-auto",
              tone.planButton,
            )}
          >
            {saving ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Save className="size-4" />
            )}
            Enregistrer
          </button>
        </section>
      </form>

      <section className="rounded-3xl border border-red-500/25 bg-red-500/5 p-5 shadow-[0_22px_70px_-48px_rgba(127,29,29,0.75)] backdrop-blur-xl sm:p-6">
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_280px] lg:items-end">
          <div className="space-y-2">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-red-200">
              Zone sensible
            </p>
            <h2 className="text-xl font-semibold tracking-tight text-white">
              Supprimer mon compte
            </h2>
            <p className="max-w-2xl text-sm leading-6 text-white/60">
              Cette action retire le compte, les prestations, les reservations,
              les catalogues, les codes de verification et les images Cloudinary
              liees a ce profil.
            </p>
          </div>

          <div className="space-y-3">
            <label className="grid gap-2 text-sm font-medium text-white/80">
              Tapez SUPPRIMER
              <input
                value={deleteConfirmation}
                onChange={(event) => setDeleteConfirmation(event.target.value)}
                className="h-11 rounded-2xl border border-red-400/25 bg-black/30 px-4 text-sm text-white outline-none transition-colors placeholder:text-white/25 focus:border-red-300/60 focus:ring-2 focus:ring-red-400/20"
                placeholder={DELETE_CONFIRMATION}
                autoComplete="off"
              />
            </label>
            <button
              type="button"
              disabled={!canDelete}
              onClick={handleDeleteAccount}
              className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-2xl bg-red-500 px-4 text-sm font-semibold text-white shadow-lg shadow-red-500/20 transition-colors hover:bg-red-400 disabled:pointer-events-none disabled:opacity-45"
            >
              {deleting ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Trash2 className="size-4" />
              )}
              Supprimer mon compte
            </button>
          </div>
        </div>
      </section>

      {cropSrc ? (
        <ImageCropModal
          src={cropSrc}
          aspect={1}
          tone={toneKey === "female" ? "pink" : "amber"}
          title="Recadrer la photo de profil"
          onSave={(croppedUrl) => {
            setImageDataUrl(croppedUrl);
            setCropSrc(null);
          }}
          onCancel={() => setCropSrc(null)}
        />
      ) : null}
    </div>
  );
}
