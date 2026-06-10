import { NextResponse } from "next/server";
import { auth } from "@/src/lib/auth";
import { sendBrowserPushToUser } from "@/src/lib/push-notifications";
import {
  getSupportConversationForUser,
  sendUserSupportMessage,
} from "@/src/lib/support-store";
import { getPlatformAdminUserIds, getUserById } from "@/src/lib/users-store";

type IncomingPayload = {
  body?: unknown;
};

export const runtime = "nodejs";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ message: "Non authentifié." }, { status: 401 });
  }

  const conversation = await getSupportConversationForUser(session.user.id);

  return NextResponse.json(
    { conversation },
    { headers: { "Cache-Control": "no-store" } },
  );
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ message: "Non authentifié." }, { status: 401 });
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

  const conversation = await sendUserSupportMessage(
    session.user.id,
    payload.body,
  );

  // Notify every super admin so they can answer the support request.
  const sender = await getUserById(session.user.id);
  const adminIds = await getPlatformAdminUserIds();
  await Promise.all(
    adminIds
      .filter((adminId) => adminId !== session.user!.id)
      .map((adminId) =>
        sendBrowserPushToUser(adminId, {
          title: `Support · ${sender?.name ?? "Utilisateur"}`,
          body: payload.body!.toString().trim(),
          url: "/platform/support",
          tag: `support-${conversation.id}`,
        }),
      ),
  );

  return NextResponse.json(
    { conversation, message: "Message envoyé." },
    { headers: { "Cache-Control": "no-store" } },
  );
}
