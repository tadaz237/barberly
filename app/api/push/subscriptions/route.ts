import { NextResponse } from "next/server";
import { auth } from "@/src/lib/auth";
import {
  deleteBrowserPushSubscription,
  isBrowserPushConfigured,
  saveBrowserPushSubscription,
} from "@/src/lib/push-notifications";

type SubscriptionPayload = {
  subscription?: unknown;
  endpoint?: unknown;
};

export const runtime = "nodejs";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ message: "Non authentifie." }, { status: 401 });
  }

  return NextResponse.json(
    { configured: isBrowserPushConfigured() },
    { headers: { "Cache-Control": "no-store" } },
  );
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ message: "Non authentifie." }, { status: 401 });
  }

  if (!isBrowserPushConfigured()) {
    return NextResponse.json(
      { message: "Les notifications navigateur ne sont pas configurees." },
      { status: 503 },
    );
  }

  let body: SubscriptionPayload;
  try {
    body = (await request.json()) as SubscriptionPayload;
  } catch {
    return NextResponse.json({ message: "Requete invalide." }, { status: 400 });
  }

  const saved = await saveBrowserPushSubscription({
    userId: session.user.id,
    subscription:
      body.subscription &&
      typeof body.subscription === "object" &&
      !Array.isArray(body.subscription)
        ? body.subscription
        : {},
    userAgent: request.headers.get("user-agent"),
  });

  if (!saved) {
    return NextResponse.json(
      { message: "Abonnement notification invalide." },
      { status: 400 },
    );
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ message: "Non authentifie." }, { status: 401 });
  }

  let body: SubscriptionPayload;
  try {
    body = (await request.json()) as SubscriptionPayload;
  } catch {
    return NextResponse.json({ message: "Requete invalide." }, { status: 400 });
  }

  await deleteBrowserPushSubscription({
    userId: session.user.id,
    endpoint: body.endpoint,
  });

  return NextResponse.json({ ok: true });
}
