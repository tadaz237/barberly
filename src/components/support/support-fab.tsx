"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { LifeBuoy } from "lucide-react";

type SupportState = {
  authed: boolean;
  isAdmin: boolean;
  unreadTotal: number;
};

const POLLING_INTERVAL_MS = 10_000;

// Routes where a floating support bubble would be noise or redundant.
const HIDDEN_EXACT = new Set(["/", "/join"]);
const HIDDEN_PREFIXES = ["/support", "/platform/support"];

function isHiddenPath(pathname: string | null) {
  if (!pathname) return true;
  if (HIDDEN_EXACT.has(pathname)) return true;
  return HIDDEN_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

/** Floating help bubble shown to authenticated users across the whole app. */
export function SupportFab() {
  const pathname = usePathname();
  const [state, setState] = useState<SupportState | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const response = await fetch("/api/support/notifications", {
          cache: "no-store",
        });
        if (response.status === 401 || response.status === 403) {
          if (!cancelled) setState({ authed: false, isAdmin: false, unreadTotal: 0 });
          return;
        }
        const payload = (await response.json().catch(() => null)) as
          | { unreadTotal?: number; isAdmin?: boolean }
          | null;
        if (!cancelled && response.ok && payload) {
          setState({
            authed: true,
            isAdmin: Boolean(payload.isAdmin),
            unreadTotal: payload.unreadTotal ?? 0,
          });
        }
      } catch {
        // Keep the last known state when a refresh fails.
      }
    }

    void load();
    const interval = window.setInterval(load, POLLING_INTERVAL_MS);
    const handleFocus = () => void load();
    window.addEventListener("focus", handleFocus);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
      window.removeEventListener("focus", handleFocus);
    };
  }, [pathname]);

  if (!state?.authed || isHiddenPath(pathname)) return null;

  const href = state.isAdmin ? "/platform/support" : "/support";
  const { unreadTotal } = state;

  return (
    <Link
      href={href}
      aria-label={
        unreadTotal > 0
          ? `Support — ${unreadTotal} message${unreadTotal > 1 ? "s" : ""} non lu${unreadTotal > 1 ? "s" : ""}`
          : "Contacter le support"
      }
      title="Contacter le support"
      className="group fixed bottom-5 right-5 z-90 inline-flex items-center gap-2 rounded-full border border-sky-300/40 bg-sky-500 py-3 pl-3 pr-4 text-sm font-semibold text-sky-950 shadow-2xl shadow-sky-900/40 transition-all duration-200 hover:-translate-y-0.5 hover:bg-sky-400 sm:bottom-6 sm:right-6"
    >
      <span className="relative inline-flex">
        <LifeBuoy className="size-5" />
        {unreadTotal > 0 ? (
          <span className="absolute -right-2.5 -top-2 inline-flex min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold leading-4 text-white ring-2 ring-sky-500">
            {unreadTotal > 99 ? "99+" : unreadTotal}
          </span>
        ) : null}
      </span>
      <span className="hidden max-w-0 overflow-hidden whitespace-nowrap opacity-0 transition-all duration-200 group-hover:max-w-32 group-hover:opacity-100 sm:inline">
        Support
      </span>
    </Link>
  );
}
