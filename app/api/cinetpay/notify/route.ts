import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json({ ok: true, payment: "disabled" });
}

export async function POST() {
  return NextResponse.json({
    ok: true,
    payment: "disabled",
    message: "Paiement bientôt disponible. Aucun forfait n'a été activé.",
  });
}
