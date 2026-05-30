import { NextResponse } from "next/server";
import { sendTwoFactorCodeEmail } from "@/src/lib/auth-emails";
import { isSmtpConfigured } from "@/src/lib/mailer";
import { verifyCredentials } from "@/src/lib/users-store";
import {
  invalidateVerificationCodes,
  issueVerificationCode,
} from "@/src/lib/verification-codes";

type IncomingPayload = {
  email?: unknown;
  password?: unknown;
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const TWO_FACTOR_TTL_MINUTES = 10;

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

  if (!isNonEmptyString(body.password)) {
    return NextResponse.json(
      { message: "Mot de passe obligatoire." },
      { status: 400 },
    );
  }

  if (!isSmtpConfigured()) {
    return NextResponse.json(
      { message: "Impossible d'envoyer le code pour le moment." },
      { status: 503 },
    );
  }

  const user = await verifyCredentials(body.email, body.password);
  if (!user) {
    return NextResponse.json(
      { message: "Identifiants invalides." },
      { status: 401 },
    );
  }

  const { code } = await issueVerificationCode({
    email: user.email,
    userId: user.id,
    purpose: "two_factor",
    ttlMinutes: TWO_FACTOR_TTL_MINUTES,
  });

  try {
    await sendTwoFactorCodeEmail(user.email, code);
  } catch {
    await invalidateVerificationCodes({
      email: user.email,
      userId: user.id,
      purpose: "two_factor",
    });

    return NextResponse.json(
      { message: "Impossible d'envoyer le code pour le moment." },
      { status: 502 },
    );
  }

  return NextResponse.json({
    message: "Code envoyé. Vérifiez votre boîte mail.",
  });
}
