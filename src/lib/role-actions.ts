"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { isUserRole, USER_ROLE_COOKIE } from "@/src/lib/user-role";

const ONE_YEAR = 60 * 60 * 24 * 365;

export async function selectRole(formData: FormData) {
  const role = formData.get("role");
  if (!isUserRole(role)) return;

  const store = await cookies();
  store.set(USER_ROLE_COOKIE, role, {
    path: "/",
    maxAge: ONE_YEAR,
    sameSite: "lax",
  });

  redirect(role === "client" ? "/marketplace" : "/join");
}
