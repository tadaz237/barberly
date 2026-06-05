import { prisma } from "@/src/lib/prisma";
import type { Gender } from "@/src/lib/users-store";

export type TopProvider = {
  providerId: string;
  name: string;
  image?: string;
  gender?: Gender;
  city?: string;
  category?: string;
  serviceId: string;
  rating: number;
  reviewCount: number;
};

export type ReviewItem = {
  id: string;
  providerId: string;
  clientName: string;
  serviceName: string;
  rating: number;
  comment?: string;
  createdAt: string;
};

export type ReviewSummary = {
  average: number;
  count: number;
};

function toReviewItem(row: {
  id: string;
  providerId: string;
  rating: number;
  comment: string | null;
  createdAt: Date;
  client: { name: string };
  reservation: { service: { name: string } };
}): ReviewItem {
  return {
    id: row.id,
    providerId: row.providerId,
    clientName: row.client.name,
    serviceName: row.reservation.service.name,
    rating: row.rating,
    comment: row.comment ?? undefined,
    createdAt: row.createdAt.toISOString(),
  };
}

export async function getProviderReviewSummary(
  providerId: string,
): Promise<ReviewSummary> {
  const result = await prisma.review.aggregate({
    where: { providerId, status: "published" },
    _avg: { rating: true },
    _count: { id: true },
  });

  return {
    average: result._avg.rating ?? 0,
    count: result._count.id,
  };
}

export async function getTopRatedProviders(limit = 6): Promise<TopProvider[]> {
  const grouped = await prisma.review.groupBy({
    by: ["providerId"],
    where: { status: "published" },
    _avg: { rating: true },
    _count: { _all: true },
  });

  const ranked = grouped
    .map((row) => ({
      providerId: row.providerId,
      rating: row._avg.rating ?? 0,
      reviewCount: row._count._all,
    }))
    .filter((row) => row.reviewCount > 0)
    .sort((a, b) => b.rating - a.rating || b.reviewCount - a.reviewCount)
    .slice(0, limit);

  if (ranked.length === 0) return [];

  const providers = await prisma.user.findMany({
    where: {
      id: { in: ranked.map((row) => row.providerId) },
      role: "professional",
    },
    select: {
      id: true,
      name: true,
      image: true,
      gender: true,
      services: {
        take: 1,
        orderBy: [{ featured: "desc" }, { createdAt: "desc" }],
        select: { id: true, city: true, category: true },
      },
    },
  });

  const byId = new Map(providers.map((provider) => [provider.id, provider]));

  return ranked
    .map((row): TopProvider | null => {
      const provider = byId.get(row.providerId);
      const service = provider?.services[0];
      if (!provider || !service) return null;
      return {
        providerId: row.providerId,
        name: provider.name,
        image: provider.image ?? undefined,
        gender: (provider.gender ?? undefined) as Gender | undefined,
        city: service.city,
        category: service.category,
        serviceId: service.id,
        rating: row.rating,
        reviewCount: row.reviewCount,
      };
    })
    .filter((provider): provider is TopProvider => provider !== null);
}

export async function getProviderReviews(
  providerId: string,
  limit = 6,
): Promise<ReviewItem[]> {
  const reviews = await prisma.review.findMany({
    where: { providerId, status: "published" },
    orderBy: { createdAt: "desc" },
    take: limit,
    include: {
      client: { select: { name: true } },
      reservation: { select: { service: { select: { name: true } } } },
    },
  });

  return reviews.map(toReviewItem);
}

export async function createReview(input: {
  clientId: string;
  reservationId: string;
  rating: number;
  comment?: string;
}): Promise<
  | { review: ReviewItem }
  | {
      error:
        | "reservation_not_found"
        | "not_completed"
        | "provider_missing"
        | "already_reviewed";
    }
> {
  const reservation = await prisma.reservation.findFirst({
    where: { id: input.reservationId, clientId: input.clientId },
    include: {
      service: { select: { id: true, name: true, ownerId: true } },
      review: { select: { id: true } },
    },
  });

  if (!reservation) return { error: "reservation_not_found" };
  if (reservation.status !== "completed") return { error: "not_completed" };

  const providerId = reservation.coiffeurId ?? reservation.service.ownerId;
  if (!providerId) return { error: "provider_missing" };

  const existing = await prisma.review.findFirst({
    where: {
      OR: [
        { reservationId: reservation.id },
        { clientId: input.clientId, providerId },
      ],
    },
    select: { id: true },
  });
  if (reservation.review || existing) return { error: "already_reviewed" };

  const review = await prisma.review.create({
    data: {
      reservationId: reservation.id,
      clientId: input.clientId,
      providerId,
      serviceId: reservation.service.id,
      rating: input.rating,
      comment: input.comment?.trim() || null,
    },
    include: {
      client: { select: { name: true } },
      reservation: { select: { service: { select: { name: true } } } },
    },
  });

  return { review: toReviewItem(review) };
}
