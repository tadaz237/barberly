import type { Metadata } from "next";
import { AuthFormCard } from "@/src/components/auth/auth-form-card";

export const metadata: Metadata = {
  title: "Inscription",
  description: "Créez un compte pour accéder à la plateforme.",
};

export default function RegisterPage() {
  return (
    <AuthFormCard
      mode="register"
      redirectTo="/login"
      badge="Inscription"
      title="Créer un compte."
      description="Inscrivez-vous pour réserver, gérer vos prestations ou préparer un accès sécurisé à l'administration."
      submitLabel="Créer mon compte"
      switchText="Vous avez déjà un compte ?"
      switchLabel="Se connecter"
      switchHref="/login"
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
