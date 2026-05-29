import { cookies } from "next/headers";

export type UserRole = "client" | "coiffeur";

export const USER_ROLE_COOKIE = "userRole";

export function isUserRole(value: unknown): value is UserRole {
  return value === "client" || value === "coiffeur";
}

export async function getUserRole(): Promise<UserRole | null> {
  const store = await cookies();
  const raw = store.get(USER_ROLE_COOKIE)?.value;
  return isUserRole(raw) ? raw : null;
}
