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
      className="h-9 shrink-0 gap-2 rounded-full border-white/15 bg-white/5 text-white/75 hover:bg-white/10 hover:text-white"
    >
      <LogOut className="size-4" />
      <span className="hidden sm:inline">Déconnexion</span>
    </Button>
  );
}
