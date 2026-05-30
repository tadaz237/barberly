import { CheckCircle2, Clock3 } from "lucide-react";

type Props = {
  isCurrent: boolean;
};

export function PlanSubscribeButton({ isCurrent }: Props) {
  if (isCurrent) {
    return (
      <div className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-white/15 bg-white/5 px-5 py-3 text-sm font-semibold text-white/70">
        <CheckCircle2 className="size-4" />
        Forfait actuel
      </div>
    );
  }

  return (
    <div className="inline-flex w-full cursor-not-allowed items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-white/45">
      <Clock3 className="size-4" />
      Bientôt disponible
    </div>
  );
}
