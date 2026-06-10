import { NextResponse } from "next/server";
import { auth } from "@/src/lib/auth";
import { markSupportReadForAdmin } from "@/src/lib/support-store";
import {
  getUserById,
  isAccountActive,
  isPlatformAdmin,
} from "@/src/lib/users-store";

export const runtime = "nodejs";

export async function PATCH(
  _request: Request,
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

  const { id } = await params;
  const conversation = await markSupportReadForAdmin(id);

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
