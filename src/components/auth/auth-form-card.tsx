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
  ShieldCheck,
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
import { cn } from "@/src/lib/utils";

export type AuthFieldIcon = "mail" | "lock" | "user";
export type AuthTone = "male" | "female";

const FIELD_ICONS: Record<AuthFieldIcon, LucideIcon> = {
  mail: Mail,
  lock: LockKeyhole,
  user: UserRound,
};

const AUTH_TONES: Record<
  AuthTone,
  {
    cardBorder: string;
    cardShadow: string;
    badge: string;
    avatarBorder: string;
    avatarBg: string;
    avatarIcon: string;
    uploadButton: string;
    iconHover: string;
    iconFocus: string;
    focus: string;
    infoPanel: string;
    infoText: string;
    link: string;
    linkMutedHover: string;
    primary: string;
    primaryShadow: string;
    footer: string;
    outline: string;
  }
> = {
  male: {
    cardBorder: "border-amber-400/20",
    cardShadow: "shadow-amber-500/10",
    badge: "bg-amber-400 text-zinc-950",
    avatarBorder: "border-amber-400/30",
    avatarBg: "from-amber-400/20 via-amber-500/10 to-amber-600/5",
    avatarIcon: "text-amber-200/70",
    uploadButton:
      "border-amber-400/30 bg-amber-400/10 text-amber-200 hover:bg-amber-400/20",
    iconHover: "hover:text-amber-200",
    iconFocus:
      "focus-visible:text-amber-200 focus-visible:ring-amber-400/40",
    focus:
      "focus-visible:border-amber-400/40 focus-visible:ring-amber-400/20",
    infoPanel: "border-amber-400/25 bg-amber-400/10",
    infoText: "text-amber-100",
    link: "text-amber-200 hover:text-amber-100",
    linkMutedHover: "hover:text-amber-100",
    primary: "bg-amber-400 text-zinc-950 hover:bg-amber-300",
    primaryShadow: "shadow-amber-500/20",
    footer: "bg-amber-400/5",
    outline:
      "border-amber-400/30 text-amber-200 hover:bg-amber-400/10 hover:text-amber-100",
  },
  female: {
    cardBorder: "border-pink-400/25",
    cardShadow: "shadow-pink-500/10",
    badge: "bg-pink-400 text-pink-950",
    avatarBorder: "border-pink-400/35",
    avatarBg: "from-pink-400/20 via-fuchsia-500/10 to-purple-600/5",
    avatarIcon: "text-pink-200/75",
    uploadButton:
      "border-pink-400/35 bg-pink-400/10 text-pink-200 hover:bg-pink-400/20",
    iconHover: "hover:text-pink-200",
    iconFocus: "focus-visible:text-pink-200 focus-visible:ring-pink-400/40",
    focus: "focus-visible:border-pink-400/40 focus-visible:ring-pink-400/20",
    infoPanel: "border-pink-400/25 bg-pink-400/10",
    infoText: "text-pink-100",
    link: "text-pink-200 hover:text-pink-100",
    linkMutedHover: "hover:text-pink-100",
    primary: "bg-pink-400 text-pink-950 hover:bg-pink-300",
    primaryShadow: "shadow-pink-500/20",
    footer: "bg-pink-400/5",
    outline:
      "border-pink-400/30 text-pink-200 hover:bg-pink-400/10 hover:text-pink-100",
  },
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
  accountRole?: "client" | "professional";
  badge: string;
  title: string;
  description: string;
  submitLabel: string;
  switchText: string;
  switchLabel: string;
  switchHref: string;
  fields: AuthField[];
  redirectTo?: string;
  tone?: AuthTone | null;
};

type SubmitStatus =
  | { state: "idle" }
  | { state: "error"; message: string }
  | { state: "success"; message: string };

export function AuthFormCard({
  mode,
  accountRole = "professional",
  badge,
  title,
  description,
  submitLabel,
  switchText,
  switchLabel,
  switchHref,
  fields,
  redirectTo = "/",
  tone = "male",
}: AuthFormCardProps) {
  const accent = AUTH_TONES[tone ?? "male"];
  const router = useRouter();
  const [status, setStatus] = useState<SubmitStatus>({ state: "idle" });
  const [visiblePasswords, setVisiblePasswords] = useState<Record<string, boolean>>({});
  const [avatarDataUrl, setAvatarDataUrl] = useState<string | null>(null);
  const [twoFactorChallenge, setTwoFactorChallenge] = useState<{
    email: string;
    password: string;
  } | null>(null);
  const [twoFactorCode, setTwoFactorCode] = useState("");
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

  async function requestTwoFactorCode(email: string, password: string) {
    try {
      const response = await fetch("/api/auth/two-factor/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const payload = (await response.json().catch(() => null)) as
        | { message?: string }
        | null;

      if (!response.ok) {
        setStatus({
          state: "error",
          message: payload?.message ?? "Connexion impossible.",
        });
        return;
      }

      setTwoFactorChallenge({ email, password });
      setTwoFactorCode("");
      setStatus({
        state: "success",
        message: payload?.message ?? "Code envoye. Verifiez votre boite mail.",
      });
    } catch {
      setStatus({
        state: "error",
        message: "Erreur reseau. Reessayez dans un instant.",
      });
    }
  }

  function handleResendTwoFactorCode() {
    if (!twoFactorChallenge) return;
    setStatus({ state: "idle" });
    startTransition(async () => {
      await requestTwoFactorCode(
        twoFactorChallenge.email,
        twoFactorChallenge.password,
      );
    });
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
            body: JSON.stringify({
              name,
              email,
              password,
              image: avatarDataUrl ?? undefined,
              role: accountRole,
            }),
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

    if (twoFactorChallenge) {
      if (!/^\d{6}$/.test(twoFactorCode.trim())) {
        setStatus({
          state: "error",
          message: "Entrez le code à 6 chiffres reçu par e-mail.",
        });
        return;
      }

      setStatus({ state: "idle" });
      startTransition(async () => {
        const result = await signIn("credentials", {
          email: twoFactorChallenge.email,
          password: twoFactorChallenge.password,
          twoFactorCode: twoFactorCode.trim(),
          redirect: false,
        });

        if (!result || result.error) {
          setStatus({
            state: "error",
            message: "Code invalide ou expiré.",
          });
          return;
        }

        setStatus({ state: "success", message: "Connecté. Redirection..." });
        router.push(redirectTo);
        router.refresh();
      });
      return;
    }

    setStatus({ state: "idle" });
    startTransition(async () => {
      try {
        const response = await fetch("/api/auth/two-factor/start", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        });
        const payload = (await response.json().catch(() => null)) as
          | { message?: string }
          | null;

        if (!response.ok) {
          setStatus({
            state: "error",
            message: payload?.message ?? "Connexion impossible.",
          });
          return;
        }

        setTwoFactorChallenge({ email, password });
        setTwoFactorCode("");
        setStatus({
          state: "success",
          message: payload?.message ?? "Code envoyé. Vérifiez votre boîte mail.",
        });
      } catch {
        setStatus({
          state: "error",
          message: "Erreur réseau. Réessayez dans un instant.",
        });
      }
    });
  }

  return (
    <Card
      className={cn(
        "w-full max-w-xl rounded-3xl border bg-linear-to-b from-zinc-900/95 via-zinc-900/95 to-zinc-950/95 py-0 text-white shadow-2xl ring-0 backdrop-blur sm:rounded-[2rem]",
        accent.cardBorder,
        accent.cardShadow,
      )}
    >
      <CardHeader className="gap-2 border-b border-white/10 px-5 py-4 sm:px-8 sm:py-5">
        <span
          className={cn(
            "inline-flex w-fit items-center rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] sm:text-[11px] sm:tracking-[0.24em]",
            accent.badge,
          )}
        >
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
                <div
                  className={cn(
                    "flex size-11 items-center justify-center overflow-hidden rounded-full border bg-linear-to-br shadow-inner shadow-black/40",
                    accent.avatarBorder,
                    accent.avatarBg,
                  )}
                >
                  {avatarDataUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={avatarDataUrl}
                      alt="Aperçu de la photo de profil"
                      className="size-full object-cover"
                    />
                  ) : (
                    <UserRound className={cn("size-5", accent.avatarIcon)} />
                  )}
                </div>
                {avatarDataUrl ? (
                  <button
                    type="button"
                    onClick={clearAvatar}
                    aria-label="Retirer la photo"
                    className={cn(
                      "absolute -top-1 -right-1 flex size-5 items-center justify-center rounded-full bg-zinc-950 text-white/70 ring-1 ring-white/15 transition-colors",
                      accent.iconHover,
                    )}
                  >
                    <X className="size-3" />
                  </button>
                ) : null}
              </div>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isPending}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors disabled:opacity-60",
                  accent.uploadButton,
                )}
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

          {twoFactorChallenge ? (
            <div className="space-y-4">
              <div
                className={cn(
                  "flex items-start gap-3 rounded-2xl border px-4 py-3 text-sm",
                  accent.infoPanel,
                  accent.infoText,
                )}
              >
                <ShieldCheck className="mt-0.5 size-4 shrink-0" />
                <p>
                  Un code de sécurité a été envoyé à{" "}
                  <strong>{twoFactorChallenge.email}</strong>.
                </p>
              </div>

              <div className="space-y-1">
                <label
                  htmlFor="twoFactorCode"
                  className="text-xs font-medium text-white/80 sm:text-sm"
                >
                  Code de sécurité
                </label>
                <div className="relative">
                  <ShieldCheck className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-white/40" />
                  <Input
                    id="twoFactorCode"
                    name="twoFactorCode"
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]{6}"
                    maxLength={6}
                    autoComplete="one-time-code"
                    placeholder="000000"
                    value={twoFactorCode}
                    onChange={(event) =>
                      setTwoFactorCode(
                        event.target.value.replace(/\D/g, "").slice(0, 6),
                      )
                    }
                    className={cn(
                      "h-11 rounded-2xl border-white/10 bg-white/5 pl-10 text-sm text-white placeholder:text-white/40 shadow-inner shadow-black/20",
                      accent.focus,
                    )}
                    required
                    disabled={isPending}
                  />
                </div>
              </div>

              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <button
                  type="button"
                  onClick={handleResendTwoFactorCode}
                  disabled={isPending}
                  className={cn(
                    "text-left text-sm font-semibold underline-offset-4 transition-colors hover:underline disabled:opacity-60",
                    accent.link,
                  )}
                >
                  Renvoyer le code
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setTwoFactorChallenge(null);
                    setTwoFactorCode("");
                    setStatus({ state: "idle" });
                  }}
                  disabled={isPending}
                  className={cn(
                    "text-left text-sm font-semibold text-white/60 underline-offset-4 transition-colors hover:underline disabled:opacity-60 sm:text-right",
                    accent.linkMutedHover,
                  )}
                >
                  Changer l&apos;adresse e-mail
                </button>
              </div>
            </div>
          ) : (
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
                      className={cn(
                        "h-10 rounded-xl border-white/10 bg-white/5 pl-10 text-sm text-white placeholder:text-white/40 shadow-inner shadow-black/20 sm:h-11 sm:rounded-2xl",
                        accent.focus,
                        isPassword ? "pr-10" : "",
                      )}
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
                        className={cn(
                          "absolute top-1/2 right-2 flex size-7 -translate-y-1/2 items-center justify-center rounded-lg text-white/40 transition-colors focus-visible:outline-none focus-visible:ring-2",
                          accent.iconHover,
                          accent.iconFocus,
                        )}
                      >
                        {isVisible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                      </button>
                    ) : null}
                  </div>
                </div>
                );
              })}
            </div>
          )}

          {mode === "login" && !twoFactorChallenge ? (
            <div className="flex justify-end">
              <Link
                href="/reset-password"
                className={cn(
                  "text-sm font-semibold underline-offset-4 transition-colors hover:underline",
                  accent.link,
                )}
              >
                Mot de passe oublié ?
              </Link>
            </div>
          ) : null}

          <Button
            type="submit"
            disabled={isPending}
            className={cn(
              "h-11 w-full rounded-2xl text-sm font-semibold shadow-lg disabled:opacity-60",
              accent.primary,
              accent.primaryShadow,
            )}
          >
            {isPending ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Patientez…
              </>
            ) : (
              <>
                {twoFactorChallenge ? "Valider le code" : submitLabel}
                <ArrowRight className="size-4" />
              </>
            )}
          </Button>

          {mode === "login" && !twoFactorChallenge ? (
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/40">
                <span className="h-px flex-1 bg-white/10" />
                ou
                <span className="h-px flex-1 bg-white/10" />
              </div>

              <button
                type="button"
                onClick={() => signIn("google", { redirectTo })}
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

      <CardFooter
        className={cn(
          "flex-col items-start gap-3 border-t border-white/10 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-8",
          accent.footer,
        )}
      >
        <p className="text-sm text-white/60">{switchText}</p>
        <Button
          asChild
          variant="outline"
          className={cn(
            "w-full rounded-2xl bg-transparent sm:w-auto",
            accent.outline,
          )}
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
