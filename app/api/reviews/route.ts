import { NextResponse } from "next/server";
import { auth } from "@/src/lib/auth";
import { createReview } from "@/src/lib/reviews-store";
import { getUserById, isClientUser } from "@/src/lib/users-store";

type IncomingPayload = {
  reservationId?: unknown;
  rating?: unknown;
  comment?: unknown;
};

export const runtime = "nodejs";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json(
      { message: "Connectez-vous comme client pour noter." },
      { status: 401 },
    );
  }

  const user = await getUserById(session.user.id);
  if (!user || !isClientUser(user)) {
    return NextResponse.json(
      { message: "Seuls les comptes clients peuvent publier un avis." },
      { status: 403 },
    );
  }

  let body: IncomingPayload;
  try {
    body = (await request.json()) as IncomingPayload;
  } catch {
    return NextResponse.json({ message: "Requête invalide." }, { status: 400 });
  }

  if (typeof body.reservationId !== "string" || !body.reservationId.trim()) {
    return NextResponse.json(
      { message: "Réservation manquante." },
      { status: 400 },
    );
  }

  const rating = Number(body.rating);
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return NextResponse.json(
      { message: "La note doit être comprise entre 1 et 5." },
      { status: 400 },
    );
  }

  const comment =
    typeof body.comment === "string" && body.comment.trim()
      ? body.comment.trim().slice(0, 700)
      : undefined;

  const result = await createReview({
    clientId: user.id,
    reservationId: body.reservationId,
    rating,
    comment,
  });

  if ("error" in result) {
    const status =
      result.error === "reservation_not_found"
        ? 404
        : result.error === "already_reviewed"
          ? 409
          : 403;
    const message =
      result.error === "reservation_not_found"
        ? "Réservation introuvable."
        : result.error === "not_completed"
          ? "Vous pouvez noter uniquement une prestation terminée."
          : result.error === "already_reviewed"
            ? "Vous avez déjà noté ce professionnel."
            : "Avis impossible pour cette réservation.";

    return NextResponse.json({ message }, { status });
  }

  return NextResponse.json(
    { review: result.review, message: "Avis publié." },
    { status: 201 },
  );
}
