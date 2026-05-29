"use client";

import { useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import type { ChangeEvent, FormEvent, HTMLInputTypeAttribute } from "react";
import type { LucideIcon } from "lucide-react";
import {
  AlertCircle,
  ArrowRight,
  Camera,
  CheckCircle2,
  Eye,
  EyeOff,
  Loader2,
  LockKeyhole,
  Mail,
  UserRound,
  X,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/card";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";

export type AuthFieldIcon = "mail" | "lock" | "user";

const FIELD_ICONS: Record<AuthFieldIcon, LucideIcon> = {
  mail: Mail,
  lock: LockKeyhole,
  user: UserRound,
};

type AuthField = {
  id: string;
  label: string;
  type: HTMLInputTypeAttribute;
  placeholder: string;
  autoComplete?: string;
  icon: AuthFieldIcon;
};

type AuthFormCardProps = {
  mode: "login" | "register";
  badge: string;
  title: string;
  description: string;
  submitLabel: string;
  switchText: string;
  switchLabel: string;
  switchHref: string;
  fields: AuthField[];
  redirectTo?: string;
};

type SubmitStatus =
  | { state: "idle" }
  | { state: "error"; message: string }
  | { state: "success"; message: string };

export function AuthFormCard({
  mode,
  badge,
  title,
  description,
  submitLabel,
  switchText,
  switchLabel,
  switchHref,
  fields,
  redirectTo = "/",
}: AuthFormCardProps) {
  const router = useRouter();
  const [status, setStatus] = useState<SubmitStatus>({ state: "idle" });
  const [visiblePasswords, setVisiblePasswords] = useState<Record<string, boolean>>({});
  const [avatarDataUrl, setAvatarDataUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isPending, startTransition] = useTransition();

  const MAX_AVATAR_BYTES = 1.5 * 1024 * 1024;

  function handleAvatarChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setStatus({
        state: "error",
        message: "Fichier non supporté. Choisissez une image.",
      });
      event.target.value = "";
      return;
    }

    if (file.size > MAX_AVATAR_BYTES) {
      setStatus({
        state: "error",
        message: "Image trop volumineuse (max 1,5 Mo).",
      });
      event.target.value = "";
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setAvatarDataUrl(reader.result);
        setStatus({ state: "idle" });
      }
    };
    reader.onerror = () => {
      setStatus({
        state: "error",
        message: "Impossible de lire le fichier.",
      });
    };
    reader.readAsDataURL(file);
  }

  function clearAvatar() {
    setAvatarDataUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const email = String(data.get("email") ?? "").trim();
    const password = String(data.get("password") ?? "");

    if (mode === "register") {
      const name = String(data.get("name") ?? "").trim();
      const confirmPassword = String(data.get("confirmPassword") ?? "");

      if (password !== confirmPassword) {
        setStatus({
          state: "error",
          message: "Les deux mots de passe ne correspondent pas.",
        });
        return;
      }

      setStatus({ state: "idle" });
      startTransition(async () => {
        try {
          const res = await fetch("/api/auth/register", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name, email, password, image: avatarDataUrl ?? undefined }),
          });

          if (!res.ok) {
            const payload = (await res.json().catch(() => null)) as
              | { message?: string }
              | null;
            setStatus({
              state: "error",
              message: payload?.message ?? "Inscription impossible.",
            });
            return;
          }

          setStatus({
            state: "success",
            message: "Compte créé. Redirection vers la connexion…",
          });
          router.push(redirectTo);
        } catch {
          setStatus({
            state: "error",
            message: "Erreur réseau. Réessayez dans un instant.",
          });
        }
      });
      return;
    }

    setStatus({ state: "idle" });
    startTransition(async () => {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (!result || result.error) {
        setStatus({
          state: "error",
          message: "Identifiants invalides.",
        });
        return;
      }

      setStatus({ state: "success", message: "Connecté. Redirection…" });
      router.push(redirectTo);
      router.refresh();
    });
  }

  return (
    <Card className="w-full max-w-xl rounded-3xl border border-amber-400/20 bg-linear-to-b from-zinc-900/95 via-zinc-900/95 to-zinc-950/95 py-0 text-white shadow-2xl shadow-amber-500/10 ring-0 backdrop-blur sm:rounded-[2rem]">
      <CardHeader className="gap-2 border-b border-white/10 px-5 py-4 sm:px-8 sm:py-5">
        <span className="inline-flex w-fit items-center rounded-full bg-amber-400 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-950 sm:text-[11px] sm:tracking-[0.24em]">
          {badge}
        </span>
        <div className="space-y-1">
          <CardTitle className="text-xl font-semibold tracking-tight text-white sm:text-2xl">
            {title}
          </CardTitle>
          <CardDescription className="max-w-lg text-xs leading-5 text-white/60 sm:text-sm sm:leading-6">
            {description}
          </CardDescription>
        </div>
      </CardHeader>

      <CardContent className="px-5 py-4 sm:px-8 sm:py-5">
        <form className="space-y-4" onSubmit={handleSubmit}>
          {mode === "register" ? (
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="flex size-11 items-center justify-center overflow-hidden rounded-full border border-amber-400/30 bg-linear-to-br from-amber-400/20 via-amber-500/10 to-amber-600/5 shadow-inner shadow-black/40">
                  {avatarDataUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={avatarDataUrl}
                      alt="Aperçu de la photo de profil"
                      className="size-full object-cover"
                    />
                  ) : (
                    <UserRound className="size-5 text-amber-200/70" />
                  )}
                </div>
                {avatarDataUrl ? (
                  <button
                    type="button"
                    onClick={clearAvatar}
                    aria-label="Retirer la photo"
                    className="absolute -top-1 -right-1 flex size-5 items-center justify-center rounded-full bg-zinc-950 text-white/70 ring-1 ring-white/15 transition-colors hover:text-amber-200"
                  >
                    <X className="size-3" />
                  </button>
                ) : null}
              </div>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isPending}
                className="inline-flex items-center gap-1.5 rounded-lg border border-amber-400/30 bg-amber-400/10 px-3 py-1.5 text-xs font-semibold text-amber-200 transition-colors hover:bg-amber-400/20 disabled:opacity-60"
              >
                <Camera className="size-3.5" />
                {avatarDataUrl ? "Changer la photo" : "Photo de profil"}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp,image/gif"
                onChange={handleAvatarChange}
                className="hidden"
              />
            </div>
          ) : null}

          <div className={mode === "register" ? "grid gap-3 sm:grid-cols-2" : "space-y-3"}>
            {fields.map(({ id, label, type, placeholder, autoComplete, icon }) => {
              const Icon = FIELD_ICONS[icon];
              const isPassword = type === "password";
              const isVisible = isPassword && visiblePasswords[id];
              const effectiveType = isPassword ? (isVisible ? "text" : "password") : type;
              return (
              <div key={id} className="space-y-1">
                <label htmlFor={id} className="text-xs font-medium text-white/80 sm:text-sm">
                  {label}
                </label>
                <div className="relative">
                  <Icon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-white/40" />
                  <Input
                    id={id}
                    name={id}
                    type={effectiveType}
                    placeholder={placeholder}
                    autoComplete={autoComplete}
                    className={`h-10 rounded-xl border-white/10 bg-white/5 pl-10 text-sm text-white placeholder:text-white/40 shadow-inner shadow-black/20 focus-visible:border-amber-400/40 focus-visible:ring-amber-400/20 sm:h-11 sm:rounded-2xl ${isPassword ? "pr-10" : ""}`}
                    required
                    minLength={isPassword && mode === "register" ? 8 : undefined}
                    disabled={isPending}
                  />
                  {isPassword ? (
                    <button
                      type="button"
                      onClick={() =>
                        setVisiblePasswords((prev) => ({
                          ...prev,
                          [id]: !prev[id],
                        }))
                      }
                      aria-label={isVisible ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                      aria-pressed={isVisible}
                      className="absolute top-1/2 right-2 flex size-7 -translate-y-1/2 items-center justify-center rounded-lg text-white/40 transition-colors hover:text-amber-200 focus-visible:text-amber-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/40"
                    >
                      {isVisible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </button>
                  ) : null}
                </div>
              </div>
              );
            })}
          </div>

          <Button
            type="submit"
            disabled={isPending}
            className="h-11 w-full rounded-2xl bg-amber-400 text-sm font-semibold text-zinc-950 shadow-lg shadow-amber-500/20 hover:bg-amber-300 disabled:opacity-60"
          >
            {isPending ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Patientez…
              </>
            ) : (
              <>
                {submitLabel}
                <ArrowRight className="size-4" />
              </>
            )}
          </Button>

          {mode === "login" ? (
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/40">
                <span className="h-px flex-1 bg-white/10" />
                ou
                <span className="h-px flex-1 bg-white/10" />
              </div>

              <button
                type="button"
                onClick={() => signIn("google", { callbackUrl: redirectTo })}
                disabled={isPending}
                className="flex h-11 w-full items-center justify-center gap-3 rounded-2xl border border-white/15 bg-white text-sm font-semibold text-zinc-900 transition-colors hover:bg-white/90 disabled:opacity-60"
              >
                <GoogleIcon />
                Continuer avec Google
              </button>
            </div>
          ) : null}

          {status.state === "error" ? (
            <div
              role="alert"
              className="flex items-start gap-3 rounded-2xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-300"
            >
              <AlertCircle className="mt-0.5 size-4 shrink-0" />
              <p>{status.message}</p>
            </div>
          ) : null}

          {status.state === "success" ? (
            <div
              role="status"
              className="flex items-start gap-3 rounded-2xl border border-emerald-400/30 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-300"
            >
              <CheckCircle2 className="mt-0.5 size-4 shrink-0" />
              <p>{status.message}</p>
            </div>
          ) : null}
        </form>
      </CardContent>

      <CardFooter className="flex-col items-start gap-3 border-t border-white/10 bg-amber-400/5 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-8">
        <p className="text-sm text-white/60">{switchText}</p>
        <Button
          asChild
          variant="outline"
          className="w-full rounded-2xl border-amber-400/30 bg-transparent text-amber-200 hover:bg-amber-400/10 hover:text-amber-100 sm:w-auto"
        >
          <Link href={switchHref}>{switchLabel}</Link>
        </Button>
      </CardFooter>
    </Card>
  );
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-5" aria-hidden>
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  );
}
