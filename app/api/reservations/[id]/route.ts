import { NextResponse } from "next/server";
import { auth } from "@/src/lib/auth";
import {
  getReservationStatusNotificationTarget,
  updateReservationStatus,
  type ReservationStatus,
} from "@/src/lib/reservations-store";
import { sendBrowserPushToUser } from "@/src/lib/push-notifications";
import { getUserById } from "@/src/lib/users-store";

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

  const notificationTarget = await getReservationStatusNotificationTarget(
    id,
    session.user.id,
  );

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

  if (
    body.status === "confirmed" &&
    notificationTarget &&
    notificationTarget?.previousStatus !== "confirmed"
  ) {
    const clientUser = notificationTarget.clientId
      ? await getUserById(notificationTarget.clientId)
      : null;
    await sendBrowserPushToUser(notificationTarget?.clientId, {
      title: "Reservation acceptee",
      body: `Votre reservation pour ${updated.serviceName} a ete acceptee.`,
      url: clientUser?.role === "client" ? "/client" : "/admin/reservations",
      tag: `reservation-${updated.id}`,
    });
  }

  return NextResponse.json({ reservation: updated });
}
