import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthFormCard } from "@/src/components/auth/auth-form-card";
import { auth } from "@/src/lib/auth";
import { getUserById } from "@/src/lib/users-store";

export const metadata: Metadata = {
  title: "Connexion client",
  description: "Connectez-vous pour gérer vos réservations Barberly.",
};

const SAFE_REDIRECT_RE = /^\/[a-zA-Z0-9_\-/?=&%.]*$/;

export default async function ClientLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  const { callbackUrl } = await searchParams;
  const safeCallback =
    callbackUrl && SAFE_REDIRECT_RE.test(callbackUrl) ? callbackUrl : null;
  const session = await auth();

  if (session?.user?.id) {
    const user = await getUserById(session.user.id);
    redirect(user?.role === "client" ? safeCallback ?? "/client" : "/admin");
  }

  return (
    <AuthFormCard
      mode="login"
      tone="female"
      redirectTo={safeCallback ?? "/client"}
      badge="Espace client"
      title="Connexion client."
      description="Connectez-vous pour réserver, échanger avec votre coiffeur ou coiffeuse et noter une prestation terminée."
      submitLabel="Me connecter"
      switchText="Pas encore de compte client ?"
      switchLabel="Créer un compte client"
      switchHref="/client-register"
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
