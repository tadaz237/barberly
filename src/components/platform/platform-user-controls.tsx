"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, CheckCircle2, Loader2, ShieldX, Sparkles } from "lucide-react";
import {
  assignUserPlanAction,
  setUserAccountStatusAction,
} from "@/src/lib/actions/platform-admin-actions";
import type { AccountStatus, Plan, PlatformUserListEntry } from "@/src/lib/users-store";

const PLAN_OPTIONS: { value: Plan; label: string }[] = [
  { value: "free", label: "Gratuit" },
  { value: "essential", label: "Essentiel" },
  { value: "pro", label: "Pro" },
  { value: "premium", label: "Premium" },
];

type ActionState = {
  kind: "success" | "error";
  message: string;
} | null;

export function PlatformUserControls({
  user,
  protectedAdmin,
}: {
  user: PlatformUserListEntry;
  protectedAdmin: boolean;
}) {
  const router = useRouter();
  const [plan, setPlan] = useState<Plan>(user.plan);
  const [durationDays, setDurationDays] = useState("30");
  const [reason, setReason] = useState("");
  const [state, setState] = useState<ActionState>(null);
  const [isPending, startTransition] = useTransition();

  function runPlanUpdate() {
    const formData = new FormData();
    formData.set("plan", plan);
    formData.set("durationDays", durationDays);
    startTransition(async () => {
      const result = await assignUserPlanAction(user.id, formData);
      setState({
        kind: result.ok ? "success" : "error",
        message: result.message,
      });
      if (result.ok) router.refresh();
    });
  }

  function runStatusUpdate(status: AccountStatus) {
    const formData = new FormData();
    formData.set("status", status);
    formData.set("reason", reason);
    startTransition(async () => {
      const result = await setUserAccountStatusAction(user.id, formData);
      setState({
        kind: result.ok ? "success" : "error",
        message: result.message,
      });
      if (result.ok) {
        setReason("");
        router.refresh();
      }
    });
  }

  const blocked = user.accountStatus === "blocked";

  return (
    <div className="space-y-4">
      <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_88px_auto]">
        <label className="sr-only" htmlFor={`plan-${user.id}`}>
          Forfait
        </label>
        <select
          id={`plan-${user.id}`}
          value={plan}
          onChange={(event) => setPlan(event.target.value as Plan)}
          disabled={isPending}
          className="h-10 rounded-xl border border-white/12 bg-white/5 px-3 text-sm text-white outline-none focus:border-cyan-300/50"
        >
          {PLAN_OPTIONS.map((option) => (
            <option key={option.value} value={option.value} className="bg-zinc-950">
              {option.label}
            </option>
          ))}
        </select>
        <label className="sr-only" htmlFor={`duration-${user.id}`}>
          Duree
        </label>
        <input
          id={`duration-${user.id}`}
          value={durationDays}
          onChange={(event) => setDurationDays(event.target.value)}
          disabled={isPending || plan === "free"}
          inputMode="numeric"
          className="h-10 rounded-xl border border-white/12 bg-white/5 px-3 text-sm text-white outline-none disabled:opacity-45 focus:border-cyan-300/50"
          aria-label="Duree en jours"
        />
        <button
          type="button"
          onClick={runPlanUpdate}
          disabled={isPending}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-cyan-300 px-3 text-xs font-bold text-cyan-950 transition-colors hover:bg-cyan-200 disabled:opacity-60"
        >
          {isPending ? <Loader2 className="size-3.5 animate-spin" /> : <Sparkles className="size-3.5" />}
          Activer
        </button>
      </div>

      <div className="space-y-2 rounded-2xl border border-white/10 bg-black/20 p-3">
        {blocked ? (
          <button
            type="button"
            onClick={() => runStatusUpdate("active")}
            disabled={isPending}
            className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-emerald-400 px-3 text-xs font-bold text-emerald-950 transition-colors hover:bg-emerald-300 disabled:opacity-60"
          >
            {isPending ? <Loader2 className="size-3.5 animate-spin" /> : <CheckCircle2 className="size-3.5" />}
            Debloquer le compte
          </button>
        ) : (
          <>
            <textarea
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              disabled={isPending || protectedAdmin}
              rows={2}
              maxLength={300}
              placeholder={
                protectedAdmin
                  ? "Compte super-admin protege"
                  : "Raison du blocage visible en interne"
              }
              className="min-h-16 w-full rounded-xl border border-white/12 bg-white/5 px-3 py-2 text-xs text-white outline-none placeholder:text-white/35 disabled:opacity-45 focus:border-red-300/50"
            />
            <button
              type="button"
              onClick={() => runStatusUpdate("blocked")}
              disabled={isPending || protectedAdmin || reason.trim().length < 8}
              className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-red-500 px-3 text-xs font-bold text-white transition-colors hover:bg-red-400 disabled:opacity-60"
            >
              {isPending ? <Loader2 className="size-3.5 animate-spin" /> : <ShieldX className="size-3.5" />}
              Bloquer le compte
            </button>
          </>
        )}
      </div>

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
