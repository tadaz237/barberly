import type { Plan } from "@/src/lib/users-store";

export type PaidPlan = Exclude<Plan, "free">;

export const PAID_PLANS: PaidPlan[] = ["essential", "pro", "premium"];

export const PLAN_PRICES: Record<PaidPlan, number> = {
  essential: 1500,
  pro: 2000,
  premium: 3000,
};

export const PLAN_DISPLAY_NAME: Record<PaidPlan, string> = {
  essential: "Essentiel",
  pro: "Pro",
  premium: "Premium",
};

export function isPaidPlan(plan: unknown): plan is PaidPlan {
  return typeof plan === "string" && PAID_PLANS.includes(plan as PaidPlan);
}
