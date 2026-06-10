import { NextResponse } from "next/server";
import { auth } from "@/src/lib/auth";
import { markConversationReadForUser } from "@/src/lib/conversations-store";
import { getUserById, isAccountActive } from "@/src/lib/users-store";

export const runtime = "nodejs";

export async function PATCH(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ message: "Non authentifié." }, { status: 401 });
  }

  const user = await getUserById(session.user.id);
  if (!isAccountActive(user)) {
    return NextResponse.json({ message: "Compte bloque." }, { status: 403 });
  }

  const { id } = await params;
  const conversation = await markConversationReadForUser(id, session.user.id);
  if (!conversation) {
    return NextResponse.json(
      { message: "Conversation introuvable." },
      { status: 404 },
    );
  }

  return NextResponse.json(
    { conversation },
    { headers: { "Cache-Control": "no-store" } },
  );
}
