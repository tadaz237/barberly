import { cookies } from "next/headers";
import type { Gender } from "@/src/lib/users-store";

const COOKIE = "barberly_gender";

export async function getGender(): Promise<Gender | null> {
  const store = await cookies();
  const value = store.get(COOKIE)?.value;
  return value === "male" || value === "female" ? value : null;
}

export async function setGenderCookie(gender: Gender) {
  const store = await cookies();
  store.set(COOKIE, gender, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });
}

export async function clearGenderCookie() {
  const store = await cookies();
  store.delete(COOKIE);
}
