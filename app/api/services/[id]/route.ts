import { NextResponse } from "next/server";
import { auth } from "@/src/lib/auth";
import {
  deleteImageFromCloudinary,
  uploadImageToCloudinary,
} from "@/src/lib/cloudinary";
import {
  deleteService,
  getServiceByOwner,
  updateService,
} from "@/src/lib/services-store";
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
const MAX_IMAGE_DATA_URL_LENGTH = 4_000_000;
const IMAGE_VALIDATION_MESSAGE =
  "Photo invalide. Formats acceptés : PNG, JPEG, WEBP, GIF — max 4 Mo.";
const IMAGE_UPLOAD_MESSAGE =
  "Impossible d'envoyer la photo de la prestation. Reessayez dans un instant.";

class ServiceImageError extends Error {
  constructor(
    message: string,
    public readonly status = 400,
  ) {
    super(message);
    this.name = "ServiceImageError";
  }
}

type ResolvedImage = {
  image: string | null | undefined;
  uploadedImageUrl?: string;
};

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

async function cleanupUploadedImage(imageUrl: string | undefined) {
  if (!imageUrl) return;

  try {
    await deleteImageFromCloudinary(imageUrl);
  } catch (error) {
    console.error("Service image cleanup failed", error);
  }
}

async function resolveImage(value: unknown): Promise<ResolvedImage> {
  if (value === undefined) return { image: undefined };
  if (value === null || value === "") return { image: null };

  if (typeof value !== "string") {
    throw new ServiceImageError(IMAGE_VALIDATION_MESSAGE);
  }

  if (value.startsWith("data:image/")) {
    if (value.length > MAX_IMAGE_DATA_URL_LENGTH) {
      throw new ServiceImageError(IMAGE_VALIDATION_MESSAGE);
    }

    if (!IMAGE_DATA_URL_RE.test(value)) {
      throw new ServiceImageError(IMAGE_VALIDATION_MESSAGE);
    }

    try {
      const uploadedImageUrl = await uploadImageToCloudinary(value, "services");
      return { image: uploadedImageUrl, uploadedImageUrl };
    } catch (error) {
      console.error("Service image upload failed", error);
      throw new ServiceImageError(IMAGE_UPLOAD_MESSAGE, 502);
    }
  }

  if (isValidImageUrl(value)) {
    return { image: value };
  }

  throw new ServiceImageError(IMAGE_VALIDATION_MESSAGE);
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
  const existingService = await getServiceByOwner(session.user.id, id);

  if (!existingService) {
    return NextResponse.json(
      { message: "Prestation introuvable ou non autorisee." },
      { status: 404 },
    );
  }

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

  let resolvedImage: ResolvedImage;
  try {
    resolvedImage = await resolveImage(body.image);
  } catch (error) {
    const imageError =
      error instanceof ServiceImageError
        ? error
        : new ServiceImageError(IMAGE_VALIDATION_MESSAGE);

    return NextResponse.json(
      { message: imageError.message },
      { status: imageError.status },
    );
  }

  const plan = await getUserPlan(session.user.id);
  const featured = Boolean(body.featured) && plan === "premium";

  let service: Awaited<ReturnType<typeof updateService>>;
  try {
    service = await updateService(session.user.id, id, {
      name: textValues.name,
      category: textValues.category,
      price,
      duration,
      city: textValues.city,
      neighborhood: textValues.neighborhood,
      description: textValues.description,
      image: resolvedImage.image,
      featured,
    });
  } catch (error) {
    await cleanupUploadedImage(resolvedImage.uploadedImageUrl);
    throw error;
  }

  if (!service) {
    await cleanupUploadedImage(resolvedImage.uploadedImageUrl);
    return NextResponse.json(
      { message: "Prestation introuvable ou non autorisée." },
      { status: 404 },
    );
  }

  if (existingService.image && service.image !== existingService.image) {
    await cleanupUploadedImage(existingService.image);
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
  const service = await getServiceByOwner(session.user.id, id);

  if (!service) {
    return NextResponse.json(
      { message: "Prestation introuvable ou non autorisee." },
      { status: 404 },
    );
  }

  try {
    await deleteImageFromCloudinary(service.image);
  } catch {
    return NextResponse.json(
      {
        message:
          "Suppression impossible pour le moment. Reessayez avant de retirer la prestation.",
      },
      { status: 502 },
    );
  }

  const deleted = await deleteService(session.user.id, id);

  if (!deleted) {
    return NextResponse.json(
      { message: "Prestation introuvable ou non autorisée." },
      { status: 404 },
    );
  }

  return NextResponse.json({
    message: "Prestation supprimee.",
  });
}
