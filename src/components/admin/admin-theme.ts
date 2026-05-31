import {
  MARKETPLACE_TONES,
  getMarketplaceToneKey,
  type MarketplaceGender,
  type MarketplaceToneKey,
} from "@/src/components/marketplace/marketplace-theme";

export type AdminToneKey = MarketplaceToneKey;

export function getAdminToneKey(gender?: MarketplaceGender) {
  return getMarketplaceToneKey(gender);
}

export const ADMIN_TONES = {
  female: {
    ...MARKETPLACE_TONES.female,
    label: "coiffeuse",
    topGlow: "from-pink-400/10 via-fuchsia-500/5 to-transparent",
    pageBlob: "bg-pink-400/10",
    heroCard:
      "border-pink-400/20 bg-linear-to-br from-pink-400/10 via-white/5 to-white/[0.025]",
    eyebrow:
      "border-pink-400/25 bg-pink-400/10 text-pink-200 shadow-pink-500/10",
    planCard:
      "border-pink-300/25 bg-linear-to-br from-pink-300/15 via-white/5 to-white/[0.025] shadow-[0_18px_55px_-35px_rgba(244,114,182,0.75)]",
    planText: "text-pink-200",
    planIcon: "text-pink-300",
    planButton:
      "bg-pink-300 text-pink-950 shadow-pink-500/20 hover:bg-pink-200",
    profileButton:
      "border-pink-300/30 bg-pink-300/10 text-pink-100 hover:bg-pink-300/20",
    avatarIcon: "text-pink-200/65",
  },
  male: {
    ...MARKETPLACE_TONES.male,
    label: "coiffeur",
    topGlow: "from-amber-400/10 via-yellow-500/5 to-transparent",
    pageBlob: "bg-amber-400/10",
    heroCard:
      "border-amber-400/20 bg-linear-to-br from-amber-400/10 via-white/5 to-white/[0.025]",
    eyebrow:
      "border-amber-400/25 bg-amber-400/10 text-amber-200 shadow-amber-500/10",
    planCard:
      "border-amber-300/25 bg-linear-to-br from-amber-300/15 via-white/5 to-white/[0.025] shadow-[0_18px_55px_-35px_rgba(251,191,36,0.75)]",
    planText: "text-amber-200",
    planIcon: "text-amber-300",
    planButton:
      "bg-amber-300 text-amber-950 shadow-amber-500/20 hover:bg-amber-200",
    profileButton:
      "border-amber-300/30 bg-amber-300/10 text-amber-100 hover:bg-amber-300/20",
    avatarIcon: "text-amber-200/65",
  },
} as const;

export type AdminTone = (typeof ADMIN_TONES)[AdminToneKey];
