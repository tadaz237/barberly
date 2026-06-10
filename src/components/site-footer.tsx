import Image from "next/image";
import Link from "next/link";
import { CalendarCheck, MessageCircleMore, Scissors, Store } from "lucide-react";

const FOOTER_LINKS = [
  { href: "/marketplace", label: "Marketplace", Icon: Store },
  { href: "/join", label: "Devenir pro", Icon: Scissors },
  { href: "/client", label: "Mes reservations", Icon: CalendarCheck },
  { href: "/support", label: "Support", Icon: MessageCircleMore },
];

export function SiteFooter() {
  return (
    <footer className="relative overflow-hidden border-t border-white/10 bg-zinc-950 text-white">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-cyan-300/50 to-transparent"
      />
      <div className="mx-auto grid w-full max-w-7xl gap-8 px-4 py-8 sm:px-6 lg:grid-cols-[1.1fr_1fr] lg:px-8">
        <div className="space-y-4">
          <Link
            href="/"
            aria-label="Barberly - accueil"
            className="inline-flex items-center transition-opacity hover:opacity-85"
          >
            <Image
              src="/barberly.png"
              alt="Barberly"
              width={240}
              height={72}
              className="h-11 w-auto"
            />
          </Link>
          <p className="max-w-md text-sm leading-6 text-white/55">
            Barberly connecte les clientes et les professionnels de la coiffure
            a domicile dans une experience simple, rapide et suivie.
          </p>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:justify-self-end">
          <nav aria-label="Liens du footer" className="space-y-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-cyan-200">
              Navigation
            </p>
            <div className="grid gap-2">
              {FOOTER_LINKS.map(({ href, label, Icon }) => (
                <Link
                  key={href}
                  href={href}
                  className="group inline-flex items-center gap-2 text-sm text-white/62 transition-colors hover:text-cyan-100"
                >
                  <Icon className="size-4 text-cyan-300/80 transition-colors group-hover:text-cyan-100" />
                  {label}
                </Link>
              ))}
            </div>
          </nav>

          <div className="space-y-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-emerald-200">
              Acces
            </p>
            <div className="flex flex-wrap gap-2">
              <Link
                href="/login"
                className="inline-flex h-9 items-center rounded-full border border-white/12 bg-white/5 px-3 text-xs font-semibold text-white/72 transition-colors hover:border-cyan-300/45 hover:bg-cyan-300/10 hover:text-cyan-100"
              >
                Espace pro
              </Link>
              <Link
                href="/client-login"
                className="inline-flex h-9 items-center rounded-full border border-white/12 bg-white/5 px-3 text-xs font-semibold text-white/72 transition-colors hover:border-pink-300/45 hover:bg-pink-300/10 hover:text-pink-100"
              >
                Espace client
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-white/8 px-4 pt-4 pb-20 sm:pb-4">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-2 text-xs text-white/38 sm:flex-row sm:items-center sm:justify-between">
          <span>&copy; {new Date().getFullYear()} Barberly. Tous droits reserves.</span>
          <span>Plateforme coiffure a domicile</span>
        </div>
      </div>
    </footer>
  );
}
