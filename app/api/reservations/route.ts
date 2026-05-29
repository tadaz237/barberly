import { NextResponse } from "next/server";
import { auth } from "@/src/lib/auth";
import {
  createReservation,
  getReservationsForCoiffeur,
} from "@/src/lib/reservations-store";

const PHONE_RE = /^[+]?[\d\s().-]{6,20}$/;

type IncomingPayload = {
  serviceId?: unknown;
  scheduledAt?: unknown;
  clientName?: unknown;
  clientAddress?: unknown;
  clientPhone?: unknown;
  notes?: unknown;
};

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const owner = searchParams.get("owner");

  if (owner === "me") {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Non authentifié." }, { status: 401 });
    }
    return NextResponse.json({
      reservations: await getReservationsForCoiffeur(session.user.id),
    });
  }

  return NextResponse.json(
    { message: "Paramètre 'owner' manquant." },
    { status: 400 },
  );
}

export async function POST(request: Request) {
  let body: IncomingPayload;
  try {
    body = (await request.json()) as IncomingPayload;
  } catch {
    return NextResponse.json({ message: "Requête invalide." }, { status: 400 });
  }

  if (
    !isNonEmptyString(body.serviceId) ||
    !isNonEmptyString(body.scheduledAt) ||
    !isNonEmptyString(body.clientName) ||
    !isNonEmptyString(body.clientAddress) ||
    !isNonEmptyString(body.clientPhone)
  ) {
    return NextResponse.json(
      { message: "Tous les champs obligatoires doivent être remplis." },
      { status: 400 },
    );
  }

  if (!PHONE_RE.test(body.clientPhone.trim())) {
    return NextResponse.json(
      { message: "Numéro de téléphone invalide." },
      { status: 400 },
    );
  }

  const scheduled = new Date(body.scheduledAt);
  if (Number.isNaN(scheduled.getTime())) {
    return NextResponse.json(
      { message: "Date / heure invalide." },
      { status: 400 },
    );
  }

  const result = await createReservation({
    serviceId: body.serviceId,
    scheduledAt: scheduled,
    clientName: body.clientName,
    clientAddress: body.clientAddress,
    clientPhone: body.clientPhone,
    notes:
      typeof body.notes === "string" && body.notes.trim()
        ? body.notes
        : undefined,
  });

  if ("error" in result) {
    if (result.error === "slot_taken") {
      return NextResponse.json(
        { message: "Ce créneau vient d'être pris. Choisissez un autre horaire." },
        { status: 409 },
      );
    }
    if (result.error === "slot_invalid") {
      return NextResponse.json(
        {
          message:
            "Créneau hors plage autorisée (9h – 19h) ou déjà passé.",
        },
        { status: 400 },
      );
    }
    return NextResponse.json(
      { message: "Prestation introuvable." },
      { status: 404 },
    );
  }

  return NextResponse.json(
    {
      reservation: result.reservation,
      message: "Demande de réservation envoyée. Le coiffeur va vous répondre.",
    },
    { status: 201 },
  );
}
