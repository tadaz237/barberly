import { NextResponse } from "next/server";
import { auth } from "@/src/lib/auth";
import {
  getConversationForUser,
  sendConversationMessage,
} from "@/src/lib/conversations-store";

type IncomingPayload = {
  body?: unknown;
};

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ message: "Non authentifié." }, { status: 401 });
  }

  const { id } = await params;
  const conversation = await getConversationForUser(id, session.user.id);
  if (!conversation) {
    return NextResponse.json(
      { message: "Conversation introuvable." },
      { status: 404 },
    );
  }

  return NextResponse.json({ conversation });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ message: "Non authentifié." }, { status: 401 });
  }

  let body: IncomingPayload;
  try {
    body = (await request.json()) as IncomingPayload;
  } catch {
    return NextResponse.json({ message: "Requête invalide." }, { status: 400 });
  }

  if (typeof body.body !== "string" || body.body.trim().length < 1) {
    return NextResponse.json(
      { message: "Message vide." },
      { status: 400 },
    );
  }

  if (body.body.trim().length > 1000) {
    return NextResponse.json(
      { message: "Message trop long." },
      { status: 400 },
    );
  }

  const { id } = await params;
  const conversation = await sendConversationMessage({
    conversationId: id,
    senderId: session.user.id,
    body: body.body,
  });

  if (!conversation) {
    return NextResponse.json(
      { message: "Conversation introuvable." },
      { status: 404 },
    );
  }

  return NextResponse.json({ conversation, message: "Message envoyé." });
}
