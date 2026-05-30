import { NextResponse } from "next/server";
import { auth } from "@/src/lib/auth";
import { uploadImageToCloudinary } from "@/src/lib/cloudinary";
import { deleteService, updateService } from "@/src/lib/services-store";
import {
  MAX_SERVICE_DURATION_MINUTES,
  validateServiceTextFields,
} from "@/src/lib/service-validation";
import { getUserPlan } from "@/src/lib/users-store";

type IncomingPayload = {
  name?: unknown;
  category?: unknown;
  price?: unknown;
  duration?: unknown;
  city?: unknown;
  neighborhood?: unknown;
  description?: unknown;
  featured?: unknown;
  image?: unknown;
};

const IMAGE_DATA_URL_RE =
  /^data:image\/(png|jpe?g|webp|gif);base64,[A-Za-z0-9+/=]+$/;
const MAX_IMAGE_DATA_URL_LENGTH = 3_000_000;

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

async function resolveImage(value: unknown): Promise<string | null | undefined> {
  if (value === undefined) return undefined;
  if (value === null || value === "") return null;

  if (typeof value !== "string") {
    throw new Error("Photo invalide.");
  }

  if (IMAGE_DATA_URL_RE.test(value)) {
    if (value.length > MAX_IMAGE_DATA_URL_LENGTH) {
      throw new Error("Photo trop volumineuse.");
    }
    return uploadImageToCloudinary(value, "services");
  }

  if (isValidImageUrl(value)) {
    return value;
  }

  throw new Error("Photo invalide.");
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

  if (
    !isNonEmptyString(body.name) ||
    !isNonEmptyString(body.category) ||
    !isNonEmptyString(body.city) ||
    !isNonEmptyString(body.neighborhood) ||
    !isNonEmptyString(body.description)
  ) {
    return NextResponse.json(
      { message: "Les champs texte obligatoires sont invalides." },
      { status: 400 },
    );
  }

  const textValidation = validateServiceTextFields({
    name: body.name,
    category: body.category,
    city: body.city,
    neighborhood: body.neighborhood,
    description: body.description,
  });

  if (!textValidation.ok) {
    return NextResponse.json(
      { message: textValidation.message },
      { status: 400 },
    );
  }

  const textValues = textValidation.values;

  const price = Number(body.price);
  const duration = Number(body.duration);

  if (!Number.isFinite(price) || price < 0) {
    return NextResponse.json(
      { message: "Le prix doit être un nombre valide." },
      { status: 400 },
    );
  }

  if (!Number.isFinite(duration) || duration <= 0) {
    return NextResponse.json(
      { message: "La durée doit être un nombre valide supérieur à 0." },
      { status: 400 },
    );
  }

  if (duration > MAX_SERVICE_DURATION_MINUTES) {
    return NextResponse.json(
      { message: "La durée ne peut pas dépasser 12 heures." },
      { status: 400 },
    );
  }

  let image: string | null | undefined;
  try {
    image = await resolveImage(body.image);
  } catch {
    return NextResponse.json(
      {
        message:
          "Photo invalide. Formats acceptés : PNG, JPEG, WEBP, GIF — max 2 Mo.",
      },
      { status: 400 },
    );
  }

  const plan = await getUserPlan(session.user.id);
  const featured = Boolean(body.featured) && plan === "premium";

  const service = await updateService(session.user.id, id, {
    name: textValues.name,
    category: textValues.category,
    price,
    duration,
    city: textValues.city,
    neighborhood: textValues.neighborhood,
    description: textValues.description,
    image,
    featured,
  });

  if (!service) {
    return NextResponse.json(
      { message: "Prestation introuvable ou non autorisée." },
      { status: 404 },
    );
  }

  return NextResponse.json({
    service,
    message: "Prestation mise à jour.",
  });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ message: "Non authentifié." }, { status: 401 });
  }

  const { id } = await params;
  const deleted = await deleteService(session.user.id, id);

  if (!deleted) {
    return NextResponse.json(
      { message: "Prestation introuvable ou non autorisée." },
      { status: 404 },
    );
  }

  return NextResponse.json({ message: "Prestation supprimée." });
}
