import { NextResponse } from "next/server";
import {
  getCredentialsUserByEmail,
  updateCredentialsPassword,
} from "@/src/lib/users-store";
import { consumeVerificationCode } from "@/src/lib/verification-codes";

type IncomingPayload = {
  email?: unknown;
  code?: unknown;
  password?: unknown;
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const CODE_RE = /^\d{6}$/;

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

  if (!isNonEmptyString(body.code) || !CODE_RE.test(body.code.trim())) {
    return NextResponse.json(
      { message: "Code invalide ou expiré." },
      { status: 400 },
    );
  }

  if (!isNonEmptyString(body.password) || body.password.length < 8) {
    return NextResponse.json(
      { message: "Le mot de passe doit contenir au moins 8 caractères." },
      { status: 400 },
    );
  }

  const user = await getCredentialsUserByEmail(body.email);
  if (!user) {
    return NextResponse.json(
      { message: "Code invalide ou expiré." },
      { status: 400 },
    );
  }

  const codeOk = await consumeVerificationCode({
    email: user.email,
    userId: user.id,
    purpose: "password_reset",
    code: body.code,
  });

  if (!codeOk) {
    return NextResponse.json(
      { message: "Code invalide ou expiré." },
      { status: 400 },
    );
  }

  const updated = await updateCredentialsPassword(user.email, body.password);
  if (!updated) {
    return NextResponse.json(
      { message: "Réinitialisation impossible pour le moment." },
      { status: 500 },
    );
  }

  return NextResponse.json({
    message: "Mot de passe réinitialisé.",
  });
}
