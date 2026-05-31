import { createHmac, randomInt } from "node:crypto";
import { prisma } from "@/src/lib/prisma";

export type VerificationCodePurpose = "two_factor" | "password_reset";

const CODE_DIGITS = 6;
const MAX_ATTEMPTS = 5;
const EXPIRED_CODE_RETENTION_DAYS = 2;
const DEFAULT_CODE_REQUEST_COOLDOWN_SECONDS = 60;

export class VerificationCodeRateLimitError extends Error {
  retryAfterSeconds: number;

  constructor(retryAfterSeconds: number) {
    super("Verification code request is rate limited.");
    this.name = "VerificationCodeRateLimitError";
    this.retryAfterSeconds = retryAfterSeconds;
  }
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function getCodeSecret() {
  return process.env.AUTH_SECRET || "development-auth-secret";
}

function createNumericCode() {
  return randomInt(0, 10 ** CODE_DIGITS).toString().padStart(CODE_DIGITS, "0");
}

function hashCode(email: string, purpose: VerificationCodePurpose, code: string) {
  return createHmac("sha256", getCodeSecret())
    .update(`${normalizeEmail(email)}:${purpose}:${code}`)
    .digest("hex");
}

export async function issueVerificationCode({
  email,
  userId,
  purpose,
  ttlMinutes,
  minIntervalSeconds = DEFAULT_CODE_REQUEST_COOLDOWN_SECONDS,
}: {
  email: string;
  userId?: string;
  purpose: VerificationCodePurpose;
  ttlMinutes: number;
  minIntervalSeconds?: number;
}) {
  const normalizedEmail = normalizeEmail(email);
  const now = new Date();
  const retentionCutoff = new Date(
    now.getTime() - EXPIRED_CODE_RETENTION_DAYS * 24 * 60 * 60_000,
  );
  const latestCode = await prisma.verificationCode.findFirst({
    where: {
      email: normalizedEmail,
      purpose,
      ...(userId ? { userId } : {}),
    },
    orderBy: { createdAt: "desc" },
    select: { createdAt: true },
  });

  if (latestCode) {
    const elapsedSeconds = Math.floor(
      (now.getTime() - latestCode.createdAt.getTime()) / 1000,
    );

    if (elapsedSeconds < minIntervalSeconds) {
      throw new VerificationCodeRateLimitError(
        minIntervalSeconds - elapsedSeconds,
      );
    }
  }

  const code = createNumericCode();
  const expiresAt = new Date(now.getTime() + ttlMinutes * 60_000);

  await prisma.$transaction([
    prisma.verificationCode.updateMany({
      where: {
        email: normalizedEmail,
        purpose,
        consumedAt: null,
        ...(userId ? { userId } : {}),
      },
      data: { consumedAt: now },
    }),
    prisma.verificationCode.deleteMany({
      where: { expiresAt: { lt: retentionCutoff } },
    }),
    prisma.verificationCode.create({
      data: {
        email: normalizedEmail,
        userId,
        purpose,
        codeHash: hashCode(normalizedEmail, purpose, code),
        expiresAt,
      },
    }),
  ]);

  return { code, expiresAt };
}

export async function invalidateVerificationCodes({
  email,
  userId,
  purpose,
}: {
  email: string;
  userId?: string;
  purpose: VerificationCodePurpose;
}) {
  await prisma.verificationCode.updateMany({
    where: {
      email: normalizeEmail(email),
      purpose,
      consumedAt: null,
      ...(userId ? { userId } : {}),
    },
    data: { consumedAt: new Date() },
  });
}

export async function consumeVerificationCode({
  email,
  userId,
  purpose,
  code,
}: {
  email: string;
  userId?: string;
  purpose: VerificationCodePurpose;
  code: string;
}) {
  const normalizedEmail = normalizeEmail(email);
  const now = new Date();
  const record = await prisma.verificationCode.findFirst({
    where: {
      email: normalizedEmail,
      purpose,
      consumedAt: null,
      expiresAt: { gt: now },
      ...(userId ? { userId } : {}),
    },
    orderBy: { createdAt: "desc" },
  });

  if (!record) return false;

  if (record.attempts >= MAX_ATTEMPTS) {
    await prisma.verificationCode.update({
      where: { id: record.id },
      data: { consumedAt: now },
    });
    return false;
  }

  const expectedHash = hashCode(normalizedEmail, purpose, code.trim());

  if (record.codeHash !== expectedHash) {
    await prisma.verificationCode.update({
      where: { id: record.id },
      data: {
        attempts: { increment: 1 },
        ...(record.attempts + 1 >= MAX_ATTEMPTS ? { consumedAt: now } : {}),
      },
    });
    return false;
  }

  await prisma.verificationCode.update({
    where: { id: record.id },
    data: { consumedAt: now },
  });

  return true;
}
