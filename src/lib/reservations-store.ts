import type { Reservation, ReservationStatus } from "@prisma/client";
import { prisma } from "@/src/lib/prisma";

export type { ReservationStatus };

export const BUSINESS_HOURS = {
  startHour: 9,
  endHour: 19,
  stepMinutes: 30,
};

export type ReservationItem = {
  id: string;
  serviceId: string;
  serviceName: string;
  servicePrice: number;
  coiffeurId: string | null;
  clientId: string | null;
  clientName: string;
  clientEmail?: string;
  clientAddress: string;
  clientPhone: string;
  scheduledAt: string;
  durationMin: number;
  status: ReservationStatus;
  notes?: string;
  review?: {
    id: string;
    rating: number;
    comment?: string;
    createdAt: string;
  };
  conversationId?: string;
  createdAt: string;
};

export type CreateReservationInput = {
  serviceId: string;
  clientId: string;
  clientEmail: string;
  scheduledAt: Date;
  clientName: string;
  clientAddress: string;
  clientPhone: string;
  notes?: string;
};

function toItem(
  reservation: Reservation & {
    service: { name: string; price: number };
    review?: {
      id: string;
      rating: number;
      comment: string | null;
      createdAt: Date;
    } | null;
    conversation?: { id: string } | null;
  },
): ReservationItem {
  return {
    id: reservation.id,
    serviceId: reservation.serviceId,
    serviceName: reservation.service.name,
    servicePrice: reservation.service.price,
    coiffeurId: reservation.coiffeurId,
    clientId: reservation.clientId,
    clientName: reservation.clientName,
    clientEmail: reservation.clientEmail ?? undefined,
    clientAddress: reservation.clientAddress,
    clientPhone: reservation.clientPhone,
    scheduledAt: reservation.scheduledAt.toISOString(),
    durationMin: reservation.durationMin,
    status: reservation.status,
    notes: reservation.notes ?? undefined,
    review: reservation.review
      ? {
          id: reservation.review.id,
          rating: reservation.review.rating,
          comment: reservation.review.comment ?? undefined,
          createdAt: reservation.review.createdAt.toISOString(),
        }
      : undefined,
    conversationId: reservation.conversation?.id,
    createdAt: reservation.createdAt.toISOString(),
  };
}

function overlaps(
  startA: Date,
  durationA: number,
  startB: Date,
  durationB: number,
): boolean {
  const endA = new Date(startA.getTime() + durationA * 60_000);
  const endB = new Date(startB.getTime() + durationB * 60_000);
  return startA < endB && startB < endA;
}

export async function getAvailableSlots(
  serviceId: string,
  dayISO: string,
): Promise<string[]> {
  const service = await prisma.service.findUnique({
    where: { id: serviceId },
    select: { id: true, ownerId: true, duration: true },
  });
  if (!service) return [];

  const day = new Date(dayISO);
  const dayStart = new Date(day);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(dayStart);
  dayEnd.setDate(dayEnd.getDate() + 1);

  const blockers = service.ownerId
    ? await prisma.reservation.findMany({
        where: {
          coiffeurId: service.ownerId,
          status: { in: ["pending", "confirmed"] },
          scheduledAt: { gte: dayStart, lt: dayEnd },
        },
        select: { scheduledAt: true, durationMin: true },
      })
    : [];

  const now = new Date();
  const slots: string[] = [];
  for (let h = BUSINESS_HOURS.startHour; h < BUSINESS_HOURS.endHour; h++) {
    for (let m = 0; m < 60; m += BUSINESS_HOURS.stepMinutes) {
      const slotStart = new Date(dayStart);
      slotStart.setHours(h, m, 0, 0);

      const slotEnd = new Date(
        slotStart.getTime() + service.duration * 60_000,
      );
      const slotEndsAfterHours =
        slotEnd.getHours() > BUSINESS_HOURS.endHour ||
        (slotEnd.getHours() === BUSINESS_HOURS.endHour &&
          slotEnd.getMinutes() > 0) ||
        slotEnd.getDate() !== slotStart.getDate();
      if (slotEndsAfterHours) continue;

      if (slotStart.getTime() <= now.getTime()) continue;

      const conflict = blockers.some((r) =>
        overlaps(slotStart, service.duration, r.scheduledAt, r.durationMin),
      );
      if (conflict) continue;

      slots.push(slotStart.toISOString());
    }
  }
  return slots;
}

export async function createReservation(
  input: CreateReservationInput,
): Promise<
  | { reservation: ReservationItem }
  | { error: "service_not_found" | "slot_taken" | "slot_invalid" | "own_service" }
> {
  const service = await prisma.service.findUnique({
    where: { id: input.serviceId },
    select: { id: true, ownerId: true, duration: true },
  });
  if (!service) return { error: "service_not_found" };
  if (service.ownerId === input.clientId) return { error: "own_service" };

  const start = input.scheduledAt;
  const startHour = start.getHours();
  if (
    startHour < BUSINESS_HOURS.startHour ||
    startHour >= BUSINESS_HOURS.endHour ||
    start.getTime() <= Date.now()
  ) {
    return { error: "slot_invalid" };
  }

  if (service.ownerId) {
    const dayStart = new Date(start);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(dayStart);
    dayEnd.setDate(dayEnd.getDate() + 1);

    const blockers = await prisma.reservation.findMany({
      where: {
        coiffeurId: service.ownerId,
        status: { in: ["pending", "confirmed"] },
        scheduledAt: { gte: dayStart, lt: dayEnd },
      },
      select: { scheduledAt: true, durationMin: true },
    });
    const conflict = blockers.some((r) =>
      overlaps(start, service.duration, r.scheduledAt, r.durationMin),
    );
    if (conflict) return { error: "slot_taken" };
  }

  const reservation = await prisma.reservation.create({
    data: {
      serviceId: service.id,
      coiffeurId: service.ownerId,
      clientId: input.clientId,
      clientEmail: input.clientEmail.trim().toLowerCase(),
      clientName: input.clientName.trim(),
      clientAddress: input.clientAddress.trim(),
      clientPhone: input.clientPhone.trim(),
      scheduledAt: start,
      durationMin: service.duration,
      notes: input.notes?.trim() || null,
      status: "pending",
    },
    include: {
      service: { select: { name: true, price: true } },
      review: {
        select: { id: true, rating: true, comment: true, createdAt: true },
      },
      conversation: { select: { id: true } },
    },
  });

  if (service.ownerId) {
    await prisma.conversation.upsert({
      where: { reservationId: reservation.id },
      create: {
        reservationId: reservation.id,
        providerId: service.ownerId,
        clientId: input.clientId,
      },
      update: {},
    });
  }

  const withConversation = await prisma.reservation.findUnique({
    where: { id: reservation.id },
    include: {
      service: { select: { name: true, price: true } },
      review: {
        select: { id: true, rating: true, comment: true, createdAt: true },
      },
      conversation: { select: { id: true } },
    },
  });

  return { reservation: toItem(withConversation ?? reservation) };
}

export async function getReservationsForCoiffeur(
  coiffeurId: string,
): Promise<ReservationItem[]> {
  const reservations = await prisma.reservation.findMany({
    where: { coiffeurId },
    orderBy: { scheduledAt: "asc" },
    include: {
      service: { select: { name: true, price: true } },
      review: {
        select: { id: true, rating: true, comment: true, createdAt: true },
      },
      conversation: { select: { id: true } },
    },
  });
  return reservations.map(toItem);
}

export async function getReservationsForClient(
  clientId: string,
): Promise<ReservationItem[]> {
  const reservations = await prisma.reservation.findMany({
    where: { clientId },
    orderBy: { scheduledAt: "desc" },
    include: {
      service: { select: { name: true, price: true } },
      review: {
        select: { id: true, rating: true, comment: true, createdAt: true },
      },
      conversation: { select: { id: true } },
    },
  });
  return reservations.map(toItem);
}

export async function updateReservationStatus(
  reservationId: string,
  coiffeurId: string,
  status: ReservationStatus,
): Promise<ReservationItem | null> {
  const existing = await prisma.reservation.findUnique({
    where: { id: reservationId },
    select: { id: true, coiffeurId: true },
  });
  if (!existing || existing.coiffeurId !== coiffeurId) return null;

  const updated = await prisma.reservation.update({
    where: { id: reservationId },
    data: { status },
    include: {
      service: { select: { name: true, price: true } },
      review: {
        select: { id: true, rating: true, comment: true, createdAt: true },
      },
      conversation: { select: { id: true } },
    },
  });
  return toItem(updated);
}

export async function getReservationStatusNotificationTarget(
  reservationId: string,
  coiffeurId: string,
): Promise<{
  clientId: string | null;
  serviceName: string;
  previousStatus: ReservationStatus;
} | null> {
  const reservation = await prisma.reservation.findUnique({
    where: { id: reservationId },
    select: {
      coiffeurId: true,
      clientId: true,
      status: true,
      service: { select: { name: true } },
    },
  });

  if (!reservation || reservation.coiffeurId !== coiffeurId) return null;

  return {
    clientId: reservation.clientId,
    serviceName: reservation.service.name,
    previousStatus: reservation.status,
  };
}
