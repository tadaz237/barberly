import { NextResponse } from "next/server";
import { auth } from "@/src/lib/auth";
import {
  deleteImageFromCloudinary,
  uploadImageToCloudinary,
} from "@/src/lib/cloudinary";
import { getUserById, updateUserProfile } from "@/src/lib/users-store";

type IncomingPayload = {
  name?: unknown;
  image?: unknown;
};

const IMAGE_DATA_URL_RE =
  /^data:image\/(png|jpe?g|webp|gif);base64,[A-Za-z0-9+/=]+$/;
const MAX_IMAGE_DATA_URL_LENGTH = 2_000_000;

export const runtime = "nodejs";

function isValidImageUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

async function resolveProfileImage(
  value: unknown,
): Promise<string | null | undefined> {
  if (value === undefined) return undefined;
  if (value === null || value === "") return null;

  if (typeof value !== "string") {
    throw new Error("invalid_image");
  }

  if (IMAGE_DATA_URL_RE.test(value)) {
    if (value.length > MAX_IMAGE_DATA_URL_LENGTH) {
      throw new Error("invalid_image");
    }
    return uploadImageToCloudinary(value, "avatars");
  }

  if (isValidImageUrl(value)) {
    return value;
  }

  throw new Error("invalid_image");
}

export async function PATCH(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ message: "Non authentifie." }, { status: 401 });
  }

  let body: IncomingPayload;
  try {
    body = (await request.json()) as IncomingPayload;
  } catch {
    return NextResponse.json({ message: "Requete invalide." }, { status: 400 });
  }

  if (typeof body.name !== "string" || body.name.trim().length < 2) {
    return NextResponse.json(
      { message: "Le nom doit contenir au moins 2 caracteres." },
      { status: 400 },
    );
  }

  if (body.name.trim().length > 80) {
    return NextResponse.json(
      { message: "Le nom ne peut pas depasser 80 caracteres." },
      { status: 400 },
    );
  }

  const existingUser = await getUserById(session.user.id);
  if (!existingUser) {
    return NextResponse.json({ message: "Compte introuvable." }, { status: 404 });
  }

  let image: string | null | undefined;
  try {
    image = await resolveProfileImage(body.image);
  } catch {
    return NextResponse.json(
      {
        message:
          "Photo de profil invalide. Formats acceptes : PNG, JPEG, WEBP, GIF - max 1,5 Mo.",
      },
      { status: 400 },
    );
  }

  const user = await updateUserProfile(session.user.id, {
    name: body.name,
    image,
  });

  if (!user) {
    return NextResponse.json({ message: "Compte introuvable." }, { status: 404 });
  }

  if (existingUser.image && user.image !== existingUser.image) {
    try {
      await deleteImageFromCloudinary(existingUser.image);
    } catch {
      return NextResponse.json(
        {
          message:
            "Profil mis a jour, mais l'ancienne photo n'a pas pu etre retiree completement.",
          user,
        },
        { status: 502 },
      );
    }
  }

  return NextResponse.json({ user, message: "Profil mis a jour." });
}
