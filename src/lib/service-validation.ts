export const MIN_SERVICE_DESCRIPTION_LENGTH = 10;
export const MAX_SERVICE_DURATION_MINUTES = 12 * 60;

type ServiceTextInput = {
  name: string;
  category: string;
  city: string;
  neighborhood: string;
  description: string;
};

type ServiceTextValidation =
  | { ok: true; values: ServiceTextInput }
  | { ok: false; message: string };

const SERVICE_LABEL_RE = /^[\p{L}\p{M}\p{N}][\p{L}\p{M}\p{N}\s'’.,/&()+-]{1,79}$/u;

function cleanInlineText(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

function isReasonableLabel(value: string) {
  return SERVICE_LABEL_RE.test(value);
}

export function validateServiceTextFields(
  input: ServiceTextInput,
): ServiceTextValidation {
  const values = {
    name: cleanInlineText(input.name),
    category: cleanInlineText(input.category),
    city: cleanInlineText(input.city),
    neighborhood: cleanInlineText(input.neighborhood),
    description: input.description.trim().replace(/\s+/g, " "),
  };

  if (!isReasonableLabel(values.name)) {
    return { ok: false, message: "Nom de prestation invalide." };
  }

  if (!isReasonableLabel(values.category)) {
    return { ok: false, message: "Catégorie invalide." };
  }

  if (!isReasonableLabel(values.city)) {
    return { ok: false, message: "Ville invalide." };
  }

  if (!isReasonableLabel(values.neighborhood)) {
    return { ok: false, message: "Quartier invalide." };
  }

  if (values.description.length < MIN_SERVICE_DESCRIPTION_LENGTH) {
    return {
      ok: false,
      message: `La description doit contenir au moins ${MIN_SERVICE_DESCRIPTION_LENGTH} caractères.`,
    };
  }

  if (values.description.length > 700) {
    return {
      ok: false,
      message: "La description est trop longue (700 caractères maximum).",
    };
  }

  return { ok: true, values };
}
