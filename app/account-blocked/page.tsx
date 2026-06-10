import Link from "next/link";
import { ShieldX } from "lucide-react";
import { SignOutButton } from "@/src/components/auth/sign-out-button";

export const metadata = {
  title: "Compte bloque",
};

export default function AccountBlockedPage() {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-black px-4 text-white">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.04)_1px,transparent_1px)] bg-size-[56px_56px] opacity-60"
      />
      <section className="relative w-full max-w-lg rounded-3xl border border-red-400/25 bg-zinc-950/90 p-6 text-center shadow-[0_24px_90px_-45px_rgba(239,68,68,0.55)] backdrop-blur sm:p-8">
        <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-red-500/15 text-red-200 ring-1 ring-red-400/25">
          <ShieldX className="size-7" />
        </div>
        <h1 className="mt-5 text-2xl font-semibold tracking-tight">
          Votre compte est bloque
        </h1>
        <p className="mt-3 text-sm leading-6 text-white/58">
          L&apos;acces a votre espace Barberly a ete suspendu par
          l&apos;administration. Contactez le support si vous pensez qu&apos;il
          s&apos;agit d&apos;une erreur.
        </p>
        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
          <Link
            href="/support"
            className="inline-flex h-10 items-center justify-center rounded-xl border border-cyan-300/30 bg-cyan-300/10 px-4 text-sm font-semibold text-cyan-100 transition-colors hover:bg-cyan-300/20"
          >
            Contacter le support
          </Link>
          <SignOutButton />
        </div>
      </section>
    </main>
  );
}
