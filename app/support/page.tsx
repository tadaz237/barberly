import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, LifeBuoy } from "lucide-react";
import { SupportChat } from "@/src/components/support/support-chat";
import { auth } from "@/src/lib/auth";
import { getSupportConversationForUser } from "@/src/lib/support-store";
import { getUserById } from "@/src/lib/users-store";

export const metadata = {
  title: "Support",
};

export default async function SupportPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login?callbackUrl=/support");
  }

  const user = await getUserById(session.user.id);
  if (!user) redirect("/login?callbackUrl=/support");

  const conversation = await getSupportConversationForUser(user.id);
  const homeHref =
    user.accountStatus === "blocked"
      ? "/account-blocked"
      : user.role === "client"
        ? "/client"
        : "/admin";

  return (
    <main className="relative min-h-screen overflow-hidden bg-black text-white">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.04)_1px,transparent_1px)] bg-size-[56px_56px] opacity-60"
      />
      <section className="relative mx-auto w-full max-w-3xl space-y-6 px-4 py-6 sm:px-6 sm:py-10 lg:px-8 lg:py-12">
        <Link
          href={homeHref}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-white/60 transition-colors hover:text-sky-200 sm:text-sm"
        >
          <ArrowLeft className="size-4" />
          Retour à mon espace
        </Link>
        <header className="space-y-3">
          <span className="inline-flex items-center gap-2 rounded-full border border-sky-400/30 bg-sky-400/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.22em] text-sky-200">
            <LifeBuoy className="size-3.5" />
            Contacter le support
          </span>
          <h1 className="text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
            Une question ? Échangez avec notre équipe
          </h1>
          <p className="max-w-2xl text-sm leading-6 text-white/55">
            Décrivez votre demande (vérification KYC, compte, paiement…). Le super
            admin vous répond directement dans cette conversation.
          </p>
        </header>
        <SupportChat currentUserId={user.id} initialConversation={conversation} />
      </section>
    </main>
  );
}
