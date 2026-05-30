import type { Prisma } from "@prisma/client";
import { prisma } from "@/src/lib/prisma";
import { verifyCinetPayTransaction } from "@/src/lib/cinetpay";

const PLAN_DURATION_DAYS = 30;

type SyncResult = {
  status: "pending" | "waiting" | "accepted" | "refused" | "cancelled" | "failed";
  planActivated: boolean;
};

export async function syncPlanPaymentWithCinetPay(
  transactionId: string,
): Promise<SyncResult> {
  const payment = await prisma.planPayment.findUnique({
    where: { transactionId },
  });

  if (!payment) {
    throw new Error("Paiement introuvable.");
  }

  if (payment.status === "accepted") {
    return { status: "accepted", planActivated: true };
  }

  const verification = await verifyCinetPayTransaction(transactionId);
  const status = mapCinetPayStatus(verification.status);
  const amountMatches =
    verification.amount === undefined || verification.amount === payment.amount;
  const currencyMatches =
    !verification.currency || verification.currency === payment.currency;
  const finalStatus = status === "accepted" && (!amountMatches || !currencyMatches)
    ? "failed"
    : status;

  if (finalStatus === "accepted") {
    const expires = new Date(
      Date.now() + PLAN_DURATION_DAYS * 24 * 60 * 60 * 1000,
    );

    await prisma.$transaction([
      prisma.planPayment.update({
        where: { id: payment.id },
        data: {
          status: finalStatus,
          providerStatus: verification.status,
          paymentMethod: verification.paymentMethod,
          providerReference: verification.operatorId,
          paidAt: parsePaymentDate(verification.paymentDate) ?? new Date(),
          rawResponse: verification.rawResponse as Prisma.InputJsonValue,
        },
      }),
      prisma.user.update({
        where: { id: payment.userId },
        data: {
          plan: payment.plan,
          planExpiresAt: expires,
        },
      }),
    ]);

    return { status: finalStatus, planActivated: true };
  }

  await prisma.planPayment.update({
    where: { id: payment.id },
    data: {
      status: finalStatus,
      providerStatus: verification.status,
      paymentMethod: verification.paymentMethod,
      providerReference: verification.operatorId,
      rawResponse: verification.rawResponse as Prisma.InputJsonValue,
    },
  });

  return { status: finalStatus, planActivated: false };
}

function mapCinetPayStatus(status: string | undefined): SyncResult["status"] {
  if (status === "ACCEPTED") return "accepted";
  if (status === "WAITING_FOR_CUSTOMER") return "waiting";
  if (status === "REFUSED") return "refused";
  if (status === "CANCELLED" || status === "CANCELED") return "cancelled";
  return "failed";
}

function parsePaymentDate(value: string | undefined) {
  if (!value || !value.trim()) return undefined;
  const normalized = value.includes("T") ? value : value.replace(" ", "T");
  const date = new Date(normalized);
  return Number.isNaN(date.getTime()) ? undefined : date;
}
