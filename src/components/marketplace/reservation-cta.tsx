"use client";

import { useState } from "react";
import { CalendarCheck } from "lucide-react";
import { ReservationModal } from "@/src/components/marketplace/reservation-modal";
import {
  MARKETPLACE_TONES,
  getMarketplaceToneKey,
  type MarketplaceGender,
} from "@/src/components/marketplace/marketplace-theme";
import { cn } from "@/src/lib/utils";

type Props = {
  serviceId: string;
  serviceName: string;
  servicePrice: number;
  serviceDurationMin: number;
  isOwnService?: boolean;
  hasActiveReservation?: boolean;
  ownerGender?: MarketplaceGender;
  serviceCategory?: string;
  viewer?: {
    name: string;
    email: string;
    phone?: string;
  } | null;
};

export function ReservationCta({
  serviceId,
  serviceName,
  servicePrice,
  serviceDurationMin,
  isOwnService = false,
  hasActiveReservation = false,
  ownerGender,
  serviceCategory,
  viewer,
}: Props) {
  const [open, setOpen] = useState(false);
  const tone = MARKETPLACE_TONES[
    getMarketplaceToneKey(ownerGender, serviceCategory)
  ];
  const disabledReason = isOwnService
    ? "Vous ne pouvez pas réserver une prestation que vous avez publiée."
    : hasActiveReservation
      ? "Vous avez déjà une demande en cours pour cette prestation."
      : "";
  const disabled = Boolean(disabledReason);
  const buttonLabel = isOwnService
    ? "Votre propre prestation"
    : hasActiveReservation
      ? "Demande déjà envoyée"
      : "Demander une réservation";

  return (
    <>
      <button
        type="button"
        onClick={() => {
          if (!disabled) setOpen(true);
        }}
        disabled={disabled}
        className={cn(
          "inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl text-sm font-semibold shadow-lg transition-colors",
          disabled
            ? "cursor-not-allowed bg-white/10 text-white/45 shadow-none"
            : tone.solidButton,
        )}
      >
        <CalendarCheck className="size-4" />
        {buttonLabel}
      </button>
      {disabledReason ? (
        <p className="mt-2 text-center text-xs text-white/45">{disabledReason}</p>
      ) : null}
      <ReservationModal
        open={open}
        onClose={() => setOpen(false)}
        serviceId={serviceId}
        serviceName={serviceName}
        servicePrice={servicePrice}
        serviceDurationMin={serviceDurationMin}
        ownerGender={ownerGender}
        serviceCategory={serviceCategory}
        viewer={viewer}
      />
    </>
  );
}
