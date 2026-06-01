import Image from "next/image";
import Link from "next/link";
import { ChevronRight, UserRound } from "lucide-react";
import { ServicesShowcase } from "@/src/components/marketplace/services-showcase";
import { QuickAccessButton } from "@/src/components/quick-access-button";
import { auth } from "@/src/lib/auth";
import { getUserById } from "@/src/lib/users-store";

export default async function MarketplacePage() {
  const session = await auth();
  const user = session?.user?.id ? await getUserById(session.user.id) : null;

  return (
    <main className="relative min-h-screen overflow-hidden bg-black text-white">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.04)_1px,transparent_1px)] bg-size-[56px_56px] opacity-60"
      />

      <header className="relative border-b border-white/5 backdrop-blur">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6 sm:py-4 lg:px-8">
          <Link
            href="/"
            aria-label="Barberly · accueil"
            className="inline-flex items-center transition-opacity hover:opacity-90"
          >
            <Image
              src="/barberly.png"
              alt="Barberly"
              width={400}
              height={120}
              priority
              className="h-10 w-auto sm:h-14"
            />
          </Link>

          <div className="flex items-center gap-2">
            <QuickAccessButton mobilePanelPlacement="bottom" />
            {user ? (
              <Link
                href={user.role === "client" ? "/client" : "/admin"}
                className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 py-1 pr-3 pl-1 text-xs font-medium text-white/80 transition-colors hover:bg-white/10 sm:text-sm"
              >
                <span className="flex size-7 items-center justify-center overflow-hidden rounded-full bg-white/10">
                  {user.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={user.image} alt="" className="size-full object-cover" />
                  ) : (
                    <UserRound className="size-3.5 text-white/60" />
                  )}
                </span>
                <span className="hidden truncate sm:block">
                  {user.role === "client" ? "Espace client" : user.name}
                </span>
                <ChevronRight className="size-3.5 text-white/50" />
              </Link>
            ) : (
              <Link
                href="/client-login"
                className="inline-flex items-center gap-1 text-xs font-medium text-white/70 transition-colors hover:text-pink-200 sm:text-sm"
              >
                <span className="text-pink-300 underline-offset-4 hover:underline">
                  Espace client
                </span>
                <ChevronRight className="size-4" />
              </Link>
            )}
          </div>
        </div>
      </header>

      <div className="relative mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-10 lg:px-8 lg:py-12">
        <ServicesShowcase />
      </div>
    </main>
  );
}
