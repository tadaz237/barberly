import { NextResponse } from "next/server";
import { auth } from "@/src/lib/auth";
import { listConversationsForUser } from "@/src/lib/conversations-store";
import { getUserById, isAccountActive } from "@/src/lib/users-store";

export const runtime = "nodejs";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ message: "Non authentifié." }, { status: 401 });
  }

  const user = await getUserById(session.user.id);
  if (!isAccountActive(user)) {
    return NextResponse.json({ message: "Compte bloque." }, { status: 403 });
  }

  return NextResponse.json(
    { conversations: await listConversationsForUser(session.user.id) },
    { headers: { "Cache-Control": "no-store" } },
  );
}
