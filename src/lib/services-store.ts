import type { Service } from "@prisma/client";
import { prisma } from "@/src/lib/prisma";
import { PLAN_LIMITS, type Gender, type Plan } from "@/src/lib/users-store";

export type ServiceItem = {
  id: string;
  ownerId: string | null;
  name: string;
  category: string;
  price: number;
  duration: number;
  city: string;
  neighborhood: string;
  description: string;
  image?: string;
  featured?: boolean;
  createdAt: string;
  ownerPlan?: Plan;
  ownerKycVerified?: boolean;
  ownerGender?: Gender;
};

export type CreateServiceInput = {
  ownerId: string | null;
  name: string;
  category: string;
  price: number;
  duration: number;
  city: string;
  neighborhood: string;
  description: string;
  image?: string;
  featured?: boolean;
};

function toServiceItem(
  service: Service,
  ownerMeta?: { plan: Plan; kycVerified: boolean; gender?: Gender },
): ServiceItem {
  return {
    id: service.id,
    ownerId: service.ownerId,
    name: service.name,
    category: service.category,
    price: service.price,
    duration: service.duration,
    city: service.city,
    neighborhood: service.neighborhood,
    description: service.description,
    image: service.image ?? undefined,
    featured: service.featured,
    createdAt: service.createdAt.toISOString(),
    ownerPlan: ownerMeta?.plan,
    ownerKycVerified: ownerMeta?.kycVerified,
    ownerGender: ownerMeta?.gender,
  };
}

export async function getServices(): Promise<ServiceItem[]> {
  const services = await prisma.service.findMany({
    orderBy: [{ featured: "desc" }, { createdAt: "desc" }],
    include: {
      owner: {
        select: {
          plan: true,
          gender: true,
          kyc: { select: { status: true, gender: true } },
        },
      },
    },
  });

  return services
    .map((s) => {
      const ownerMeta = s.owner
        ? {
            plan: s.owner.plan as Plan,
            kycVerified: s.owner.kyc?.status === "verified",
            gender: ((s.owner.gender ?? s.owner.kyc?.gender) ?? undefined) as
              | Gender
              | undefined,
          }
        : undefined;
      return {
        service: toServiceItem(s, ownerMeta),
        boost: ownerMeta ? PLAN_LIMITS[ownerMeta.plan].marketplaceBoost : 0,
      };
    })
    .sort((a, b) => b.boost - a.boost)
    .map((entry) => entry.service);
}

export async function getServiceById(
  id: string,
): Promise<ServiceItem | undefined> {
  const service = await prisma.service.findUnique({ where: { id } });
  return service ? toServiceItem(service) : undefined;
}

export async function getServicesByOwner(
  ownerId: string,
): Promise<ServiceItem[]> {
  const services = await prisma.service.findMany({
    where: { ownerId },
    orderBy: { createdAt: "desc" },
  });
  return services.map((s) => toServiceItem(s));
}

export async function countServicesPublishedToday(
  ownerId: string,
): Promise<number> {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  return prisma.service.count({
    where: { ownerId, createdAt: { gte: startOfDay } },
  });
}

export async function addService(
  input: CreateServiceInput,
): Promise<ServiceItem> {
  const service = await prisma.service.create({
    data: {
      ownerId: input.ownerId,
      name: input.name.trim(),
      category: input.category.trim(),
      price: Number(input.price),
      duration: Number(input.duration),
      city: input.city.trim(),
      neighborhood: input.neighborhood.trim(),
      description: input.description.trim(),
      image: input.image,
      featured: Boolean(input.featured),
    },
  });
  return toServiceItem(service);
}
