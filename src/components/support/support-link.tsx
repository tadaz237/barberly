"use client";

import Link from "next/link";
import { useEffect, useState, type ComponentType } from "react";
import { MessageCircleMore, MessagesSquare } from "lucide-react";
import { cn } from "@/src/lib/utils";

type SupportIconName = "headphones" | "life-buoy";

type SupportLinkProps = {
  href: string;
  icon: SupportIconName;
  label?: string;
  className?: string;
  iconClassName?: string;
};

const POLLING_INTERVAL_MS = 10_000;

const SUPPORT_ICONS: Record<SupportIconName, ComponentType<{ className?: string }>> = {
  headphones: MessagesSquare,
  "life-buoy": MessageCircleMore,
};

/** Support entry point that polls and shows an unread-message badge. */
export function SupportLink({
  href,
  icon,
  label,
  className,
  iconClassName,
}: SupportLinkProps) {
  const [unreadTotal, setUnreadTotal] = useState(0);
  const Icon = SUPPORT_ICONS[icon];

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const response = await fetch("/api/support/notifications", {
          cache: "no-store",
        });
        if (response.status === 401 || response.status === 403) {
          if (!cancelled) setUnreadTotal(0);
          return;
        }
        const payload = (await response.json().catch(() => null)) as
          | { unreadTotal?: number }
          | null;
        if (!cancelled && response.ok && payload) {
          setUnreadTotal(payload.unreadTotal ?? 0);
        }
      } catch {
        // Keep the last known badge state when a refresh fails.
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
  }, []);

  return (
    <Link
      href={href}
      aria-label={label ? undefined : "Contacter le support"}
      className={cn("relative", className)}
    >
      <span className="relative inline-flex">
        <Icon
          className={cn(
            "size-4 text-cyan-200 drop-shadow-[0_0_10px_rgba(34,211,238,0.65)]",
            iconClassName,
          )}
        />
        {unreadTotal > 0 ? (
          <span className="absolute -right-2.5 -top-2 inline-flex min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold leading-4 text-white ring-2 ring-cyan-950">
            {unreadTotal > 99 ? "99+" : unreadTotal}
          </span>
        ) : null}
      </span>
      {label ? <span className="hidden sm:inline">{label}</span> : null}
    </Link>
  );
}
