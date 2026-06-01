import type { Product as PrismaProduct } from "@prisma/client";
import { prisma } from "@/src/lib/prisma";
import {
  getProductCategoryLabel,
  type ProductAudience,
} from "@/src/lib/product-categories";

export type ProductItem = {
  id: string;
  ownerId: string;
  name: string;
  category: string;
  categoryLabel: string;
  description?: string;
  price: number;
  image: string;
  available: boolean;
  createdAt: string;
  updatedAt: string;
};

export type CreateProductInput = {
  ownerId: string;
  name: string;
  category: string;
  description?: string;
  price: number;
  image: string;
  available?: boolean;
};

export type UpdateProductInput = Omit<CreateProductInput, "ownerId">;

function toProduct(product: PrismaProduct): ProductItem {
  return {
    id: product.id,
    ownerId: product.ownerId,
    name: product.name,
    category: product.category,
    categoryLabel: getProductCategoryLabel(product.category),
    description: product.description ?? undefined,
    price: product.price,
    image: product.image,
    available: product.available,
    createdAt: product.createdAt.toISOString(),
    updatedAt: product.updatedAt.toISOString(),
  };
}

export function normalizeProductAudience(
  value: string | null | undefined,
): ProductAudience | null {
  return value === "male" || value === "female" ? value : null;
}

export async function countProductsByOwner(ownerId: string): Promise<number> {
  return prisma.product.count({ where: { ownerId } });
}

export async function getProductsByOwner(
  ownerId: string,
  options?: { availableOnly?: boolean },
): Promise<ProductItem[]> {
  const products = await prisma.product.findMany({
    where: {
      ownerId,
      ...(options?.availableOnly ? { available: true } : {}),
    },
    orderBy: [{ available: "desc" }, { createdAt: "desc" }],
  });

  return products.map(toProduct);
}

export async function getProductByOwner(
  ownerId: string,
  id: string,
): Promise<ProductItem | undefined> {
  const product = await prisma.product.findFirst({
    where: { id, ownerId },
  });

  return product ? toProduct(product) : undefined;
}

export async function addProduct(
  input: CreateProductInput,
): Promise<ProductItem> {
  const product = await prisma.product.create({
    data: {
      ownerId: input.ownerId,
      name: input.name.trim(),
      category: input.category,
      description: input.description?.trim() || null,
      price: Number(input.price),
      image: input.image,
      available: input.available ?? true,
    },
  });

  return toProduct(product);
}

export async function updateProduct(
  ownerId: string,
  id: string,
  input: UpdateProductInput,
): Promise<ProductItem | undefined> {
  const updated = await prisma.product.updateMany({
    where: { id, ownerId },
    data: {
      name: input.name.trim(),
      category: input.category,
      description: input.description?.trim() || null,
      price: Number(input.price),
      image: input.image,
      available: input.available ?? true,
    },
  });

  if (updated.count === 0) return undefined;

  const product = await prisma.product.findUnique({ where: { id } });
  return product ? toProduct(product) : undefined;
}

export async function deleteProduct(
  ownerId: string,
  id: string,
): Promise<boolean> {
  const deleted = await prisma.product.deleteMany({
    where: { id, ownerId },
  });

  return deleted.count > 0;
}
