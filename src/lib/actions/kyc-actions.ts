"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/src/lib/auth";
import {
  approveKyc,
  isPlatformAdmin,
  rejectKyc,
} from "@/src/lib/users-store";

async function requirePlatformAdmin() {
  const session = await auth();
  if (!session?.user?.id || !isPlatformAdmin(session.user.email)) {
    throw new Error("Accès refusé.");
  }
  return session.user.id;
}

export async function approveKycAction(userId: string) {
  const reviewerId = await requirePlatformAdmin();
  const updated = await approveKyc(userId, reviewerId);
  if (!updated) {
    return { ok: false as const, message: "Soumission introuvable." };
  }
  revalidatePath("/platform/kyc");
  revalidatePath(`/platform/kyc/${userId}`);
  revalidatePath("/admin");
  return { ok: true as const };
}

export async function rejectKycAction(
  userId: string,
  formData: FormData,
) {
  const reviewerId = await requirePlatformAdmin();
  const reason = String(formData.get("reason") ?? "").trim();

  if (reason.length < 10) {
    return {
      ok: false as const,
      message: "Précisez un motif (au moins 10 caractères).",
    };
  }
  if (reason.length > 800) {
    return {
      ok: false as const,
      message: "Motif trop long (max 800 caractères).",
    };
  }

  const updated = await rejectKyc(userId, reviewerId, reason);
  if (!updated) {
    return { ok: false as const, message: "Soumission introuvable." };
  }
  revalidatePath("/platform/kyc");
  revalidatePath(`/platform/kyc/${userId}`);
  revalidatePath("/admin");
  return { ok: true as const };
}
