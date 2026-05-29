"use client";

import { useState } from "react";
import { CalendarCheck } from "lucide-react";
import { ReservationModal } from "@/src/components/marketplace/reservation-modal";

type Props = {
  serviceId: string;
  serviceName: string;
  servicePrice: number;
  serviceDurationMin: number;
};

export function ReservationCta({
  serviceId,
  serviceName,
  servicePrice,
  serviceDurationMin,
}: Props) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-pink-400 text-sm font-semibold text-zinc-950 shadow-lg shadow-pink-500/30 transition-colors hover:bg-pink-300"
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
      />
    </>
  );
}
