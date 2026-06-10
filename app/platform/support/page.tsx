import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Headphones, ShieldCheck } from "lucide-react";
import { SupportInbox } from "@/src/components/support/support-chat";
import { auth } from "@/src/lib/auth";
import { listSupportConversationsForAdmin } from "@/src/lib/support-store";
import { isPlatformAdmin } from "@/src/lib/users-store";

export const metadata = {
  title: "Support · Admin",
};

export default async function PlatformSupportPage() {
  const session = await auth();
  if (!session?.user?.email) {
    redirect("/login?callbackUrl=/platform/support");
  }
  if (!isPlatformAdmin(session.user.email)) {
    redirect("/");
  }

  const conversations = await listSupportConversationsForAdmin();

  return (
    <main className="relative min-h-screen overflow-hidden bg-black text-white">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.04)_1px,transparent_1px)] bg-size-[56px_56px] opacity-60"
      />

      <header className="relative border-b border-white/5 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6 sm:py-4 lg:px-8">
          <Link href="/" aria-label="Barberly · accueil">
            <Image
              src="/barberly.png"
              alt="Barberly"
              width={400}
              height={120}
              priority
              className="h-10 w-auto sm:h-12"
            />
          </Link>

          <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs">
            <ShieldCheck className="size-3.5 text-amber-300" />
            <span className="text-white/70">Admin plateforme</span>
          </div>
        </div>
      </header>

      <div className="relative mx-auto w-full max-w-6xl space-y-6 px-4 py-6 sm:px-6 sm:py-10 lg:px-8 lg:py-12">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-2">
            <p className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-sky-200">
              <Headphones className="size-3.5" />
              Messagerie support
            </p>
            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              Demandes de support
            </h1>
            <p className="max-w-2xl text-sm text-white/55">
              Répondez aux clients et professionnels qui vous contactent depuis
              l&apos;icône support de leur espace.
            </p>
          </div>
          <Link
            href="/platform/kyc"
            className="inline-flex h-9 items-center gap-2 rounded-full border border-amber-300/30 bg-amber-300/10 px-3 text-xs font-semibold text-amber-100 transition-colors hover:bg-amber-300/20"
          >
            <ShieldCheck className="size-4" />
            Validation KYC
          </Link>
        </div>

        <SupportInbox initialConversations={conversations} />
      </div>
    </main>
  );
}
