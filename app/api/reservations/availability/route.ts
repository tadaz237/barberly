import { NextResponse } from "next/server";
import { getAvailableSlots } from "@/src/lib/reservations-store";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const serviceId = searchParams.get("service");
  const date = searchParams.get("date");

  if (!serviceId || !date) {
    return NextResponse.json(
      { message: "Paramètres 'service' et 'date' requis." },
      { status: 400 },
    );
  }

  const slots = await getAvailableSlots(serviceId, date);
  return NextResponse.json({ slots });
}
