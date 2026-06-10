"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, CheckCircle2, Loader2, Trash2 } from "lucide-react";
import { deletePublicationAction } from "@/src/lib/actions/platform-admin-actions";

type ActionState = {
  kind: "success" | "error";
  message: string;
} | null;

export function PublicationModerationActions({
  serviceId,
}: {
  serviceId: string;
}) {
  const router = useRouter();
  const [state, setState] = useState<ActionState>(null);
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    startTransition(async () => {
      const result = await deletePublicationAction(serviceId);
      setState({
        kind: result.ok ? "success" : "error",
        message: result.message,
      });
      if (result.ok) router.refresh();
    });
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={handleDelete}
        disabled={isPending}
        className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-red-500 px-3 text-xs font-bold text-white transition-colors hover:bg-red-400 disabled:opacity-60"
      >
        {isPending ? <Loader2 className="size-3.5 animate-spin" /> : <Trash2 className="size-3.5" />}
        Supprimer la publication
      </button>
      {state ? (
        <div
          role={state.kind === "error" ? "alert" : "status"}
          className={`flex items-start gap-2 rounded-xl border px-3 py-2 text-xs ${
            state.kind === "error"
              ? "border-red-400/30 bg-red-500/10 text-red-200"
              : "border-emerald-400/30 bg-emerald-400/10 text-emerald-200"
          }`}
        >
          {state.kind === "error" ? (
            <AlertCircle className="mt-0.5 size-3.5 shrink-0" />
          ) : (
            <CheckCircle2 className="mt-0.5 size-3.5 shrink-0" />
          )}
          <span>{state.message}</span>
        </div>
      ) : null}
    </div>
  );
}
