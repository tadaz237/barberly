export const KYC_MIN_AGE = 18;
export const KYC_MAX_AGE = 100;
export const KYC_MIN_BIO_LENGTH = 20;

export type KycValidationInput = {
  legalName: string;
  dateOfBirth: string;
  phone: string;
  city: string;
  experienceYears: string | number;
  bio: string;
  serviceAreas: string;
};

const NAME_RE = /^[\p{L}\p{M}][\p{L}\p{M}\s'’-]{1,78}[\p{L}\p{M}]$/u;
const CITY_RE = /^[\p{L}\p{M}][\p{L}\p{M}\s'’-]{1,58}[\p{L}\p{M}]$/u;
const PHONE_RE = /^\+?[\d\s().-]{6,20}$/;
const AREA_RE = /^[\p{L}\p{M}\p{N}][\p{L}\p{M}\p{N}\s'’.,;/-]{2,118}$/u;

function cleanInlineText(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

function cleanLongText(value: string) {
  return value.trim().replace(/\s{2,}/g, " ");
}

export function sanitizePersonNameInput(value: string) {
  return value.replace(/[^\p{L}\p{M}\s'’-]/gu, "").replace(/\s{2,}/g, " ");
}

export function sanitizeCityInput(value: string) {
  return value.replace(/[^\p{L}\p{M}\s'’-]/gu, "").replace(/\s{2,}/g, " ");
}

export function sanitizePhoneInput(value: string) {
  const cleaned = value.replace(/[^\d+().\-\s]/g, "");
  return cleaned.replace(/(?!^)\+/g, "").slice(0, 20);
}

export function sanitizeServiceAreasInput(value: string) {
  return value
    .replace(/[^\p{L}\p{M}\p{N}\s'’.,;/-]/gu, "")
    .replace(/\s{2,}/g, " ");
}

export function sanitizePositiveIntegerInput(value: string, maxLength = 2) {
  return value.replace(/[^\d]/g, "").slice(0, maxLength);
}

export function normalizeKycInput(input: KycValidationInput) {
  return {
    legalName: cleanInlineText(input.legalName),
    dateOfBirth: input.dateOfBirth,
    phone: cleanInlineText(input.phone),
    city: cleanInlineText(input.city),
    experienceYears: input.experienceYears,
    bio: cleanLongText(input.bio),
    serviceAreas: cleanInlineText(input.serviceAreas),
  };
}

export function getAdultMaxBirthDate() {
  const date = new Date();
  date.setFullYear(date.getFullYear() - KYC_MIN_AGE);
  return date.toISOString().slice(0, 10);
}

export function validateKycInput(input: KycValidationInput): string | null {
  const values = normalizeKycInput(input);

  if (!NAME_RE.test(values.legalName) || values.legalName.split(/\s+/).length < 2) {
    return "Entrez votre vrai nom et prénom, sans chiffres ni symboles.";
  }

  const dob = new Date(values.dateOfBirth);
  if (Number.isNaN(dob.getTime()) || dob.getTime() > Date.now()) {
    return "Date de naissance invalide.";
  }

  const age = (Date.now() - dob.getTime()) / (365.25 * 24 * 60 * 60 * 1000);
  if (age < KYC_MIN_AGE) {
    return "Vous devez être majeur pour publier des services.";
  }
  if (age > KYC_MAX_AGE) {
    return "Date de naissance trop ancienne. Vérifiez votre saisie.";
  }

  const phoneDigits = values.phone.replace(/\D/g, "");
  if (!PHONE_RE.test(values.phone) || phoneDigits.length < 6 || phoneDigits.length > 15) {
    return "Numéro de téléphone invalide.";
  }

  if (!CITY_RE.test(values.city)) {
    return "Ville invalide.";
  }

  const experience = Number(values.experienceYears);
  if (!Number.isInteger(experience) || experience < 0 || experience > 80) {
    return "Années d'expérience invalides.";
  }

  if (values.bio.length < KYC_MIN_BIO_LENGTH) {
    return `La présentation doit contenir au moins ${KYC_MIN_BIO_LENGTH} caractères.`;
  }

  if (!AREA_RE.test(values.serviceAreas)) {
    return "Zones d'intervention invalides.";
  }

  return null;
}
