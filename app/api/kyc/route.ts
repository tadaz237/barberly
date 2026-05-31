import { NextResponse } from "next/server";
import { auth } from "@/src/lib/auth";
import {
  COIFFEUR_SPECIALTIES,
  COIFFEUSE_SPECIALTIES,
  getKycSubmission,
  getUserById,
  isProfessionalUser,
  setUserKyc,
  type Gender,
  type KycSpecialty,
} from "@/src/lib/users-store";
import {
  normalizeKycInput,
  validateKycInput,
} from "@/src/lib/kyc-validation";

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ message: "Non authentifié." }, { status: 401 });
  }

  const user = await getUserById(session.user.id);
  if (!isProfessionalUser(user)) {
    return NextResponse.json(
      { message: "Le KYC est réservé aux comptes professionnels." },
      { status: 403 },
    );
  }

  const kyc = await getKycSubmission(session.user.id);
  return NextResponse.json({ kyc });
}

type IncomingPayload = {
  legalName?: unknown;
  dateOfBirth?: unknown;
  phone?: unknown;
  city?: unknown;
  specialties?: unknown;
  experienceYears?: unknown;
  bio?: unknown;
  serviceAreas?: unknown;
  gender?: unknown;
};

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json(
      { message: "Vous devez être connecté pour soumettre votre KYC." },
      { status: 401 },
    );
  }

  const user = await getUserById(session.user.id);
  if (!isProfessionalUser(user)) {
    return NextResponse.json(
      { message: "Le KYC est réservé aux comptes professionnels." },
      { status: 403 },
    );
  }

  let body: IncomingPayload;
  try {
    body = (await request.json()) as IncomingPayload;
  } catch {
    return NextResponse.json({ message: "Requête invalide." }, { status: 400 });
  }

  if (
    !isNonEmptyString(body.legalName) ||
    !isNonEmptyString(body.dateOfBirth) ||
    !isNonEmptyString(body.phone) ||
    !isNonEmptyString(body.city) ||
    !isNonEmptyString(body.bio) ||
    !isNonEmptyString(body.serviceAreas)
  ) {
    return NextResponse.json(
      { message: "Tous les champs obligatoires doivent être renseignés." },
      { status: 400 },
    );
  }

  const rawExperience =
    typeof body.experienceYears === "string" ||
    typeof body.experienceYears === "number"
      ? body.experienceYears
      : "";
  const normalizedKyc = normalizeKycInput({
    legalName: body.legalName,
    dateOfBirth: body.dateOfBirth,
    phone: body.phone,
    city: body.city,
    experienceYears: rawExperience,
    bio: body.bio,
    serviceAreas: body.serviceAreas,
  });
  const validationMessage = validateKycInput(normalizedKyc);
  if (validationMessage) {
    return NextResponse.json(
      { message: validationMessage },
      { status: 400 },
    );
  }

  let gender: Gender | undefined;
  if (body.gender === "male" || body.gender === "female") {
    gender = body.gender;
  }

  const ALLOWED: KycSpecialty[] = Array.from(
    new Set([...COIFFEUR_SPECIALTIES, ...COIFFEUSE_SPECIALTIES]),
  );
  if (!Array.isArray(body.specialties) || body.specialties.length === 0) {
    return NextResponse.json(
      { message: "Sélectionnez au moins une spécialité." },
      { status: 400 },
    );
  }
  const specialties: KycSpecialty[] = [];
  for (const raw of body.specialties) {
    if (typeof raw !== "string" || !ALLOWED.includes(raw as KycSpecialty)) {
      return NextResponse.json(
        { message: "Spécialité invalide détectée." },
        { status: 400 },
      );
    }
    specialties.push(raw as KycSpecialty);
  }

  const experience = Number(normalizedKyc.experienceYears);
  if (!Number.isInteger(experience) || experience < 0 || experience > 80) {
    return NextResponse.json(
      { message: "Années d'expérience invalides." },
      { status: 400 },
    );
  }

  const publicUser = await setUserKyc(session.user.id, {
    gender,
    legalName: normalizedKyc.legalName,
    dateOfBirth: normalizedKyc.dateOfBirth,
    phone: normalizedKyc.phone,
    city: normalizedKyc.city,
    specialties,
    experienceYears: experience,
    bio: normalizedKyc.bio,
    serviceAreas: normalizedKyc.serviceAreas,
  });

  if (!publicUser) {
    return NextResponse.json(
      { message: "Utilisateur introuvable." },
      { status: 404 },
    );
  }

  return NextResponse.json(
    {
      user: publicUser,
      message:
        "KYC soumis. Vous pouvez publier vos prestations en attendant la validation.",
    },
    { status: 201 },
  );
}
