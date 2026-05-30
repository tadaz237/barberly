import { NextResponse } from "next/server";
import { auth } from "@/src/lib/auth";
import { updateCatalogue } from "@/src/lib/catalogues-store";
import { uploadImageToCloudinary } from "@/src/lib/cloudinary";

type IncomingPhoto = {
  image?: unknown;
  caption?: unknown;
  price?: unknown;
};

type IncomingPayload = {
  name?: unknown;
  description?: unknown;
  photos?: unknown;
};

const IMAGE_DATA_URL_RE =
  /^data:image\/(png|jpe?g|webp|gif);base64,[A-Za-z0-9+/=]+$/;
const MAX_IMAGE_DATA_URL_LENGTH = 3_000_000;
const MAX_PHOTOS_PER_CATALOGUE = 4;

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isValidImageUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

async function resolveImage(value: unknown): Promise<string> {
  if (typeof value !== "string") {
    throw new Error("invalid_image");
  }

  if (IMAGE_DATA_URL_RE.test(value)) {
    if (value.length > MAX_IMAGE_DATA_URL_LENGTH) {
      throw new Error("invalid_image");
    }
    return uploadImageToCloudinary(value, "catalogues");
  }

  if (isValidImageUrl(value)) {
    return value;
  }

  throw new Error("invalid_image");
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ message: "Non authentifié." }, { status: 401 });
  }

  const { id } = await params;

  let body: IncomingPayload;
  try {
    body = (await request.json()) as IncomingPayload;
  } catch {
    return NextResponse.json({ message: "Requête invalide." }, { status: 400 });
  }

  if (!isNonEmptyString(body.name)) {
    return NextResponse.json(
      { message: "Le nom du catalogue est obligatoire." },
      { status: 400 },
    );
  }

  if (!Array.isArray(body.photos) || body.photos.length === 0) {
    return NextResponse.json(
      { message: "Ajoutez au moins une photo au catalogue." },
      { status: 400 },
    );
  }

  if (body.photos.length > MAX_PHOTOS_PER_CATALOGUE) {
    return NextResponse.json(
      { message: `Maximum ${MAX_PHOTOS_PER_CATALOGUE} photos par catalogue.` },
      { status: 400 },
    );
  }

  const photos: { image: string; caption?: string; price?: number }[] = [];
  for (const raw of body.photos as IncomingPhoto[]) {
    let image: string;
    try {
      image = await resolveImage(raw?.image);
    } catch {
      return NextResponse.json(
        {
          message:
            "Une des photos est invalide. Formats : PNG, JPEG, WEBP, GIF — max 2 Mo.",
        },
        { status: 400 },
      );
    }

    let price: number | undefined;
    if (raw.price !== undefined && raw.price !== null && raw.price !== "") {
      const n = Number(raw.price);
      if (!Number.isFinite(n) || n < 0) {
        return NextResponse.json(
          { message: "Prix invalide sur une des photos." },
          { status: 400 },
        );
      }
      price = n;
    }

    photos.push({
      image,
      caption:
        typeof raw.caption === "string" && raw.caption.trim()
          ? raw.caption
          : undefined,
      price,
    });
  }

  const description =
    typeof body.description === "string" && body.description.trim()
      ? body.description
      : undefined;

  const catalogue = await updateCatalogue(session.user.id, id, {
    name: body.name,
    description,
    photos,
  });

  if (!catalogue) {
    return NextResponse.json(
      { message: "Catalogue introuvable ou non autorisé." },
      { status: 404 },
    );
  }

  return NextResponse.json({
    catalogue,
    message: "Catalogue mis à jour.",
  });
}
