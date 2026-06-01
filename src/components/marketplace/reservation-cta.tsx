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
  ownerGender,
  serviceCategory,
  viewer,
}: Props) {
  const [open, setOpen] = useState(false);
  const tone = MARKETPLACE_TONES[
    getMarketplaceToneKey(ownerGender, serviceCategory)
  ];

  return (
    <>
      <button
        type="button"
        onClick={() => {
          if (!isOwnService) setOpen(true);
        }}
        disabled={isOwnService}
        className={cn(
          "inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl text-sm font-semibold shadow-lg transition-colors",
          isOwnService
            ? "cursor-not-allowed bg-white/10 text-white/45 shadow-none"
            : tone.solidButton,
        )}
      >
        <CalendarCheck className="size-4" />
        {isOwnService ? "Votre propre prestation" : "Demander une réservation"}
      </button>
      {isOwnService ? (
        <p className="mt-2 text-center text-xs text-white/45">
          Vous ne pouvez pas réserver une prestation que vous avez publiée.
        </p>
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
