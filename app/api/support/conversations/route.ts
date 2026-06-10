import { NextResponse } from "next/server";
import { auth } from "@/src/lib/auth";
import { listSupportConversationsForAdmin } from "@/src/lib/support-store";
import { isPlatformAdmin } from "@/src/lib/users-store";

export const runtime = "nodejs";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ message: "Non authentifié." }, { status: 401 });
  }
  if (!isPlatformAdmin(session.user.email)) {
    return NextResponse.json({ message: "Accès refusé." }, { status: 403 });
  }

  return NextResponse.json(
    { conversations: await listSupportConversationsForAdmin() },
    { headers: { "Cache-Control": "no-store" } },
  );
}
