import { hash, compare } from "bcryptjs";
import type { Kyc, User } from "@prisma/client";
import { prisma } from "@/src/lib/prisma";

export type Plan = "free" | "essential" | "pro" | "premium";
export type AccountRole = "client" | "professional";

export type PlanLimits = {
  servicesPerDay: number; // Infinity = illimité
  servicesMax: number; // Infinity = illimité
  servicePublishCooldownDays: number;
  cataloguesMax: number;
  cataloguePhotosMax: number;
  productsMax: number;
  marketplaceBoost: number; // poids dans le tri (plus haut = plus haut)
};

export const PLAN_LIMITS: Record<Plan, PlanLimits> = {
  free: {
    servicesPerDay: 1,
    servicesMax: 7,
    servicePublishCooldownDays: 2,
    cataloguesMax: 5,
    cataloguePhotosMax: 5,
    productsMax: 2,
    marketplaceBoost: 0,
  },
  essential: {
    servicesPerDay: 3,
    servicesMax: Number.POSITIVE_INFINITY,
    servicePublishCooldownDays: 0,
    cataloguesMax: 10,
    cataloguePhotosMax: 10,
    productsMax: 10,
    marketplaceBoost: 1,
  },
  pro: {
    servicesPerDay: 6,
    servicesMax: Number.POSITIVE_INFINITY,
    servicePublishCooldownDays: 0,
    cataloguesMax: 20,
    cataloguePhotosMax: 20,
    productsMax: 20,
    marketplaceBoost: 2,
  },
  premium: {
    servicesPerDay: Number.POSITIVE_INFINITY,
    servicesMax: Number.POSITIVE_INFINITY,
    servicePublishCooldownDays: 0,
    cataloguesMax: Number.POSITIVE_INFINITY,
    cataloguePhotosMax: 30,
    productsMax: Number.POSITIVE_INFINITY,
    marketplaceBoost: 3,
  },
};

export const PLAN_LABEL: Record<Plan, string> = {
  free: "Gratuit",
  essential: "Essentiel",
  pro: "Pro",
  premium: "Premium",
};

export type Gender = "male" | "female";

export type IdDocumentType = "cni" | "passport" | "license";

export type KycSpecialty =
  // partagé / mixte
  | "tresses"
  | "coloration"
  | "enfants"
  // coiffeur (homme)
  | "coupe-homme"
  | "barbier"
  | "degrade"
  | "rasage"
  | "tonte"
  // coiffeuse (femme)
  | "coupe-femme"
  | "brushing"
  | "lissages-soins"
  | "extensions"
  | "evenement"
  | "soins-cuir-chevelu";

export const COIFFEUR_SPECIALTIES: KycSpecialty[] = [
  "coupe-homme",
  "barbier",
  "degrade",
  "rasage",
  "tonte",
  "tresses",
  "coloration",
  "enfants",
];

export const COIFFEUSE_SPECIALTIES: KycSpecialty[] = [
  "coupe-femme",
  "brushing",
  "tresses",
  "coloration",
  "lissages-soins",
  "soins-cuir-chevelu",
  "extensions",
  "evenement",
  "enfants",
];

export const SPECIALTY_LABEL: Record<KycSpecialty, string> = {
  "coupe-homme": "Coupe homme",
  barbier: "Barbier",
  degrade: "Dégradé",
  rasage: "Rasage traditionnel",
  tonte: "Tonte",
  "coupe-femme": "Coupe femme",
  brushing: "Brushing",
  tresses: "Tresses & protectrices",
  coloration: "Coloration",
  "lissages-soins": "Lissages & soins",
  "soins-cuir-chevelu": "Soins du cuir chevelu",
  extensions: "Extensions / mèches",
  evenement: "Mariage / événement",
  enfants: "Enfants",
};

export type KycStatus =
  | "none"
  | "submitted"
  | "verified"
  | "rejected"
  | "blocked";

export type KycSubmission = {
  gender?: Gender;
  legalName: string;
  dateOfBirth: string;
  phone: string;
  city: string;
  postalCode: string;
  idType?: IdDocumentType;
  idFront?: string;
  idBack?: string;
  selfie?: string;
  specialties: KycSpecialty[];
  experienceYears: number;
  bio: string;
  serviceAreas: string;
  submittedAt: string;
  status: "submitted" | "verified" | "rejected";
  reviewedAt?: string;
  reviewedBy?: string;
  rejectionReason?: string;
  rejectionDeadline?: string;
};

export type OAuthUpsertInput = {
  name: string;
  email: string;
  image?: string;
  provider: "google";
  gender?: Gender;
  role?: AccountRole;
};

export type PublicUser = {
  id: string;
  name: string;
  email: string;
  image?: string;
  phone?: string;
  bio?: string;
  gender?: Gender;
  role: AccountRole;
  kycStatus: KycStatus;
  plan: Plan;
  planExpiresAt?: string;
};

export type RegisterInput = {
  name: string;
  email: string;
  password: string;
  image?: string;
  gender?: Gender;
  role?: AccountRole;
};

export type UpdateUserProfileInput = {
  name: string;
  image?: string | null;
};

export type AccountDeletionSnapshot = {
  email: string;
  imageUrls: string[];
};

export type SubmitKycInput = Omit<
  KycSubmission,
  | "postalCode"
  | "submittedAt"
  | "status"
  | "reviewedAt"
  | "reviewedBy"
  | "rejectionReason"
  | "rejectionDeadline"
> & {
  postalCode?: string;
};

export type KycListEntry = {
  user: { id: string; name: string; email: string; image?: string };
  submission: KycSubmission;
  effectiveStatus: KycStatus;
};

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function deriveKycStatus(kyc: Kyc | null | undefined): KycStatus {
  if (!kyc) return "none";
  if (kyc.status === "rejected") {
    if (kyc.rejectionDeadline && kyc.rejectionDeadline.getTime() < Date.now()) {
      return "blocked";
    }
    return "rejected";
  }
  return kyc.status;
}

function toKycSubmission(kyc: Kyc): KycSubmission {
  return {
    gender: kyc.gender ?? undefined,
    legalName: kyc.legalName,
    dateOfBirth: kyc.dateOfBirth,
    phone: kyc.phone,
    city: kyc.city,
    postalCode: kyc.postalCode,
    idType: (kyc.idType as IdDocumentType | null) ?? undefined,
    idFront: kyc.idFront ?? undefined,
    idBack: kyc.idBack ?? undefined,
    selfie: kyc.selfie ?? undefined,
    specialties: kyc.specialties as KycSpecialty[],
    experienceYears: kyc.experienceYears,
    bio: kyc.bio,
    serviceAreas: kyc.serviceAreas,
    submittedAt: kyc.submittedAt.toISOString(),
    status: kyc.status,
    reviewedAt: kyc.reviewedAt?.toISOString(),
    reviewedBy: kyc.reviewedBy ?? undefined,
    rejectionReason: kyc.rejectionReason ?? undefined,
    rejectionDeadline: kyc.rejectionDeadline?.toISOString(),
  };
}

function toPublic(user: User & { kyc: Kyc | null }): PublicUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    image: user.image ?? undefined,
    phone: user.phone ?? undefined,
    bio: user.bio ?? undefined,
    gender: user.gender ?? undefined,
    role: user.role,
    kycStatus: deriveKycStatus(user.kyc),
    plan: user.plan,
    planExpiresAt: user.planExpiresAt?.toISOString(),
  };
}

export async function getUserPlan(userId: string): Promise<Plan> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { plan: true },
  });
  return user?.plan ?? "free";
}

export async function getUserLimits(userId: string): Promise<PlanLimits> {
  const plan = await getUserPlan(userId);
  return PLAN_LIMITS[plan];
}

export async function setUserPlan(
  userId: string,
  plan: Plan,
  durationDays = 30,
): Promise<PublicUser | null> {
  const expires =
    plan === "free"
      ? null
      : new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000);
  const user = await prisma.user.update({
    where: { id: userId },
    data: { plan, planExpiresAt: expires },
    include: { kyc: true },
  });
  return toPublic(user);
}

export async function getUserById(id: string): Promise<PublicUser | undefined> {
  const user = await prisma.user.findUnique({
    where: { id },
    include: { kyc: true },
  });
  return user ? toPublic(user) : undefined;
}

export async function updateUserProfile(
  userId: string,
  input: UpdateUserProfileInput,
): Promise<PublicUser | null> {
  const updated = await prisma.user.updateMany({
    where: { id: userId },
    data: {
      name: input.name.trim(),
      ...(input.image !== undefined ? { image: input.image } : {}),
    },
  });

  if (updated.count === 0) return null;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { kyc: true },
  });

  return user ? toPublic(user) : null;
}

export async function getAccountDeletionSnapshot(
  userId: string,
): Promise<AccountDeletionSnapshot | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      email: true,
      image: true,
      kyc: { select: { idFront: true, idBack: true, selfie: true } },
      services: { select: { image: true } },
      catalogues: {
        select: {
          photos: { select: { image: true } },
        },
      },
      products: { select: { image: true } },
    },
  });

  if (!user) return null;

  return {
    email: user.email,
    imageUrls: [
      user.image,
      user.kyc?.idFront,
      user.kyc?.idBack,
      user.kyc?.selfie,
      ...user.services.map((service) => service.image),
      ...user.catalogues.flatMap((catalogue) =>
        catalogue.photos.map((photo) => photo.image),
      ),
      ...user.products.map((product) => product.image),
    ].filter((imageUrl): imageUrl is string => Boolean(imageUrl)),
  };
}

export async function deleteUserAccount(userId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true },
  });

  if (!user) return false;

  await prisma.$transaction(async (tx) => {
    await tx.verificationCode.deleteMany({
      where: {
        OR: [{ userId }, { email: user.email }],
      },
    });
    await tx.reservation.deleteMany({
      where: { OR: [{ coiffeurId: userId }, { clientId: userId }] },
    });
    await tx.service.deleteMany({ where: { ownerId: userId } });
    await tx.user.delete({ where: { id: userId } });
  });

  return true;
}

export async function getKycStatus(userId: string): Promise<KycStatus> {
  const kyc = await prisma.kyc.findUnique({ where: { userId } });
  return deriveKycStatus(kyc);
}

export async function canPublishServices(userId: string): Promise<boolean> {
  const status = await getKycStatus(userId);
  return (
    status === "submitted" || status === "verified" || status === "rejected"
  );
}

export async function isKycVerified(userId: string): Promise<boolean> {
  return (await getKycStatus(userId)) === "verified";
}

export async function getKycSubmission(
  userId: string,
): Promise<KycSubmission | null> {
  const kyc = await prisma.kyc.findUnique({ where: { userId } });
  return kyc ? toKycSubmission(kyc) : null;
}

export async function setUserKyc(
  userId: string,
  input: SubmitKycInput,
): Promise<PublicUser | null> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return null;

  const data = {
    gender: input.gender ?? user.gender ?? null,
    legalName: input.legalName,
    dateOfBirth: input.dateOfBirth,
    phone: input.phone,
    city: input.city,
    postalCode: input.postalCode?.trim() ?? "",
    idType: input.idType ?? null,
    idFront: input.idFront ?? null,
    idBack: input.idBack ?? null,
    selfie: input.selfie ?? null,
    specialties: input.specialties,
    experienceYears: input.experienceYears,
    bio: input.bio,
    serviceAreas: input.serviceAreas,
  };

  await prisma.kyc.upsert({
    where: { userId },
    create: { userId, ...data, status: "submitted" },
    update: {
      ...data,
      status: "submitted",
      submittedAt: new Date(),
      reviewedAt: null,
      reviewedBy: null,
      rejectionReason: null,
      rejectionDeadline: null,
    },
  });

  const updated = await prisma.user.update({
    where: { id: userId },
    data: {
      phone: input.phone,
      bio: user.bio ?? input.bio,
      gender: input.gender ?? user.gender ?? null,
    },
    include: { kyc: true },
  });

  return toPublic(updated);
}

export async function setUserGender(
  userId: string,
  gender: Gender,
): Promise<void> {
  await prisma.user.updateMany({
    where: { id: userId, gender: null },
    data: { gender },
  });
}

export async function listKycSubmissions(filter?: {
  status?: KycStatus | "all";
}): Promise<KycListEntry[]> {
  const wanted = filter?.status ?? "all";
  const rows = await prisma.kyc.findMany({
    orderBy: { submittedAt: "desc" },
    include: { user: true },
  });

  return rows
    .map((kyc) => ({
      user: {
        id: kyc.user.id,
        name: kyc.user.name,
        email: kyc.user.email,
        image: kyc.user.image ?? undefined,
      },
      submission: toKycSubmission(kyc),
      effectiveStatus: deriveKycStatus(kyc),
    }))
    .filter((entry) => wanted === "all" || entry.effectiveStatus === wanted);
}

export async function approveKyc(
  userId: string,
  reviewerId: string,
): Promise<KycSubmission | null> {
  const existing = await prisma.kyc.findUnique({ where: { userId } });
  if (!existing) return null;

  const updated = await prisma.kyc.update({
    where: { userId },
    data: {
      status: "verified",
      reviewedAt: new Date(),
      reviewedBy: reviewerId,
      rejectionReason: null,
      rejectionDeadline: null,
    },
  });
  return toKycSubmission(updated);
}

export async function rejectKyc(
  userId: string,
  reviewerId: string,
  reason: string,
): Promise<KycSubmission | null> {
  const existing = await prisma.kyc.findUnique({ where: { userId } });
  if (!existing) return null;

  const deadline = new Date(Date.now() + 72 * 60 * 60 * 1000);
  const updated = await prisma.kyc.update({
    where: { userId },
    data: {
      status: "rejected",
      reviewedAt: new Date(),
      reviewedBy: reviewerId,
      rejectionReason: reason.trim(),
      rejectionDeadline: deadline,
    },
  });
  return toKycSubmission(updated);
}

export function isPlatformAdmin(email: string | null | undefined): boolean {
  if (!email) return false;
  const list = (process.env.PLATFORM_ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  return list.includes(email.toLowerCase());
}

export function isProfessionalUser(user: PublicUser | null | undefined) {
  return user?.role === "professional";
}

export function isClientUser(user: PublicUser | null | undefined) {
  return user?.role === "client";
}

export async function registerUser(
  input: RegisterInput,
): Promise<{ user: PublicUser } | { error: "email_taken" }> {
  const email = normalizeEmail(input.email);

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return { error: "email_taken" };
  }

  const passwordHash = await hash(input.password, 10);
  const user = await prisma.user.create({
    data: {
      name: input.name.trim(),
      email,
      passwordHash,
      image: input.image,
      gender: input.role === "client" ? null : input.gender,
      role: input.role ?? "professional",
      provider: "credentials",
    },
    include: { kyc: true },
  });

  return { user: toPublic(user) };
}

export async function verifyCredentials(
  email: string,
  password: string,
): Promise<PublicUser | null> {
  const user = await prisma.user.findUnique({
    where: { email: normalizeEmail(email) },
    include: { kyc: true },
  });
  if (!user || !user.passwordHash) return null;

  const ok = await compare(password, user.passwordHash);
  if (!ok) return null;

  return toPublic(user);
}

export async function getCredentialsUserByEmail(
  email: string,
): Promise<PublicUser | null> {
  const user = await prisma.user.findUnique({
    where: { email: normalizeEmail(email) },
    include: { kyc: true },
  });

  if (!user?.passwordHash) return null;

  return toPublic(user);
}

export async function updateCredentialsPassword(
  email: string,
  password: string,
): Promise<boolean> {
  const passwordHash = await hash(password, 10);
  const updated = await prisma.user.updateMany({
    where: {
      email: normalizeEmail(email),
      passwordHash: { not: null },
    },
    data: { passwordHash },
  });

  return updated.count > 0;
}

export async function upsertOAuthUser(
  input: OAuthUpsertInput,
): Promise<PublicUser> {
  const email = normalizeEmail(input.email);
  const existing = await prisma.user.findUnique({
    where: { email },
    include: { kyc: true },
  });

  if (existing) {
    const patch: { image?: string; gender?: Gender; role?: AccountRole } = {};
    if (!existing.image && input.image) patch.image = input.image;
    if (!existing.gender && input.gender && input.role !== "client") {
      patch.gender = input.gender;
    }
    if (existing.role !== input.role && input.role) patch.role = input.role;
    if (Object.keys(patch).length > 0) {
      const updated = await prisma.user.update({
        where: { id: existing.id },
        data: patch,
        include: { kyc: true },
      });
      return toPublic(updated);
    }
    return toPublic(existing);
  }

  const user = await prisma.user.create({
    data: {
      name: input.name.trim() || "Utilisateur",
      email,
      image: input.image,
      gender: input.role === "client" ? null : input.gender,
      role: input.role ?? "professional",
      provider: "google",
    },
    include: { kyc: true },
  });
  return toPublic(user);
}
