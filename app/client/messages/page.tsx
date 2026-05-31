import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, MessageCircle } from "lucide-react";
import { MessagesPanel } from "@/src/components/messages/messages-panel";
import { auth } from "@/src/lib/auth";
import { listConversationsForUser } from "@/src/lib/conversations-store";
import { getUserById } from "@/src/lib/users-store";

export default async function ClientMessagesPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/client-login?callbackUrl=/client/messages");
  }

  const user = await getUserById(session.user.id);
  if (!user) redirect("/client-login?callbackUrl=/client/messages");
  if (user.role !== "client") redirect("/admin/messages");

  const conversations = await listConversationsForUser(user.id);

  return (
    <main className="relative min-h-screen overflow-hidden bg-black text-white">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.04)_1px,transparent_1px)] bg-size-[56px_56px] opacity-60"
      />
      <section className="relative mx-auto w-full max-w-6xl space-y-6 px-4 py-6 sm:px-6 sm:py-10 lg:px-8 lg:py-12">
        <Link
          href="/client"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-white/60 transition-colors hover:text-pink-200 sm:text-sm"
        >
          <ArrowLeft className="size-4" />
          Retour à mon espace
        </Link>
        <header className="space-y-3">
          <span className="inline-flex items-center gap-2 rounded-full border border-pink-400/30 bg-pink-400/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.22em] text-pink-200">
            <MessageCircle className="size-3.5" />
            Messages client
          </span>
          <h1 className="text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
            Conversations avec vos professionnels
          </h1>
        </header>
        <MessagesPanel
          currentUserId={user.id}
          conversations={conversations}
          viewer="client"
        />
      </section>
    </main>
  );
}
