export type MarketplaceGender = "male" | "female" | null | undefined;
export type MarketplaceToneKey = "female" | "male";

function normalizeLabel(value: string) {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

const MALE_CATEGORY_HINTS = ["homme", "barbier", "barbe", "degrade", "rasage", "tonte"];

export function getMarketplaceToneKey(
  gender?: MarketplaceGender,
  category = "",
): MarketplaceToneKey {
  if (gender === "male") return "male";
  if (gender === "female") return "female";

  const normalizedCategory = normalizeLabel(category);
  if (MALE_CATEGORY_HINTS.some((hint) => normalizedCategory.includes(hint))) {
    return "male";
  }

  return "female";
}

export function getMarketplaceRoleLabel(tone: MarketplaceToneKey) {
  return tone === "male" ? "coiffeur" : "coiffeuse";
}

export function getMarketplaceRoleTitle(tone: MarketplaceToneKey) {
  return tone === "male" ? "Le coiffeur" : "La coiffeuse";
}

export const MARKETPLACE_TONES = {
  female: {
    text: "text-pink-200",
    textSoft: "text-pink-200/70",
    icon: "text-pink-300/80",
    iconSoft: "text-pink-200/70",
    linkHover: "hover:text-pink-200",
    cardHover:
      "hover:border-pink-400/30 hover:shadow-[0_24px_60px_-12px_rgba(244,114,182,0.25),inset_0_1px_0_rgba(255,255,255,0.1)]",
    mediaBg: "from-pink-400/20 via-fuchsia-500/10 to-purple-600/5",
    detailMediaBg: "from-pink-400/15 via-fuchsia-500/10 to-purple-600/10",
    placeholderIcon:
      "text-pink-200/40 drop-shadow-[0_0_12px_rgba(244,114,182,0.4)]",
    placeholderIconSoft: "text-pink-200/30",
    solidButton:
      "bg-pink-400 text-zinc-950 shadow-pink-500/30 hover:bg-pink-300",
    cardButtonHover: "group-hover/card:bg-pink-300",
    softButton:
      "border-pink-400/30 bg-pink-400/10 text-pink-200 hover:bg-pink-400/20",
    softPanel: "border-pink-400/20 bg-pink-400/5",
    chip: "bg-pink-400/15 text-pink-200",
    avatar: "border-pink-400/30 bg-pink-400/10",
    focus: "focus:border-pink-400/50 focus:ring-pink-400/20",
    focusSoft: "focus:border-pink-400/40 focus:ring-pink-400/20",
    stepDone: "bg-pink-400 text-zinc-950",
    stepActive: "bg-pink-400/20 text-pink-200 ring-2 ring-pink-400/50",
    daySelected: "bg-pink-400 text-zinc-950 shadow-lg shadow-pink-500/40",
    dayIdle: "bg-white/5 text-white/85 hover:bg-pink-400/15 hover:text-pink-100",
    slotActive: "border-pink-400 bg-pink-400/20 text-pink-100",
    slotIdle:
      "border-white/10 bg-white/5 text-white/75 hover:border-pink-400/40 hover:text-pink-200",
  },
  male: {
    text: "text-amber-200",
    textSoft: "text-amber-200/75",
    icon: "text-amber-300/85",
    iconSoft: "text-amber-200/75",
    linkHover: "hover:text-amber-200",
    cardHover:
      "hover:border-amber-400/35 hover:shadow-[0_24px_60px_-12px_rgba(251,191,36,0.25),inset_0_1px_0_rgba(255,255,255,0.1)]",
    mediaBg: "from-amber-400/20 via-yellow-500/10 to-zinc-950/5",
    detailMediaBg: "from-amber-400/15 via-yellow-500/10 to-zinc-950/10",
    placeholderIcon:
      "text-amber-200/45 drop-shadow-[0_0_12px_rgba(251,191,36,0.4)]",
    placeholderIconSoft: "text-amber-200/35",
    solidButton:
      "bg-amber-400 text-zinc-950 shadow-amber-500/30 hover:bg-amber-300",
    cardButtonHover: "group-hover/card:bg-amber-300",
    softButton:
      "border-amber-400/30 bg-amber-400/10 text-amber-200 hover:bg-amber-400/20",
    softPanel: "border-amber-400/20 bg-amber-400/5",
    chip: "bg-amber-400/15 text-amber-200",
    avatar: "border-amber-400/30 bg-amber-400/10",
    focus: "focus:border-amber-400/50 focus:ring-amber-400/20",
    focusSoft: "focus:border-amber-400/40 focus:ring-amber-400/20",
    stepDone: "bg-amber-400 text-zinc-950",
    stepActive: "bg-amber-400/20 text-amber-200 ring-2 ring-amber-400/50",
    daySelected: "bg-amber-400 text-zinc-950 shadow-lg shadow-amber-500/40",
    dayIdle: "bg-white/5 text-white/85 hover:bg-amber-400/15 hover:text-amber-100",
    slotActive: "border-amber-400 bg-amber-400/20 text-amber-100",
    slotIdle:
      "border-white/10 bg-white/5 text-white/75 hover:border-amber-400/40 hover:text-amber-200",
  },
} as const;

export type MarketplaceTone = (typeof MARKETPLACE_TONES)[MarketplaceToneKey];
