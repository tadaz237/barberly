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
  ownerGender?: MarketplaceGender;
  serviceCategory?: string;
  client?: {
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
  ownerGender,
  serviceCategory,
  client,
}: Props) {
  const [open, setOpen] = useState(false);
  const tone = MARKETPLACE_TONES[
    getMarketplaceToneKey(ownerGender, serviceCategory)
  ];

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          "inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl text-sm font-semibold shadow-lg transition-colors",
          tone.solidButton,
        )}
      >
        <CalendarCheck className="size-4" />
        Demander une réservation
      </button>
      <ReservationModal
        open={open}
        onClose={() => setOpen(false)}
        serviceId={serviceId}
        serviceName={serviceName}
        servicePrice={servicePrice}
        serviceDurationMin={serviceDurationMin}
        ownerGender={ownerGender}
        serviceCategory={serviceCategory}
        client={client}
      />
    </>
  );
}
