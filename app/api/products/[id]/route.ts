import { NextResponse } from "next/server";
import { auth } from "@/src/lib/auth";
import {
  deleteImageFromCloudinary,
  uploadImageToCloudinary,
} from "@/src/lib/cloudinary";
import {
  deleteProduct,
  getProductByOwner,
  normalizeProductAudience,
  updateProduct,
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
    return uploadImageToCloudinary(value, "products");
  }

  if (isValidImageUrl(value)) {
    return value;
  }

  throw new Error("invalid_image");
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

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ message: "Non authentifie." }, { status: 401 });
  }

  const { id } = await params;
  const [existingProduct, audience] = await Promise.all([
    getProductByOwner(session.user.id, id),
    getProductAudience(session.user.id),
  ]);

  if (!existingProduct) {
    return NextResponse.json(
      { message: "Produit introuvable ou non autorise." },
      { status: 404 },
    );
  }

  if (!audience) {
    return NextResponse.json(
      {
        message:
          "Completez le genre de votre profil pro avant de modifier des produits.",
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
      {
        message: `Le nom ne peut pas depasser ${MAX_PRODUCT_NAME_LENGTH} caracteres.`,
      },
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

  let image: string;
  let uploadedReplacementImage: string | undefined;
  try {
    image = await resolveImage(body.image);
    if (typeof body.image === "string" && IMAGE_DATA_URL_RE.test(body.image)) {
      uploadedReplacementImage = image;
    }
  } catch {
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

  let product: Awaited<ReturnType<typeof updateProduct>>;
  try {
    product = await updateProduct(session.user.id, id, {
      name,
      category: body.category,
      description,
      price,
      image,
      available: body.available !== false,
    });
  } catch (error) {
    if (uploadedReplacementImage) {
      await deleteImageFromCloudinary(uploadedReplacementImage).catch(
        (cleanupError) => {
          console.error("Product replacement cleanup failed", cleanupError);
        },
      );
    }
    throw error;
  }

  if (!product) {
    if (uploadedReplacementImage) {
      await deleteImageFromCloudinary(uploadedReplacementImage).catch(
        (cleanupError) => {
          console.error("Product replacement cleanup failed", cleanupError);
        },
      );
    }
    return NextResponse.json(
      { message: "Produit introuvable ou non autorise." },
      { status: 404 },
    );
  }

  if (existingProduct.image !== product.image) {
    try {
      await deleteImageFromCloudinary(existingProduct.image);
    } catch {
      return NextResponse.json(
        { message: "Mise a jour impossible pour le moment. Reessayez." },
        { status: 502 },
      );
    }
  }

  return NextResponse.json({
    product,
    message: "Produit mis a jour.",
  });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ message: "Non authentifie." }, { status: 401 });
  }

  const { id } = await params;
  const product = await getProductByOwner(session.user.id, id);

  if (!product) {
    return NextResponse.json(
      { message: "Produit introuvable ou non autorise." },
      { status: 404 },
    );
  }

  try {
    await deleteImageFromCloudinary(product.image);
  } catch {
    return NextResponse.json(
      {
        message:
          "Suppression impossible pour le moment. Reessayez avant de retirer le produit.",
      },
      { status: 502 },
    );
  }

  const deleted = await deleteProduct(session.user.id, id);

  if (!deleted) {
    return NextResponse.json(
      { message: "Produit introuvable ou non autorise." },
      { status: 404 },
    );
  }

  return NextResponse.json({
    message: "Produit supprime.",
  });
}
