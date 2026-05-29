import { NextResponse } from "next/server";
import { getGender } from "@/src/lib/gender";
import { registerUser } from "@/src/lib/users-store";

type IncomingPayload = {
  name?: unknown;
  email?: unknown;
  password?: unknown;
  image?: unknown;
};

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const IMAGE_DATA_URL_RE = /^data:image\/(png|jpe?g|webp|gif);base64,[A-Za-z0-9+/=]+$/;
const MAX_IMAGE_DATA_URL_LENGTH = 2_000_000; // ~1.5 Mo en base64

export async function POST(request: Request) {
  let body: IncomingPayload;
  try {
    body = (await request.json()) as IncomingPayload;
  } catch {
    return NextResponse.json(
      { message: "Requête invalide. Vérifiez le JSON envoyé." },
      { status: 400 },
    );
  }

  if (!isNonEmptyString(body.name)) {
    return NextResponse.json(
      { message: "Le nom est obligatoire." },
      { status: 400 },
    );
  }

  if (!isNonEmptyString(body.email) || !EMAIL_RE.test(body.email.trim())) {
    return NextResponse.json(
      { message: "Adresse e-mail invalide." },
      { status: 400 },
    );
  }

  if (!isNonEmptyString(body.password) || body.password.length < 8) {
    return NextResponse.json(
      { message: "Le mot de passe doit contenir au moins 8 caractères." },
      { status: 400 },
    );
  }

  let image: string | undefined;
  if (body.image !== undefined && body.image !== null && body.image !== "") {
    if (
      typeof body.image !== "string" ||
      body.image.length > MAX_IMAGE_DATA_URL_LENGTH ||
      !IMAGE_DATA_URL_RE.test(body.image)
    ) {
      return NextResponse.json(
        {
          message:
            "Photo de profil invalide. Formats acceptés : PNG, JPEG, WEBP, GIF — max 1,5 Mo.",
        },
        { status: 400 },
      );
    }
    image = body.image;
  }

  const gender = await getGender();
  const result = await registerUser({
    name: body.name,
    email: body.email,
    password: body.password,
    image,
    gender: gender ?? undefined,
  });

  if ("error" in result) {
    if (result.error === "email_taken") {
      return NextResponse.json(
        { message: "Un compte existe déjà avec cette adresse e-mail." },
        { status: 409 },
      );
    }
  }

  return NextResponse.json(
    { user: "user" in result ? result.user : null, message: "Compte créé." },
    { status: 201 },
  );
}
