import type { Catalogue as PrismaCatalogue, CataloguePhoto } from "@prisma/client";
import { prisma } from "@/src/lib/prisma";

export type CataloguePhotoItem = {
  id: string;
  image: string;
  caption?: string;
  price?: number;
};

export type Catalogue = {
  id: string;
  ownerId: string;
  name: string;
  description?: string;
  photos: CataloguePhotoItem[];
  createdAt: string;
};

export type CreateCatalogueInput = {
  ownerId: string;
  name: string;
  description?: string;
  photos: { image: string; caption?: string; price?: number }[];
};

type CatalogueWithPhotos = PrismaCatalogue & { photos: CataloguePhoto[] };

function toCatalogue(catalogue: CatalogueWithPhotos): Catalogue {
  return {
    id: catalogue.id,
    ownerId: catalogue.ownerId,
    name: catalogue.name,
    description: catalogue.description ?? undefined,
    photos: [...catalogue.photos]
      .sort((a, b) => a.position - b.position)
      .map((p) => ({
        id: p.id,
        image: p.image,
        caption: p.caption ?? undefined,
        price: p.price ?? undefined,
      })),
    createdAt: catalogue.createdAt.toISOString(),
  };
}

export async function countCataloguesByOwner(ownerId: string): Promise<number> {
  return prisma.catalogue.count({ where: { ownerId } });
}

export async function getCataloguesByOwner(
  ownerId: string,
): Promise<Catalogue[]> {
  const catalogues = await prisma.catalogue.findMany({
    where: { ownerId },
    orderBy: { createdAt: "desc" },
    include: { photos: true },
  });
  return catalogues.map(toCatalogue);
}

export async function getCatalogueById(
  id: string,
): Promise<Catalogue | undefined> {
  const catalogue = await prisma.catalogue.findUnique({
    where: { id },
    include: { photos: true },
  });
  return catalogue ? toCatalogue(catalogue) : undefined;
}

export async function addCatalogue(
  input: CreateCatalogueInput,
): Promise<Catalogue> {
  const catalogue = await prisma.catalogue.create({
    data: {
      ownerId: input.ownerId,
      name: input.name.trim(),
      description: input.description?.trim() || null,
      photos: {
        create: input.photos.map((p, index) => ({
          image: p.image,
          caption: p.caption?.trim() || null,
          price: p.price ?? null,
          position: index,
        })),
      },
    },
    include: { photos: true },
  });
  return toCatalogue(catalogue);
}
