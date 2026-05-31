import { NextResponse } from "next/server";
import { sendPasswordResetCodeEmail } from "@/src/lib/auth-emails";
import { isSmtpConfigured } from "@/src/lib/mailer";
import { getCredentialsUserByEmail } from "@/src/lib/users-store";
import {
  invalidateVerificationCodes,
  issueVerificationCode,
  VerificationCodeRateLimitError,
} from "@/src/lib/verification-codes";

type IncomingPayload = {
  email?: unknown;
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PASSWORD_RESET_TTL_MINUTES = 15;

export const runtime = "nodejs";

const GENERIC_RESPONSE = {
  message:
    "Si un compte existe avec cette adresse, un code de réinitialisation a été envoyé.",
};

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

export async function POST(request: Request) {
  let body: IncomingPayload;
  try {
    body = (await request.json()) as IncomingPayload;
  } catch {
    return NextResponse.json({ message: "Requête invalide." }, { status: 400 });
  }

  if (!isNonEmptyString(body.email) || !EMAIL_RE.test(body.email.trim())) {
    return NextResponse.json(
      { message: "Adresse e-mail invalide." },
      { status: 400 },
    );
  }

  if (!isSmtpConfigured()) {
    return NextResponse.json(
      { message: "Impossible d'envoyer le code pour le moment." },
      { status: 503 },
    );
  }

  const user = await getCredentialsUserByEmail(body.email);
  if (!user) {
    return NextResponse.json(GENERIC_RESPONSE);
  }

  let code: string;
  try {
    ({ code } = await issueVerificationCode({
      email: user.email,
      userId: user.id,
      purpose: "password_reset",
      ttlMinutes: PASSWORD_RESET_TTL_MINUTES,
    }));
  } catch (error) {
    if (error instanceof VerificationCodeRateLimitError) {
      return NextResponse.json(
        {
          message: `Trop de demandes. Attendez ${error.retryAfterSeconds}s avant de demander un nouveau code.`,
        },
        { status: 429 },
      );
    }

    return NextResponse.json(
      { message: "Impossible de preparer le code pour le moment." },
      { status: 500 },
    );
  }

  try {
    await sendPasswordResetCodeEmail(user.email, code);
  } catch {
    await invalidateVerificationCodes({
      email: user.email,
      userId: user.id,
      purpose: "password_reset",
    });

    return NextResponse.json(
      { message: "Impossible d'envoyer le code pour le moment." },
      { status: 502 },
    );
  }

  return NextResponse.json(GENERIC_RESPONSE);
}
