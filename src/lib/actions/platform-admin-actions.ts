"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/src/lib/auth";
import { deleteImageFromCloudinary } from "@/src/lib/cloudinary";
import {
  deleteServiceAsPlatformAdmin,
  getServiceForModeration,
} from "@/src/lib/services-store";
import {
  PLAN_LABEL,
  getUserById,
  isAccountActive,
  isPlatformAdmin,
  setUserAccountStatus,
  setUserPlan,
  type AccountStatus,
  type Plan,
} from "@/src/lib/users-store";

const PLANS: Plan[] = ["free", "essential", "pro", "premium"];
const ACCOUNT_STATUSES: AccountStatus[] = ["active", "blocked"];

async function requirePlatformAdmin() {
  const session = await auth();
  if (!session?.user?.id || !session.user.email) {
    throw new Error("Acces refuse.");
  }

  const admin = await getUserById(session.user.id);
  if (
    !admin ||
    !isAccountActive(admin) ||
    !isPlatformAdmin(session.user.email)
  ) {
    throw new Error("Acces refuse.");
  }

  return admin;
}

function parsePlan(value: FormDataEntryValue | null): Plan | null {
  return typeof value === "string" && PLANS.includes(value as Plan)
    ? (value as Plan)
    : null;
}

function parseAccountStatus(
  value: FormDataEntryValue | null,
): AccountStatus | null {
  return typeof value === "string" &&
    ACCOUNT_STATUSES.includes(value as AccountStatus)
    ? (value as AccountStatus)
    : null;
}

export async function assignUserPlanAction(userId: string, formData: FormData) {
  await requirePlatformAdmin();

  const plan = parsePlan(formData.get("plan"));
  if (!plan) {
    return { ok: false as const, message: "Forfait invalide." };
  }

  const durationRaw = Number(formData.get("durationDays") ?? 30);
  const durationDays =
    Number.isFinite(durationRaw) && durationRaw > 0
      ? Math.min(Math.round(durationRaw), 3650)
      : 30;

  const target = await getUserById(userId);
  if (!target) {
    return { ok: false as const, message: "Utilisateur introuvable." };
  }

  const updated = await setUserPlan(userId, plan, durationDays);
  if (!updated) {
    return { ok: false as const, message: "Utilisateur introuvable." };
  }

  revalidatePath("/platform/users");
  revalidatePath("/marketplace");
  revalidatePath("/admin");

  return {
    ok: true as const,
    message: `Forfait ${PLAN_LABEL[plan]} active pour ${target.name}.`,
  };
}

export async function setUserAccountStatusAction(
  userId: string,
  formData: FormData,
) {
  const admin = await requirePlatformAdmin();
  const status = parseAccountStatus(formData.get("status"));
  if (!status) {
    return { ok: false as const, message: "Statut invalide." };
  }

  const target = await getUserById(userId);
  if (!target) {
    return { ok: false as const, message: "Utilisateur introuvable." };
  }

  if (status === "blocked") {
    if (target.id === admin.id) {
      return {
        ok: false as const,
        message: "Vous ne pouvez pas bloquer votre propre compte.",
      };
    }

    if (isPlatformAdmin(target.email)) {
      return {
        ok: false as const,
        message: "Un compte super-admin ne peut pas etre bloque ici.",
      };
    }
  }

  const reason = String(formData.get("reason") ?? "").trim();
  if (status === "blocked" && reason.length < 8) {
    return {
      ok: false as const,
      message: "Indiquez une raison claire pour bloquer ce compte.",
    };
  }

  await setUserAccountStatus({
    userId,
    status,
    adminId: admin.id,
    reason,
  });

  revalidatePath("/platform/users");
  revalidatePath("/platform/kyc");
  revalidatePath("/marketplace");
  revalidatePath("/admin");
  revalidatePath("/client");

  return {
    ok: true as const,
    message:
      status === "blocked"
        ? `Compte ${target.name} bloque.`
        : `Compte ${target.name} reactive.`,
  };
}

export async function deletePublicationAction(
  serviceId: string,
) {
  await requirePlatformAdmin();

  const publication = await getServiceForModeration(serviceId);
  if (!publication) {
    return { ok: false as const, message: "Publication introuvable." };
  }

  try {
    await deleteImageFromCloudinary(publication.image);
  } catch {
    return {
      ok: false as const,
      message:
        "Suppression Cloudinary impossible pour le moment. La publication n'a pas ete retiree.",
    };
  }

  const deleted = await deleteServiceAsPlatformAdmin(serviceId);
  if (!deleted) {
    return { ok: false as const, message: "Publication introuvable." };
  }

  revalidatePath("/platform/publications");
  revalidatePath("/marketplace");
  revalidatePath("/admin");

  return {
    ok: true as const,
    message: `Publication "${publication.name}" supprimee.`,
  };
}
