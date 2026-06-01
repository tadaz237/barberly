"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { MessageCircle } from "lucide-react";
import { cn } from "@/src/lib/utils";

type LatestUnreadMessage = {
  id: string;
  conversationId: string;
  senderName: string;
  body: string;
  serviceName: string;
  createdAt: string;
};

type NotificationSummary = {
  unreadTotal: number;
  latestUnread?: LatestUnreadMessage;
};

type NotificationContextValue = {
  summary: NotificationSummary;
  refreshNotifications: (options?: { silent?: boolean }) => Promise<void>;
};

type MessagesLinkWithNotificationsProps = {
  href: string;
  className?: string;
  iconClassName?: string;
  children: ReactNode;
};

const EMPTY_SUMMARY: NotificationSummary = { unreadTotal: 0 };
const POLLING_INTERVAL_MS = 10_000;
const WATCHED_PREFIXES = ["/admin", "/client", "/platform"];

const MessageNotificationsContext =
  createContext<NotificationContextValue | null>(null);

function shouldWatchPath(pathname: string | null) {
  if (!pathname) return false;
  return WATCHED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

function compactMessage(message: string) {
  return message.length > 84 ? `${message.slice(0, 84).trim()}...` : message;
}

export function MessageNotificationsProvider({
  children,
}: {
  children: ReactNode;
}) {
  const pathname = usePathname();
  const shouldWatch = shouldWatchPath(pathname);
  const [summary, setSummary] = useState<NotificationSummary>(EMPTY_SUMMARY);
  const [toast, setToast] = useState<LatestUnreadMessage | null>(null);
  const latestSeenIdRef = useRef<string | null>(null);
  const hasLoadedRef = useRef(false);

  const refreshNotifications = useCallback(
    async (options?: { silent?: boolean }) => {
      if (!shouldWatch) {
        latestSeenIdRef.current = null;
        hasLoadedRef.current = false;
        return;
      }

      try {
        const response = await fetch("/api/conversations/notifications", {
          cache: "no-store",
        });

        if (response.status === 401 || response.status === 403) {
          setSummary(EMPTY_SUMMARY);
          latestSeenIdRef.current = null;
          hasLoadedRef.current = false;
          return;
        }

        const payload = (await response.json().catch(() => null)) as
          | { notifications?: NotificationSummary }
          | null;

        if (!response.ok || !payload?.notifications) return;

        const nextSummary = payload.notifications;
        const latestId = nextSummary.latestUnread?.id ?? null;
        setSummary(nextSummary);

        if (!hasLoadedRef.current) {
          latestSeenIdRef.current = latestId;
          hasLoadedRef.current = true;
          return;
        }

        if (
          !options?.silent &&
          nextSummary.latestUnread &&
          latestId !== latestSeenIdRef.current
        ) {
          setToast(nextSummary.latestUnread);
        }

        latestSeenIdRef.current = latestId;
      } catch {
        // The UI keeps the last known state when a transient refresh fails.
      }
    },
    [shouldWatch],
  );

  useEffect(() => {
    if (!shouldWatch) {
      latestSeenIdRef.current = null;
      hasLoadedRef.current = false;
      return;
    }

    const initialRefresh = window.setTimeout(() => {
      void refreshNotifications({ silent: true });
    }, 0);
    const interval = window.setInterval(() => {
      void refreshNotifications();
    }, POLLING_INTERVAL_MS);
    const handleFocus = () => void refreshNotifications();
    window.addEventListener("focus", handleFocus);

    return () => {
      window.clearTimeout(initialRefresh);
      window.clearInterval(interval);
      window.removeEventListener("focus", handleFocus);
    };
  }, [refreshNotifications, shouldWatch]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 6500);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const value = useMemo(
    () => ({
      summary: shouldWatch ? summary : EMPTY_SUMMARY,
      refreshNotifications,
    }),
    [refreshNotifications, shouldWatch, summary],
  );

  return (
    <MessageNotificationsContext.Provider value={value}>
      {children}
      {shouldWatch && toast ? (
        <div className="fixed right-4 top-20 z-50 w-[min(360px,calc(100vw-2rem))] rounded-2xl border border-pink-300/25 bg-zinc-950/95 p-4 text-white shadow-2xl shadow-pink-950/30 backdrop-blur">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 inline-flex size-9 shrink-0 items-center justify-center rounded-full bg-pink-400 text-pink-950">
              <MessageCircle className="size-4" />
            </span>
            <div className="min-w-0">
              <p className="text-sm font-semibold">
                Nouveau message de {toast.senderName}
              </p>
              <p className="mt-0.5 text-xs text-white/45">
                {toast.serviceName}
              </p>
              <p className="mt-2 text-sm leading-5 text-white/70">
                {compactMessage(toast.body)}
              </p>
            </div>
          </div>
        </div>
      ) : null}
    </MessageNotificationsContext.Provider>
  );
}

export function useMessageNotifications() {
  return (
    useContext(MessageNotificationsContext) ?? {
      summary: EMPTY_SUMMARY,
      refreshNotifications: async () => undefined,
    }
  );
}

export function MessagesLinkWithNotifications({
  href,
  className,
  iconClassName,
  children,
}: MessagesLinkWithNotificationsProps) {
  const { summary } = useMessageNotifications();
  const unreadTotal = summary.unreadTotal;

  return (
    <Link href={href} className={cn("relative", className)}>
      <span className="relative inline-flex">
        <MessageCircle className={cn("size-4", iconClassName)} />
        {unreadTotal > 0 ? (
          <span className="absolute -right-2.5 -top-2 inline-flex min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold leading-4 text-white ring-2 ring-black">
            {unreadTotal > 99 ? "99+" : unreadTotal}
          </span>
        ) : null}
      </span>
      {children}
    </Link>
  );
}
