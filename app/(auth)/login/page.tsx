import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthFormCard } from "@/src/components/auth/auth-form-card";
import { auth } from "@/src/lib/auth";

export const metadata: Metadata = {
  title: "Connexion",
  description: "Accédez à votre espace Barberly.",
};

const SAFE_REDIRECT_RE = /^\/[a-zA-Z0-9_\-/?=&%.]*$/;

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  const { callbackUrl } = await searchParams;
  const safeCallback =
    callbackUrl && SAFE_REDIRECT_RE.test(callbackUrl) ? callbackUrl : null;
  const session = await auth();

  if (session?.user?.id) {
    redirect(safeCallback ?? "/admin");
  }

  return (
    <AuthFormCard
      mode="login"
      redirectTo={safeCallback ?? "/admin"}
      badge="Connexion"
      title="Retrouvez votre espace Barberly."
      description="Vos réservations, vos prestations et votre vitrine restent au même endroit : connectez-vous pour reprendre simplement."
      submitLabel="Se connecter"
      switchText="Pas encore de compte ?"
      switchLabel="Créer un compte"
      switchHref="/register"
      fields={[
        {
          id: "email",
          label: "Adresse e-mail",
          type: "email",
          placeholder: "vous@exemple.com",
          autoComplete: "email",
          icon: "mail",
        },
        {
          id: "password",
          label: "Mot de passe",
          type: "password",
          placeholder: "Votre mot de passe",
          autoComplete: "current-password",
          icon: "lock",
        },
      ]}
    />
  );
}
