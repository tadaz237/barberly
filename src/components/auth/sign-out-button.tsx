"use client";

import { signOut } from "next-auth/react";
import { LogOut } from "lucide-react";
import { Button } from "@/src/components/ui/button";

export function SignOutButton() {
  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={() => signOut({ redirectTo: "/" })}
      aria-label="Déconnexion"
      className="shrink-0 gap-2"
    >
      <LogOut className="size-4" />
      <span className="hidden sm:inline">Déconnexion</span>
    </Button>
  );
}
