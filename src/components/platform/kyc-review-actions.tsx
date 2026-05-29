"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  CheckCircle2,
  Loader2,
  ShieldCheck,
  ShieldX,
} from "lucide-react";
import {
  approveKycAction,
  rejectKycAction,
} from "@/src/lib/actions/kyc-actions";

type Status = "submitted" | "verified" | "rejected" | "blocked";

export function KycReviewActions({
  userId,
  currentStatus,
}: {
  userId: string;
  currentStatus: Status;
}) {
  const router = useRouter();
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleApprove() {
    setError(null);
    setSuccess(null);
    startTransition(async () => {
      const result = await approveKycAction(userId);
      if (!result.ok) {
        setError(result.message);
        return;
      }
      setSuccess("Profil validé.");
      router.refresh();
    });
  }

  function handleReject() {
    setError(null);
    setSuccess(null);
    const formData = new FormData();
    formData.set("reason", reason);
    startTransition(async () => {
      const result = await rejectKycAction(userId, formData);
      if (!result.ok) {
        setError(result.message);
        return;
      }
      setSuccess("Demande de complément envoyée. Délai de 72 h activé.");
      setReason("");
      router.refresh();
    });
  }

  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-2">
        <button
          type="button"
          onClick={handleApprove}
          disabled={isPending || currentStatus === "verified"}
          className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-emerald-500 text-sm font-semibold text-emerald-950 shadow-lg shadow-emerald-500/30 transition-colors hover:bg-emerald-400 disabled:opacity-60"
        >
          {isPending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <ShieldCheck className="size-4" />
          )}
          {currentStatus === "verified" ? "Déjà validé" : "Valider le profil"}
        </button>

        <div className="text-xs text-white/40">
          Cliquez pour valider le dossier. Le coiffeur recevra immédiatement le
          badge « Vérifié ».
        </div>
      </div>

      <div className="space-y-3 rounded-3xl border border-amber-400/20 bg-amber-400/5 p-5">
        <div className="space-y-1">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-amber-200">
            Demander un complément
          </p>
          <h3 className="text-sm font-semibold text-white">
            Message envoyé au coiffeur
          </h3>
          <p className="text-xs text-white/55">
            Soyez précis sur ce qui pose problème (ex. recto flou,
            inversé, document expiré). Délai automatique de 72 h, sinon le
            compte est bloqué.
          </p>
        </div>

        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Bonjour, la photo recto de votre CNI est trop floue. Pouvez-vous la reprendre en lumière naturelle ?"
          rows={4}
          maxLength={800}
          disabled={isPending}
          className="block min-h-28 w-full rounded-2xl border border-white/15 bg-white/5 px-3.5 py-2.5 text-sm text-white placeholder:text-white/35 shadow-inner shadow-black/20 focus:border-amber-400/50 focus:outline-none focus:ring-2 focus:ring-amber-400/20"
        />

        <div className="flex flex-col items-stretch gap-2 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-white/40">
            {reason.length}/800 caractères. Minimum 10 caractères.
          </p>
          <button
            type="button"
            onClick={handleReject}
            disabled={isPending || reason.trim().length < 10}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-amber-500 px-5 text-sm font-semibold text-amber-950 shadow-lg shadow-amber-500/30 transition-colors hover:bg-amber-400 disabled:opacity-60"
          >
            {isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <ShieldX className="size-4" />
            )}
            Envoyer la demande
          </button>
        </div>
      </div>

      {error ? (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-2xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-200"
        >
          <AlertCircle className="mt-0.5 size-4 shrink-0" />
          <p>{error}</p>
        </div>
      ) : null}

      {success ? (
        <div
          role="status"
          className="flex items-start gap-3 rounded-2xl border border-emerald-400/30 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-200"
        >
          <CheckCircle2 className="mt-0.5 size-4 shrink-0" />
          <p>{success}</p>
        </div>
      ) : null}
    </div>
  );
}
