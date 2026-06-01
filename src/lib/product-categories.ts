export type ProductAudience = "female" | "male";

export type ProductCategoryOption = {
  key: string;
  label: string;
  audience: ProductAudience;
  serviceKeywords: string[];
  relationLabel: string;
};

export const PRODUCT_CATEGORY_OPTIONS = [
  {
    key: "meches",
    label: "Meches",
    audience: "female",
    serviceKeywords: ["tresse", "tresses", "vanille", "boheme", "natte"],
    relationLabel: "meches disponibles",
  },
  {
    key: "extensions",
    label: "Extensions",
    audience: "female",
    serviceKeywords: ["extension", "extensions", "tissage", "pose"],
    relationLabel: "extensions en option",
  },
  {
    key: "lace-frontale",
    label: "Lace frontale",
    audience: "female",
    serviceKeywords: ["lace", "frontale", "perruque", "pose"],
    relationLabel: "lace en option",
  },
  {
    key: "perruques",
    label: "Perruques",
    audience: "female",
    serviceKeywords: ["perruque", "wig", "lace"],
    relationLabel: "perruques disponibles",
  },
  {
    key: "greffes",
    label: "Greffes",
    audience: "female",
    serviceKeywords: ["greffe", "extensions", "tissage"],
    relationLabel: "greffes disponibles",
  },
  {
    key: "soins-cheveux-femme",
    label: "Soins cheveux",
    audience: "female",
    serviceKeywords: ["soin", "lissage", "brushing", "coloration"],
    relationLabel: "soins adaptes",
  },
  {
    key: "accessoires-femme",
    label: "Accessoires cheveux",
    audience: "female",
    serviceKeywords: ["accessoire", "coiffure", "evenement"],
    relationLabel: "accessoires disponibles",
  },
  {
    key: "soins-barbe",
    label: "Soins barbe",
    audience: "male",
    serviceKeywords: ["barbe", "barbier", "rasage"],
    relationLabel: "soin barbe disponible",
  },
  {
    key: "soins-cheveux-homme",
    label: "Soins cheveux homme",
    audience: "male",
    serviceKeywords: ["coupe", "degrade", "tonte", "coiffure"],
    relationLabel: "soin cheveux disponible",
  },
  {
    key: "cire-pommade",
    label: "Cires & pommades",
    audience: "male",
    serviceKeywords: ["coupe", "degrade", "coiffage"],
    relationLabel: "cire ou pommade en option",
  },
  {
    key: "rasage",
    label: "Rasage",
    audience: "male",
    serviceKeywords: ["rasage", "barbe", "barbier"],
    relationLabel: "produit de rasage disponible",
  },
  {
    key: "shampoing-homme",
    label: "Shampoings homme",
    audience: "male",
    serviceKeywords: ["soin", "shampoing", "coupe"],
    relationLabel: "shampoing adapte",
  },
  {
    key: "accessoires-barbe",
    label: "Accessoires barbe",
    audience: "male",
    serviceKeywords: ["barbe", "rasage", "barbier"],
    relationLabel: "accessoires barbe disponibles",
  },
] as const satisfies readonly ProductCategoryOption[];

export function getProductCategoryOptions(
  audience: ProductAudience | null | undefined,
) {
  if (!audience) return [];
  return PRODUCT_CATEGORY_OPTIONS.filter((option) => option.audience === audience);
}

export function getProductCategoryByKey(category: string) {
  return PRODUCT_CATEGORY_OPTIONS.find((option) => option.key === category);
}

export function getProductCategoryLabel(category: string) {
  return getProductCategoryByKey(category)?.label ?? category;
}

export function getProductCategoryKeywords(category: string) {
  return getProductCategoryByKey(category)?.serviceKeywords ?? [];
}

export function getProductRelationLabel(category: string) {
  return getProductCategoryByKey(category)?.relationLabel ?? "disponible";
}

export function isProductCategoryAllowedForAudience(
  category: string,
  audience: ProductAudience | null | undefined,
) {
  return getProductCategoryOptions(audience).some(
    (option) => option.key === category,
  );
}
