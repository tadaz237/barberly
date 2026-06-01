import { NextResponse } from "next/server";
import { auth } from "@/src/lib/auth";
import { uploadImageToCloudinary } from "@/src/lib/cloudinary";
import {
  addCatalogue,
  countCataloguesByOwner,
  getCataloguesByOwner,
} from "@/src/lib/catalogues-store";
import {
  getUserById,
  getUserLimits,
  isProfessionalUser,
} from "@/src/lib/users-store";

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

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isValidImage(value: unknown): value is string {
  return (
    typeof value === "string" &&
    value.length <= MAX_IMAGE_DATA_URL_LENGTH &&
    IMAGE_DATA_URL_RE.test(value)
  );
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const owner = searchParams.get("owner");

  if (owner === "me") {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Non authentifié." }, { status: 401 });
    }
    return NextResponse.json({
      catalogues: await getCataloguesByOwner(session.user.id),
    });
  }

  if (isNonEmptyString(owner)) {
    return NextResponse.json({
      catalogues: await getCataloguesByOwner(owner),
    });
  }

  return NextResponse.json(
    { message: "Le paramètre 'owner' est requis." },
    { status: 400 },
  );
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json(
      { message: "Vous devez être connecté pour créer un catalogue." },
      { status: 401 },
    );
  }

  const user = await getUserById(session.user.id);
  if (!isProfessionalUser(user)) {
    return NextResponse.json(
      { message: "Seuls les comptes professionnels peuvent créer un catalogue." },
      { status: 403 },
    );
  }

  const limits = await getUserLimits(session.user.id);
  const existing = await countCataloguesByOwner(session.user.id);
  if (existing >= limits.cataloguesMax) {
    return NextResponse.json(
      {
        message: `Limite atteinte : ${limits.cataloguesMax} catalogues maximum avec votre forfait actuel. Passez à un forfait supérieur pour en créer plus.`,
      },
      { status: 429 },
    );
  }

  let body: IncomingPayload;
  try {
    body = (await request.json()) as IncomingPayload;
  } catch {
    return NextResponse.json(
      { message: "Requête invalide." },
      { status: 400 },
    );
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

  if (body.photos.length > limits.cataloguePhotosMax) {
    return NextResponse.json(
      {
        message: `Maximum ${limits.cataloguePhotosMax} photos par catalogue avec votre forfait actuel.`,
      },
      { status: 400 },
    );
  }

  const photos: { image: string; caption?: string; price?: number }[] = [];
  for (const raw of body.photos as IncomingPhoto[]) {
    if (!isValidImage(raw?.image)) {
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
    try {
      photos.push({
        image: await uploadImageToCloudinary(raw.image, "catalogues"),
        caption:
          typeof raw.caption === "string" && raw.caption.trim()
            ? raw.caption
            : undefined,
        price,
      });
    } catch {
      return NextResponse.json(
        { message: "Impossible d'envoyer une des photos du catalogue." },
        { status: 502 },
      );
    }
  }

  const description =
    typeof body.description === "string" && body.description.trim()
      ? body.description
      : undefined;

  const catalogue = await addCatalogue({
    ownerId: session.user.id,
    name: body.name,
    description,
    photos,
  });

  return NextResponse.json(
    { catalogue, message: "Catalogue publié." },
    { status: 201 },
  );
}
