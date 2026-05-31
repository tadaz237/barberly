import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, MessageCircle } from "lucide-react";
import { MessagesPanel } from "@/src/components/messages/messages-panel";
import { auth } from "@/src/lib/auth";
import { listConversationsForUser } from "@/src/lib/conversations-store";
import { getUserById } from "@/src/lib/users-store";

export default async function AdminMessagesPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login?callbackUrl=/admin/messages");
  }

  const user = await getUserById(session.user.id);
  if (!user) redirect("/login?callbackUrl=/admin/messages");
  if (user.role === "client") redirect("/client/messages");

  const conversations = await listConversationsForUser(user.id);

  return (
    <main className="relative min-h-screen overflow-hidden bg-black text-white">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.04)_1px,transparent_1px)] bg-size-[56px_56px] opacity-60"
      />
      <section className="relative mx-auto w-full max-w-6xl space-y-6 px-4 py-6 sm:px-6 sm:py-10 lg:px-8 lg:py-12">
        <Link
          href="/admin"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-white/60 transition-colors hover:text-amber-200 sm:text-sm"
        >
          <ArrowLeft className="size-4" />
          Retour au tableau de bord
        </Link>
        <header className="space-y-3">
          <span className="inline-flex items-center gap-2 rounded-full border border-amber-400/30 bg-amber-400/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.22em] text-amber-200">
            <MessageCircle className="size-3.5" />
            Messages
          </span>
          <h1 className="text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
            Conversations avec vos clients
          </h1>
        </header>
        <MessagesPanel
          currentUserId={user.id}
          conversations={conversations}
          viewer="professional"
        />
      </section>
    </main>
  );
}
