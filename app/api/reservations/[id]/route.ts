import { NextResponse } from "next/server";
import { auth } from "@/src/lib/auth";
import {
  updateReservationStatus,
  type ReservationStatus,
} from "@/src/lib/reservations-store";

const ALLOWED: ReservationStatus[] = [
  "pending",
  "confirmed",
  "cancelled",
  "completed",
];

type IncomingPayload = { status?: unknown };

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ message: "Non authentifié." }, { status: 401 });
  }

  const { id } = await params;

  let body: IncomingPayload;
  try {
    body = (await request.json()) as IncomingPayload;
  } catch {
    return NextResponse.json({ message: "Requête invalide." }, { status: 400 });
  }

  if (typeof body.status !== "string" || !ALLOWED.includes(body.status as ReservationStatus)) {
    return NextResponse.json({ message: "Statut invalide." }, { status: 400 });
  }

  const updated = await updateReservationStatus(
    id,
    session.user.id,
    body.status as ReservationStatus,
  );
  if (!updated) {
    return NextResponse.json(
      { message: "Réservation introuvable ou non autorisée." },
      { status: 404 },
    );
  }

  return NextResponse.json({ reservation: updated });
}
