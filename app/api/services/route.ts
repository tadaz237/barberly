import { NextResponse } from "next/server";
import { auth } from "@/src/lib/auth";
import { uploadImageToCloudinary } from "@/src/lib/cloudinary";
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
  getUserLimits,
  getUserPlan,
} from "@/src/lib/users-store";

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
const MAX_IMAGE_DATA_URL_LENGTH = 3_000_000;
const DAY_MS = 24 * 60 * 60 * 1000;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const owner = searchParams.get("owner");

  if (owner === "me") {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Non authentifié." }, { status: 401 });
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
          limits.servicesMax === 7
            ? "Votre forfait gratuit autorise 7 prestations maximum. Vous pouvez modifier ou supprimer une prestation existante."
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
            "Photo invalide. Formats acceptés : PNG, JPEG, WEBP, GIF — max 2 Mo.",
        },
        { status: 400 },
      );
    }
    try {
      image = await uploadImageToCloudinary(body.image, "services");
    } catch {
      return NextResponse.json(
        { message: "Impossible d'envoyer la photo du service." },
        { status: 502 },
      );
    }
  }

  const plan = await getUserPlan(session.user.id);
  const featuredRequested = Boolean(body.featured);
  const featured = featuredRequested && plan === "premium";

  const service = await addService({
    ownerId: session.user.id,
    name: body.name,
    category: body.category,
    price,
    duration,
    city: body.city,
    neighborhood: body.neighborhood,
    description: body.description,
    image,
    featured,
  });

  return NextResponse.json(
    { service, message: "Service publié avec succès." },
    { status: 201 },
  );
}
