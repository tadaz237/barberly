import { NextResponse } from "next/server";
import { auth } from "@/src/lib/auth";
import { deleteImagesFromCloudinary } from "@/src/lib/cloudinary";
import {
  deleteUserAccount,
  getAccountDeletionSnapshot,
} from "@/src/lib/users-store";

export const runtime = "nodejs";

export async function DELETE() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ message: "Non authentifie." }, { status: 401 });
  }

  const snapshot = await getAccountDeletionSnapshot(session.user.id);
  if (!snapshot) {
    return NextResponse.json({ message: "Compte introuvable." }, { status: 404 });
  }

  try {
    await deleteImagesFromCloudinary(snapshot.imageUrls);
  } catch {
    return NextResponse.json(
      {
        message:
          "Suppression impossible pour le moment. Reessayez avant de retirer le compte.",
      },
      { status: 502 },
    );
  }

  const deleted = await deleteUserAccount(session.user.id);
  if (!deleted) {
    return NextResponse.json({ message: "Compte introuvable." }, { status: 404 });
  }

  return NextResponse.json({ message: "Compte supprime." });
}
