"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { Bell, BellRing, X } from "lucide-react";

const PUBLIC_VAPID_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const WATCHED_PREFIXES = ["/admin", "/client", "/platform"];
const DISMISS_KEY = "barberly:push-notifications-dismissed-at";
const DISMISS_DURATION_MS = 7 * 24 * 60 * 60 * 1000;

function shouldWatchPath(pathname: string | null) {
  if (!pathname) return false;
  return WATCHED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = `${base64String}${padding}`
    .replace(/-/g, "+")
    .replace(/_/g, "/");
  const rawData = window.atob(base64);

  return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)));
}

function isDismissedRecently() {
  const dismissedAt = Number(window.localStorage.getItem(DISMISS_KEY) ?? 0);
  return (
    Number.isFinite(dismissedAt) &&
    dismissedAt > 0 &&
    Date.now() - dismissedAt < DISMISS_DURATION_MS
  );
}

export function BrowserPushNotifications() {
  const pathname = usePathname();
  const shouldWatch = shouldWatchPath(pathname);
  const [showPrompt, setShowPrompt] = useState(false);
  const [busy, setBusy] = useState(false);
  const [enabled, setEnabled] = useState(false);

  const supported = useMemo(() => {
    if (typeof window === "undefined") return false;
    return (
      "Notification" in window &&
      "serviceWorker" in navigator &&
      "PushManager" in window &&
      Boolean(PUBLIC_VAPID_KEY)
    );
  }, []);

  const dismissPrompt = useCallback(() => {
    window.localStorage.setItem(DISMISS_KEY, String(Date.now()));
    setShowPrompt(false);
  }, []);

  const ensureSubscription = useCallback(
    async (askPermission: boolean) => {
      if (!supported || !PUBLIC_VAPID_KEY) return;

      let permission = Notification.permission;
      if (permission === "default" && askPermission) {
        permission = await Notification.requestPermission();
      }

      if (permission !== "granted") {
        setShowPrompt(permission === "default" && !isDismissedRecently());
        return;
      }

      setBusy(true);
      try {
        const registration = await navigator.serviceWorker.ready;
        let subscription = await registration.pushManager.getSubscription();

        if (!subscription) {
          subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(PUBLIC_VAPID_KEY),
          });
        }

        const response = await fetch("/api/push/subscriptions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ subscription: subscription.toJSON() }),
        });

        if (response.ok) {
          setEnabled(true);
          setShowPrompt(false);
        } else if (response.status === 401 || response.status === 403) {
          setShowPrompt(false);
        }
      } catch (error) {
        console.error("Browser push subscription failed", error);
      } finally {
        setBusy(false);
      }
    },
    [supported],
  );

  useEffect(() => {
    if (!shouldWatch || !supported) {
      setShowPrompt(false);
      return;
    }

    if (Notification.permission === "granted") {
      void ensureSubscription(false);
      return;
    }

    if (Notification.permission === "default" && !isDismissedRecently()) {
      setShowPrompt(true);
    }
  }, [ensureSubscription, shouldWatch, supported]);

  if (!shouldWatch || !supported || enabled || !showPrompt) return null;

  return (
    <div className="fixed bottom-4 left-4 z-[85] w-[min(360px,calc(100vw-2rem))] rounded-2xl border border-white/10 bg-zinc-950/95 p-4 text-white shadow-2xl shadow-black/40 backdrop-blur">
      <button
        type="button"
        onClick={dismissPrompt}
        aria-label="Masquer"
        className="absolute right-3 top-3 inline-flex size-7 items-center justify-center rounded-full bg-white/5 text-white/55 transition-colors hover:bg-white/10 hover:text-white"
      >
        <X className="size-3.5" />
      </button>
      <div className="flex items-start gap-3 pr-7">
        <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-full bg-pink-400 text-pink-950">
          <BellRing className="size-4" />
        </span>
        <div className="min-w-0">
          <p className="text-sm font-semibold">Notifications navigateur</p>
          <p className="mt-1 text-xs leading-5 text-white/60">
            Recevez une alerte quand un message arrive ou quand une reservation
            est acceptee.
          </p>
          <button
            type="button"
            onClick={() => ensureSubscription(true)}
            disabled={busy}
            className="mt-3 inline-flex items-center gap-2 rounded-xl bg-white px-3 py-2 text-xs font-semibold text-zinc-950 transition-colors hover:bg-pink-100 disabled:opacity-60"
          >
            <Bell className="size-3.5" />
            {busy ? "Activation..." : "Activer"}
          </button>
        </div>
      </div>
    </div>
  );
}
