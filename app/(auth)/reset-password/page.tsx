import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { PasswordResetForm } from "@/src/components/auth/password-reset-form";
import { auth } from "@/src/lib/auth";

export const metadata: Metadata = {
  title: "Réinitialiser le mot de passe",
  description: "Recevez un code pour choisir un nouveau mot de passe.",
};

export default async function ResetPasswordPage() {
  const session = await auth();

  if (session?.user?.id) {
    redirect("/admin");
  }

  return <PasswordResetForm />;
}
