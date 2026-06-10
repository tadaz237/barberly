import { NextResponse } from "next/server";
import { auth } from "@/src/lib/auth";
import {
  getSupportUnreadForAdmin,
  getSupportUnreadForUser,
} from "@/src/lib/support-store";
import { getPlatformAdminUserIds, isPlatformAdmin } from "@/src/lib/users-store";

export const runtime = "nodejs";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ message: "Non authentifié." }, { status: 401 });
  }

  const admin = isPlatformAdmin(session.user.email);
  const unreadTotal = admin
    ? await getSupportUnreadForAdmin(await getPlatformAdminUserIds())
    : await getSupportUnreadForUser(session.user.id);

  return NextResponse.json(
    { unreadTotal, isAdmin: admin },
    { headers: { "Cache-Control": "no-store" } },
  );
}
