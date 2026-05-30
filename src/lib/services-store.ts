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
  latitude?: number;
  longitude?: number;
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

export type UpdateServiceInput = Omit<CreateServiceInput, "ownerId" | "image"> & {
  image?: string | null;
};

const SERVICE_OWNER_SELECT = {
  plan: true,
  gender: true,
  kyc: { select: { status: true, gender: true } },
} as const;

type ServiceOwnerMeta = {
  plan: Plan;
  gender: Gender | null;
  kyc: { status: string; gender: Gender | null } | null;
} | null;

const CITY_COORDINATES: Record<string, { latitude: number; longitude: number }> = {
  abidjan: { latitude: 5.36, longitude: -4.0083 },
  bamako: { latitude: 12.6392, longitude: -8.0029 },
  cotonou: { latitude: 6.3703, longitude: 2.3912 },
  dakar: { latitude: 14.7167, longitude: -17.4677 },
  douala: { latitude: 4.0511, longitude: 9.7679 },
  lyon: { latitude: 45.764, longitude: 4.8357 },
  marseille: { latitude: 43.2965, longitude: 5.3698 },
  paris: { latitude: 48.8566, longitude: 2.3522 },
  yaounde: { latitude: 3.848, longitude: 11.5021 },
};

function normalizeCity(city: string) {
  return city
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function getApproximateCoordinates(city: string) {
  return CITY_COORDINATES[normalizeCity(city)];
}

function toServiceItem(
  service: Service,
  ownerMeta?: { plan: Plan; kycVerified: boolean; gender?: Gender },
): ServiceItem {
  const coordinates = getApproximateCoordinates(service.city);

  return {
    id: service.id,
    ownerId: service.ownerId,
    name: service.name,
    category: service.category,
    price: service.price,
    duration: service.duration,
    city: service.city,
    neighborhood: service.neighborhood,
    latitude: coordinates?.latitude,
    longitude: coordinates?.longitude,
    description: service.description,
    image: service.image ?? undefined,
    featured: service.featured,
    createdAt: service.createdAt.toISOString(),
    ownerPlan: ownerMeta?.plan,
    ownerKycVerified: ownerMeta?.kycVerified,
    ownerGender: ownerMeta?.gender,
  };
}

function toOwnerMeta(owner: ServiceOwnerMeta | undefined) {
  if (!owner) return undefined;

  return {
    plan: owner.plan as Plan,
    kycVerified: owner.kyc?.status === "verified",
    gender: ((owner.gender ?? owner.kyc?.gender) ?? undefined) as
      | Gender
      | undefined,
  };
}

export async function getServices(): Promise<ServiceItem[]> {
  const services = await prisma.service.findMany({
    orderBy: [{ featured: "desc" }, { createdAt: "desc" }],
    include: {
      owner: { select: SERVICE_OWNER_SELECT },
    },
  });

  return services
    .map((s) => {
      const ownerMeta = toOwnerMeta(s.owner);
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
  const service = await prisma.service.findUnique({
    where: { id },
    include: { owner: { select: SERVICE_OWNER_SELECT } },
  });
  return service ? toServiceItem(service, toOwnerMeta(service.owner)) : undefined;
}

export async function getServiceByOwner(
  ownerId: string,
  id: string,
): Promise<ServiceItem | undefined> {
  const service = await prisma.service.findFirst({
    where: { id, ownerId },
  });
  return service ? toServiceItem(service) : undefined;
}

export async function getServicesByOwner(
  ownerId: string,
): Promise<ServiceItem[]> {
  const services = await prisma.service.findMany({
    where: { ownerId },
    orderBy: { createdAt: "desc" },
    include: { owner: { select: SERVICE_OWNER_SELECT } },
  });
  return services.map((s) => toServiceItem(s, toOwnerMeta(s.owner)));
}

export async function countServicesByOwner(ownerId: string): Promise<number> {
  return prisma.service.count({ where: { ownerId } });
}

export async function getLatestServiceCreatedAt(
  ownerId: string,
): Promise<Date | null> {
  const service = await prisma.service.findFirst({
    where: { ownerId },
    orderBy: { createdAt: "desc" },
    select: { createdAt: true },
  });
  return service?.createdAt ?? null;
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

export async function updateService(
  ownerId: string,
  id: string,
  input: UpdateServiceInput,
): Promise<ServiceItem | undefined> {
  const updated = await prisma.service.updateMany({
    where: { id, ownerId },
    data: {
      name: input.name.trim(),
      category: input.category.trim(),
      price: Number(input.price),
      duration: Number(input.duration),
      city: input.city.trim(),
      neighborhood: input.neighborhood.trim(),
      description: input.description.trim(),
      ...(input.image !== undefined ? { image: input.image } : {}),
      featured: Boolean(input.featured),
    },
  });

  if (updated.count === 0) return undefined;

  const service = await prisma.service.findUnique({ where: { id } });
  return service ? toServiceItem(service) : undefined;
}

export async function deleteService(
  ownerId: string,
  id: string,
): Promise<boolean> {
  const deleted = await prisma.service.deleteMany({
    where: { id, ownerId },
  });
  return deleted.count > 0;
}
