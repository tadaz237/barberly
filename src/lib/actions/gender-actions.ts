"use server";

import { redirect } from "next/navigation";
import { setGenderCookie } from "@/src/lib/gender";
import type { Gender } from "@/src/lib/users-store";

export async function selectGender(formData: FormData) {
  const raw = formData.get("gender");
  if (raw !== "male" && raw !== "female") {
    throw new Error("Choix invalide.");
  }
  await setGenderCookie(raw as Gender);
  redirect("/login");
}
