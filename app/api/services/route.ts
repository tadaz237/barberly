import { NextResponse } from "next/server";
import { auth } from "@/src/lib/auth";
import {
  deleteImageFromCloudinary,
  uploadImageToCloudinary,
} from "@/src/lib/cloudinary";
import {
  addService,
  countServicesByOwner,
  countServicesPublishedToday,
  getLatestServiceCreatedAt,
  getServices,
  getServicesByOwner,
} from "@/src/lib/services-store";
import {
  canPublishServices,
  getUserById,
  getUserLimits,
  getUserPlan,
  isProfessionalUser,
} from "@/src/lib/users-store";
import {
  MAX_SERVICE_DURATION_MINUTES,
  validateServiceTextFields,
} from "@/src/lib/service-validation";

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

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

const IMAGE_DATA_URL_RE =
  /^data:image\/(png|jpe?g|webp|gif);base64,[A-Za-z0-9+/=]+$/;
const MAX_IMAGE_DATA_URL_LENGTH = 4_000_000;
const IMAGE_VALIDATION_MESSAGE =
  "Photo invalide. Formats acceptés : PNG, JPEG, WEBP, GIF — max 4 Mo.";
const DAY_MS = 24 * 60 * 60 * 1000;

async function cleanupUploadedImage(imageUrl: string | undefined) {
  if (!imageUrl) return;

  try {
    await deleteImageFromCloudinary(imageUrl);
  } catch (error) {
    console.error("Service image cleanup failed", error);
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const owner = searchParams.get("owner");

  if (owner === "me") {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Non authentifié." }, { status: 401 });
    }
    const user = await getUserById(session.user.id);
    if (!isProfessionalUser(user)) {
      return NextResponse.json({ message: "Acces refuse." }, { status: 403 });
    }
    return NextResponse.json({
      services: await getServicesByOwner(session.user.id),
    });
  }

  return NextResponse.json({ services: await getServices() });
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json(
      { message: "Vous devez être connecté pour publier un service." },
      { status: 401 },
    );
  }

  const user = await getUserById(session.user.id);
  if (!isProfessionalUser(user)) {
    return NextResponse.json(
      { message: "Seuls les comptes professionnels peuvent publier un service." },
      { status: 403 },
    );
  }

  if (!(await canPublishServices(session.user.id))) {
    return NextResponse.json(
      {
        message:
          "Votre compte est bloqué. Mettez à jour votre KYC pour pouvoir publier à nouveau.",
      },
      { status: 403 },
    );
  }

  const limits = await getUserLimits(session.user.id);
  const servicesCount = await countServicesByOwner(session.user.id);
  if (servicesCount >= limits.servicesMax) {
    return NextResponse.json(
      {
        message:
          limits.servicesMax === 10
            ? "Votre forfait gratuit autorise 10 prestations maximum. Vous pouvez modifier ou supprimer une prestation existante."
            : `Limite atteinte : ${limits.servicesMax} prestations maximum avec votre forfait actuel.`,
      },
      { status: 429 },
    );
  }

  if (limits.servicePublishCooldownDays > 0) {
    const latestCreatedAt = await getLatestServiceCreatedAt(session.user.id);
    if (latestCreatedAt) {
      const nextAllowedAt = new Date(
        latestCreatedAt.getTime() +
          limits.servicePublishCooldownDays * DAY_MS,
      );

      if (Date.now() < nextAllowedAt.getTime()) {
        return NextResponse.json(
          {
            message: `Le forfait Gratuit permet de publier une prestation tous les ${limits.servicePublishCooldownDays} jours. Prochaine publication possible le ${nextAllowedAt.toLocaleDateString("fr-FR")} à ${nextAllowedAt.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}. Vous pouvez modifier ou supprimer vos prestations existantes.`,
          },
          { status: 429 },
        );
      }
    }
  }

  const todayCount = await countServicesPublishedToday(session.user.id);
  if (
    limits.servicePublishCooldownDays === 0 &&
    todayCount >= limits.servicesPerDay
  ) {
    return NextResponse.json(
      {
        message: `Limite atteinte : ${limits.servicesPerDay} prestations par jour avec votre forfait actuel.`,
      },
      { status: 429 },
    );
  }

  let body: IncomingPayload;
  try {
    body = (await request.json()) as IncomingPayload;
  } catch {
    return NextResponse.json(
      { message: "Requête invalide. Vérifiez le JSON envoyé." },
      { status: 400 },
    );
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

  let image: string | undefined;
  if (body.image !== undefined && body.image !== null && body.image !== "") {
    if (
      typeof body.image !== "string" ||
      body.image.length > MAX_IMAGE_DATA_URL_LENGTH ||
      !IMAGE_DATA_URL_RE.test(body.image)
    ) {
      return NextResponse.json(
        { message: IMAGE_VALIDATION_MESSAGE },
        { status: 400 },
      );
    }
    try {
      image = await uploadImageToCloudinary(body.image, "services");
    } catch {
      return NextResponse.json(
        { message: "Impossible d'envoyer la photo de la prestation." },
        { status: 502 },
      );
    }
  }

  const plan = await getUserPlan(session.user.id);
  const featuredRequested = Boolean(body.featured);
  const featured = featuredRequested && plan === "premium";

  let service: Awaited<ReturnType<typeof addService>>;
  try {
    service = await addService({
      ownerId: session.user.id,
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
  } catch (error) {
    await cleanupUploadedImage(image);
    throw error;
  }

  return NextResponse.json(
    { service, message: "Service publié avec succès." },
    { status: 201 },
  );
}
