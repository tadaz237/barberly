import { NextResponse } from "next/server";
import { auth } from "@/src/lib/auth";
import {
  getSupportConversationForUser,
  markSupportReadForUser,
} from "@/src/lib/support-store";

export const runtime = "nodejs";

export async function PATCH() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ message: "Non authentifié." }, { status: 401 });
  }

  await markSupportReadForUser(session.user.id);
  const conversation = await getSupportConversationForUser(session.user.id);

  return NextResponse.json(
    { conversation },
    { headers: { "Cache-Control": "no-store" } },
  );
}
