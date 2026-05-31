import type { Metadata } from "next";
import { AuthFormCard } from "@/src/components/auth/auth-form-card";

export const metadata: Metadata = {
  title: "Inscription client",
  description: "Créez un compte client Barberly.",
};

const SAFE_REDIRECT_RE = /^\/[a-zA-Z0-9_\-/?=&%.]*$/;

export default async function ClientRegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  const { callbackUrl } = await searchParams;
  const safeCallback =
    callbackUrl && SAFE_REDIRECT_RE.test(callbackUrl) ? callbackUrl : "/client";
  const loginRedirect = `/client-login?callbackUrl=${encodeURIComponent(
    safeCallback,
  )}`;

  return (
    <AuthFormCard
      mode="register"
      accountRole="client"
      tone="female"
      redirectTo={loginRedirect}
      badge="Compte client"
      title="Créer mon compte client."
      description="Un compte client permet de réserver, discuter avec le professionnel et publier un avis vérifié après la prestation."
      submitLabel="Créer mon compte client"
      switchText="Vous avez déjà un compte client ?"
      switchLabel="Se connecter"
      switchHref={loginRedirect}
      fields={[
        {
          id: "name",
          label: "Nom complet",
          type: "text",
          placeholder: "Awa Diallo",
          autoComplete: "name",
          icon: "user",
        },
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
          placeholder: "Minimum 8 caractères",
          autoComplete: "new-password",
          icon: "lock",
        },
        {
          id: "confirmPassword",
          label: "Confirmer le mot de passe",
          type: "password",
          placeholder: "Répétez votre mot de passe",
          autoComplete: "new-password",
          icon: "lock",
        },
      ]}
    />
  );
}
