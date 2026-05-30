import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST() {
  return NextResponse.json(
    {
      message:
        "La souscription payante sera bientôt disponible. Aucun forfait n'a été activé.",
    },
    { status: 503 },
  );
}
