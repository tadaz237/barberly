import { NextResponse } from "next/server";
import { auth } from "@/src/lib/auth";
import {
  COIFFEUR_SPECIALTIES,
  COIFFEUSE_SPECIALTIES,
  getKycSubmission,
  setUserKyc,
  type Gender,
  type KycSpecialty,
} from "@/src/lib/users-store";

const PHONE_RE = /^[+]?[\d\s().-]{6,20}$/;

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ message: "Non authentifié." }, { status: 401 });
  }

  const kyc = await getKycSubmission(session.user.id);
  return NextResponse.json({ kyc });
}

type IncomingPayload = {
  legalName?: unknown;
  dateOfBirth?: unknown;
  phone?: unknown;
  city?: unknown;
  postalCode?: unknown;
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
    !isNonEmptyString(body.postalCode) ||
    !isNonEmptyString(body.bio) ||
    !isNonEmptyString(body.serviceAreas)
  ) {
    return NextResponse.json(
      { message: "Tous les champs obligatoires doivent être renseignés." },
      { status: 400 },
    );
  }

  if (!PHONE_RE.test(body.phone)) {
    return NextResponse.json(
      { message: "Numéro de téléphone invalide." },
      { status: 400 },
    );
  }

  const dob = new Date(body.dateOfBirth);
  if (Number.isNaN(dob.getTime())) {
    return NextResponse.json(
      { message: "Date de naissance invalide." },
      { status: 400 },
    );
  }
  const age = (Date.now() - dob.getTime()) / (365.25 * 24 * 60 * 60 * 1000);
  if (age < 18) {
    return NextResponse.json(
      { message: "Vous devez être majeur pour publier des services." },
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

  const experience = Number(body.experienceYears);
  if (!Number.isFinite(experience) || experience < 0 || experience > 80) {
    return NextResponse.json(
      { message: "Années d'expérience invalides." },
      { status: 400 },
    );
  }

  const publicUser = await setUserKyc(session.user.id, {
    gender,
    legalName: body.legalName.trim(),
    dateOfBirth: body.dateOfBirth,
    phone: body.phone.trim(),
    city: body.city.trim(),
    postalCode: body.postalCode.trim(),
    specialties,
    experienceYears: experience,
    bio: body.bio.trim(),
    serviceAreas: body.serviceAreas.trim(),
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
