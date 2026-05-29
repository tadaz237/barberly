import { NextResponse } from "next/server";
import { auth } from "@/src/lib/auth";
import { setUserPlan, type Plan } from "@/src/lib/users-store";

const ALLOWED_PLANS: Plan[] = ["free", "essential", "pro", "premium"];

type IncomingPayload = {
  plan?: unknown;
};

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json(
      { message: "Connectez-vous pour souscrire à un forfait." },
      { status: 401 },
    );
  }

  let body: IncomingPayload;
  try {
    body = (await request.json()) as IncomingPayload;
  } catch {
    return NextResponse.json({ message: "Requête invalide." }, { status: 400 });
  }

  if (typeof body.plan !== "string" || !ALLOWED_PLANS.includes(body.plan as Plan)) {
    return NextResponse.json(
      { message: "Forfait inconnu." },
      { status: 400 },
    );
  }

  const updated = await setUserPlan(session.user.id, body.plan as Plan);
  return NextResponse.json({
    user: updated,
    message: "Forfait mis à jour.",
  });
}
