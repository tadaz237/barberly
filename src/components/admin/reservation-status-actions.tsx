"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Loader2, ShieldX, Sparkles } from "lucide-react";

type Status = "pending" | "confirmed" | "cancelled" | "completed";

type Props = {
  reservationId: string;
  currentStatus: Status;
};

export function ReservationStatusActions({
  reservationId,
  currentStatus,
}: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function patchStatus(status: Status) {
    setError(null);
    startTransition(async () => {
      try {
        const res = await fetch(`/api/reservations/${reservationId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status }),
        });
        if (!res.ok) {
          const payload = (await res.json().catch(() => null)) as
            | { message?: string }
            | null;
          setError(payload?.message ?? "Mise à jour impossible.");
          return;
        }
        router.refresh();
      } catch {
        setError("Erreur réseau.");
      }
    });
  }

  if (currentStatus === "cancelled" || currentStatus === "completed") {
    return null;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {currentStatus === "pending" ? (
        <button
          type="button"
          onClick={() => patchStatus("confirmed")}
          disabled={isPending}
          className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-500 px-3 py-1.5 text-xs font-semibold text-emerald-950 shadow shadow-emerald-500/30 transition-colors hover:bg-emerald-400 disabled:opacity-60"
        >
          {isPending ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : (
            <CheckCircle2 className="size-3.5" />
          )}
          Confirmer
        </button>
      ) : null}

      {currentStatus === "confirmed" ? (
        <button
          type="button"
          onClick={() => patchStatus("completed")}
          disabled={isPending}
          className="inline-flex items-center gap-1.5 rounded-xl bg-amber-400 px-3 py-1.5 text-xs font-semibold text-amber-950 shadow shadow-amber-500/30 transition-colors hover:bg-amber-300 disabled:opacity-60"
        >
          <Sparkles className="size-3.5" />
          Marquer terminé
        </button>
      ) : null}

      <button
        type="button"
        onClick={() => patchStatus("cancelled")}
        disabled={isPending}
        className="inline-flex items-center gap-1.5 rounded-xl border border-red-400/30 bg-red-500/10 px-3 py-1.5 text-xs font-semibold text-red-200 transition-colors hover:bg-red-500/20 disabled:opacity-60"
      >
        <ShieldX className="size-3.5" />
        Annuler
      </button>

      {error ? (
        <p className="basis-full text-xs text-red-300">{error}</p>
      ) : null}
    </div>
  );
}
