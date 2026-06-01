import { NextResponse } from "next/server";
import { auth } from "@/src/lib/auth";
import {
  deleteImageFromCloudinary,
  uploadImageToCloudinary,
} from "@/src/lib/cloudinary";
import {
  addProduct,
  getProductsByOwner,
  normalizeProductAudience,
} from "@/src/lib/products-store";
import {
  isProductCategoryAllowedForAudience,
  type ProductAudience,
} from "@/src/lib/product-categories";
import {
  getKycSubmission,
  getUserById,
  isProfessionalUser,
} from "@/src/lib/users-store";

type IncomingPayload = {
  name?: unknown;
  category?: unknown;
  description?: unknown;
  price?: unknown;
  image?: unknown;
  available?: unknown;
};

const IMAGE_DATA_URL_RE =
  /^data:image\/(png|jpe?g|webp|gif);base64,[A-Za-z0-9+/=]+$/;
const MAX_IMAGE_DATA_URL_LENGTH = 4_000_000;
const MAX_PRODUCT_NAME_LENGTH = 80;
const MAX_PRODUCT_DESCRIPTION_LENGTH = 260;

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

async function getProductAudience(
  userId: string,
): Promise<ProductAudience | null> {
  const user = await getUserById(userId);
  if (!user || !isProfessionalUser(user)) return null;

  if (user.gender) return normalizeProductAudience(user.gender);

  const submission = await getKycSubmission(userId);
  return normalizeProductAudience(submission?.gender);
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const owner = searchParams.get("owner");

  if (owner === "me") {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Non authentifie." }, { status: 401 });
    }

    return NextResponse.json({
      products: await getProductsByOwner(session.user.id),
    });
  }

  if (isNonEmptyString(owner)) {
    return NextResponse.json({
      products: await getProductsByOwner(owner, { availableOnly: true }),
    });
  }

  return NextResponse.json(
    { message: "Le parametre 'owner' est requis." },
    { status: 400 },
  );
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json(
      { message: "Vous devez etre connecte pour publier un produit." },
      { status: 401 },
    );
  }

  const audience = await getProductAudience(session.user.id);
  if (!audience) {
    return NextResponse.json(
      {
        message:
          "Completez le genre de votre profil pro avant de publier des produits.",
      },
      { status: 403 },
    );
  }

  let body: IncomingPayload;
  try {
    body = (await request.json()) as IncomingPayload;
  } catch {
    return NextResponse.json({ message: "Requete invalide." }, { status: 400 });
  }

  if (!isNonEmptyString(body.name)) {
    return NextResponse.json(
      { message: "Le nom du produit est obligatoire." },
      { status: 400 },
    );
  }

  const name = body.name.trim();
  if (name.length > MAX_PRODUCT_NAME_LENGTH) {
    return NextResponse.json(
      { message: `Le nom ne peut pas depasser ${MAX_PRODUCT_NAME_LENGTH} caracteres.` },
      { status: 400 },
    );
  }

  if (
    !isNonEmptyString(body.category) ||
    !isProductCategoryAllowedForAudience(body.category, audience)
  ) {
    return NextResponse.json(
      { message: "Categorie de produit non autorisee pour ce compte." },
      { status: 400 },
    );
  }

  const price = Number(body.price);
  if (!Number.isFinite(price) || price < 0) {
    return NextResponse.json(
      { message: "Le prix du produit est invalide." },
      { status: 400 },
    );
  }

  if (!isValidImage(body.image)) {
    return NextResponse.json(
      {
        message:
          "Photo produit invalide. Formats : PNG, JPEG, WEBP, GIF - max 4 Mo.",
      },
      { status: 400 },
    );
  }

  const description =
    typeof body.description === "string" && body.description.trim()
      ? body.description.trim()
      : undefined;
  if (description && description.length > MAX_PRODUCT_DESCRIPTION_LENGTH) {
    return NextResponse.json(
      {
        message: `La description ne peut pas depasser ${MAX_PRODUCT_DESCRIPTION_LENGTH} caracteres.`,
      },
      { status: 400 },
    );
  }

  let image: string;
  try {
    image = await uploadImageToCloudinary(body.image, "products");
  } catch {
    return NextResponse.json(
      { message: "Impossible d'envoyer la photo du produit." },
      { status: 502 },
    );
  }

  try {
    const product = await addProduct({
      ownerId: session.user.id,
      name,
      category: body.category,
      description,
      price,
      image,
      available: body.available !== false,
    });

    return NextResponse.json(
      { product, message: "Produit publie." },
      { status: 201 },
    );
  } catch (error) {
    await deleteImageFromCloudinary(image).catch((cleanupError) => {
      console.error("Product image cleanup failed", cleanupError);
    });
    throw error;
  }
}
