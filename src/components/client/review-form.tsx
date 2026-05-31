"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Star } from "lucide-react";
import { cn } from "@/src/lib/utils";

type Props = {
  reservationId: string;
};

export function ReviewForm({ reservationId }: Props) {
  const router = useRouter();
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  function submit() {
    setError("");
    startTransition(async () => {
      try {
        const response = await fetch("/api/reviews", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ reservationId, rating, comment }),
        });
        const payload = (await response.json().catch(() => null)) as
          | { message?: string }
          | null;

        if (!response.ok) {
          setError(payload?.message ?? "Avis impossible.");
          return;
        }

        router.refresh();
      } catch {
        setError("Erreur réseau. Réessayez.");
      }
    });
  }

  return (
    <div className="space-y-3 rounded-2xl border border-pink-400/20 bg-pink-400/5 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm font-semibold text-white">Noter cette prestation</p>
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setRating(value)}
              aria-label={`${value} étoile${value > 1 ? "s" : ""}`}
              className="inline-flex size-8 items-center justify-center rounded-full text-pink-200 transition-colors hover:bg-pink-400/10"
            >
              <Star
                className={cn(
                  "size-5",
                  value <= rating ? "fill-current" : "opacity-35",
                )}
              />
            </button>
          ))}
        </div>
      </div>

      <textarea
        value={comment}
        onChange={(event) => setComment(event.target.value)}
        maxLength={700}
        rows={3}
        placeholder="Votre avis après la prestation..."
        className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none placeholder:text-white/35 focus:border-pink-400/40 focus:ring-2 focus:ring-pink-400/20"
      />

      {error ? <p className="text-xs text-red-300">{error}</p> : null}

      <button
        type="button"
        onClick={submit}
        disabled={isPending}
        className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-pink-400 px-4 text-sm font-semibold text-pink-950 shadow-lg shadow-pink-500/20 transition-colors hover:bg-pink-300 disabled:opacity-60"
      >
        {isPending ? <Loader2 className="size-4 animate-spin" /> : <Star className="size-4" />}
        Publier mon avis
      </button>
    </div>
  );
}
