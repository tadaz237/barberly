import { NextResponse } from "next/server";
import { auth } from "@/src/lib/auth";
import { listConversationsForUser } from "@/src/lib/conversations-store";

export const runtime = "nodejs";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ message: "Non authentifié." }, { status: 401 });
  }

  return NextResponse.json({
    conversations: await listConversationsForUser(session.user.id),
  });
}
