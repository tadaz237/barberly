"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, CheckCircle2, Loader2 } from "lucide-react";

type Props = {
  plan: "essential" | "pro" | "premium";
  isCurrent: boolean;
  cta: string;
  highlightClass: string;
};

export function PlanSubscribeButton({
  plan,
  isCurrent,
  cta,
  highlightClass,
}: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleClick() {
    setError(null);
    startTransition(async () => {
      try {
        const res = await fetch("/api/plans", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ plan }),
        });
        const payload = (await res.json().catch(() => null)) as
          | { message?: string }
          | null;
        if (!res.ok) {
          setError(payload?.message ?? "Souscription impossible.");
          return;
        }
        router.refresh();
        router.push("/admin");
      } catch {
        setError("Erreur réseau.");
      }
    });
  }

  if (isCurrent) {
    return (
      <div className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-white/15 bg-white/5 px-5 py-3 text-sm font-semibold text-white/70">
        <CheckCircle2 className="size-4" />
        Forfait actuel
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={handleClick}
        disabled={isPending}
        className={`inline-flex w-full items-center justify-center gap-2 rounded-2xl px-5 py-3 text-sm font-semibold shadow-lg transition-colors disabled:opacity-60 ${highlightClass}`}
      >
        {isPending ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <>
            {cta}
            <ArrowRight className="size-4" />
          </>
        )}
      </button>
      {error ? (
        <p className="text-center text-xs text-red-300">{error}</p>
      ) : null}
    </div>
  );
}
