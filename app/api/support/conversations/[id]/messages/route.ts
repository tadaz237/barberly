import { NextResponse } from "next/server";
import { auth } from "@/src/lib/auth";
import { sendBrowserPushToUser } from "@/src/lib/push-notifications";
import { sendAdminSupportReply } from "@/src/lib/support-store";
import {
  getUserById,
  isAccountActive,
  isPlatformAdmin,
} from "@/src/lib/users-store";

type IncomingPayload = {
  body?: unknown;
};

export const runtime = "nodejs";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ message: "Non authentifié." }, { status: 401 });
  }
  const admin = await getUserById(session.user.id);
  if (!isAccountActive(admin) || !isPlatformAdmin(session.user.email)) {
    return NextResponse.json({ message: "Accès refusé." }, { status: 403 });
  }

  let payload: IncomingPayload;
  try {
    payload = (await request.json()) as IncomingPayload;
  } catch {
    return NextResponse.json({ message: "Requête invalide." }, { status: 400 });
  }

  if (typeof payload.body !== "string" || payload.body.trim().length < 1) {
    return NextResponse.json({ message: "Message vide." }, { status: 400 });
  }

  if (payload.body.trim().length > 1000) {
    return NextResponse.json({ message: "Message trop long." }, { status: 400 });
  }

  const { id } = await params;
  const conversation = await sendAdminSupportReply({
    conversationId: id,
    adminId: session.user.id,
    body: payload.body,
  });

  if (!conversation) {
    return NextResponse.json(
      { message: "Conversation introuvable." },
      { status: 404 },
    );
  }

  await sendBrowserPushToUser(conversation.userId, {
    title: "Réponse du support Barberly",
    body: payload.body.toString().trim(),
    url: "/support",
    tag: `support-${conversation.id}`,
  });

  return NextResponse.json(
    { conversation, message: "Réponse envoyée." },
    { headers: { "Cache-Control": "no-store" } },
  );
}
