"use client";

import { useState, useTransition, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  KeyRound,
  Loader2,
  LockKeyhole,
  Mail,
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

type Status =
  | { state: "idle" }
  | { state: "error"; message: string }
  | { state: "success"; message: string };

export function PasswordResetForm() {
  const router = useRouter();
  const [phase, setPhase] = useState<"request" | "confirm">("request");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [status, setStatus] = useState<Status>({ state: "idle" });
  const [isPending, startTransition] = useTransition();

  function requestCode(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus({ state: "idle" });

    startTransition(async () => {
      try {
        const response = await fetch("/api/auth/password-reset/request", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        });
        const payload = (await response.json().catch(() => null)) as
          | { message?: string }
          | null;

        if (!response.ok) {
          setStatus({
            state: "error",
            message: payload?.message ?? "Demande impossible.",
          });
          return;
        }

        setPhase("confirm");
        setStatus({
          state: "success",
          message:
            payload?.message ??
            "Si un compte existe, un code de réinitialisation a été envoyé.",
        });
      } catch {
        setStatus({
          state: "error",
          message: "Erreur réseau. Réessayez dans un instant.",
        });
      }
    });
  }

  function confirmReset(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

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
        const response = await fetch("/api/auth/password-reset/confirm", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, code, password }),
        });
        const payload = (await response.json().catch(() => null)) as
          | { message?: string }
          | null;

        if (!response.ok) {
          setStatus({
            state: "error",
            message: payload?.message ?? "Réinitialisation impossible.",
          });
          return;
        }

        setStatus({
          state: "success",
          message:
            payload?.message ??
            "Mot de passe réinitialisé. Redirection vers la connexion.",
        });
        router.push("/login");
      } catch {
        setStatus({
          state: "error",
          message: "Erreur réseau. Réessayez dans un instant.",
        });
      }
    });
  }

  const formAction = phase === "request" ? requestCode : confirmReset;

  return (
    <Card className="w-full max-w-xl rounded-3xl border border-amber-400/20 bg-linear-to-b from-zinc-900/95 via-zinc-900/95 to-zinc-950/95 py-0 text-white shadow-2xl shadow-amber-500/10 ring-0 backdrop-blur sm:rounded-[2rem]">
      <CardHeader className="gap-2 border-b border-white/10 px-5 py-4 sm:px-8 sm:py-5">
        <span className="inline-flex w-fit items-center rounded-full bg-amber-400 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-950 sm:text-[11px] sm:tracking-[0.24em]">
          Sécurité
        </span>
        <div className="space-y-1">
          <CardTitle className="text-xl font-semibold tracking-tight text-white sm:text-2xl">
            Réinitialiser le mot de passe.
          </CardTitle>
          <CardDescription className="max-w-lg text-xs leading-5 text-white/60 sm:text-sm sm:leading-6">
            Recevez un code par e-mail, puis choisissez un nouveau mot de passe.
          </CardDescription>
        </div>
      </CardHeader>

      <CardContent className="px-5 py-4 sm:px-8 sm:py-5">
        <form className="space-y-4" onSubmit={formAction}>
          <div className="space-y-1">
            <label
              htmlFor="reset-email"
              className="text-xs font-medium text-white/80 sm:text-sm"
            >
              Adresse e-mail
            </label>
            <div className="relative">
              <Mail className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-white/40" />
              <Input
                id="reset-email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                autoComplete="email"
                placeholder="vous@exemple.com"
                className="h-11 rounded-2xl border-white/10 bg-white/5 pl-10 text-sm text-white placeholder:text-white/40 shadow-inner shadow-black/20 focus-visible:border-amber-400/40 focus-visible:ring-amber-400/20"
                required
                disabled={isPending || phase === "confirm"}
              />
            </div>
          </div>

          {phase === "confirm" ? (
            <>
              <div className="space-y-1">
                <label
                  htmlFor="reset-code"
                  className="text-xs font-medium text-white/80 sm:text-sm"
                >
                  Code reçu par e-mail
                </label>
                <div className="relative">
                  <KeyRound className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-white/40" />
                  <Input
                    id="reset-code"
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]{6}"
                    maxLength={6}
                    value={code}
                    onChange={(event) =>
                      setCode(event.target.value.replace(/\D/g, "").slice(0, 6))
                    }
                    autoComplete="one-time-code"
                    placeholder="000000"
                    className="h-11 rounded-2xl border-white/10 bg-white/5 pl-10 text-sm text-white placeholder:text-white/40 shadow-inner shadow-black/20 focus-visible:border-amber-400/40 focus-visible:ring-amber-400/20"
                    required
                    disabled={isPending}
                  />
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <PasswordInput
                  id="reset-password"
                  label="Nouveau mot de passe"
                  value={password}
                  onChange={setPassword}
                  disabled={isPending}
                />
                <PasswordInput
                  id="reset-confirm-password"
                  label="Confirmer"
                  value={confirmPassword}
                  onChange={setConfirmPassword}
                  disabled={isPending}
                />
              </div>
            </>
          ) : null}

          <Button
            type="submit"
            disabled={isPending}
            className="h-11 w-full rounded-2xl bg-amber-400 text-sm font-semibold text-zinc-950 shadow-lg shadow-amber-500/20 hover:bg-amber-300 disabled:opacity-60"
          >
            {isPending ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Patientez...
              </>
            ) : (
              <>
                {phase === "request" ? "Recevoir le code" : "Changer le mot de passe"}
                <ArrowRight className="size-4" />
              </>
            )}
          </Button>

          {phase === "confirm" ? (
            <button
              type="button"
              onClick={() => {
                setPhase("request");
                setCode("");
                setPassword("");
                setConfirmPassword("");
                setStatus({ state: "idle" });
              }}
              disabled={isPending}
              className="text-sm font-semibold text-amber-200 underline-offset-4 transition-colors hover:text-amber-100 hover:underline disabled:opacity-60"
            >
              Utiliser une autre adresse e-mail
            </button>
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
        <p className="text-sm text-white/60">Vous connaissez votre mot de passe ?</p>
        <Button
          asChild
          variant="outline"
          className="w-full rounded-2xl border-amber-400/30 bg-transparent text-amber-200 hover:bg-amber-400/10 hover:text-amber-100 sm:w-auto"
        >
          <Link href="/login">Se connecter</Link>
        </Button>
      </CardFooter>
    </Card>
  );
}

function PasswordInput({
  id,
  label,
  value,
  onChange,
  disabled,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  disabled: boolean;
}) {
  return (
    <div className="space-y-1">
      <label htmlFor={id} className="text-xs font-medium text-white/80 sm:text-sm">
        {label}
      </label>
      <div className="relative">
        <LockKeyhole className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-white/40" />
        <Input
          id={id}
          type="password"
          minLength={8}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          autoComplete="new-password"
          placeholder="Minimum 8 caractères"
          className="h-11 rounded-2xl border-white/10 bg-white/5 pl-10 text-sm text-white placeholder:text-white/40 shadow-inner shadow-black/20 focus-visible:border-amber-400/40 focus-visible:ring-amber-400/20"
          required
          disabled={disabled}
        />
      </div>
    </div>
  );
}
