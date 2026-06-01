"use client";

import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import { Loader2, MessageCircle, Send } from "lucide-react";
import type { ConversationItem } from "@/src/lib/conversations-store";
import { useMessageNotifications } from "@/src/components/messages/message-notifications";
import { cn } from "@/src/lib/utils";

type Props = {
  currentUserId: string;
  conversations: ConversationItem[];
  viewer: "client" | "professional";
};

export function MessagesPanel({
  currentUserId,
  conversations,
  viewer,
}: Props) {
  const [items, setItems] = useState(conversations);
  const [activeId, setActiveId] = useState(conversations[0]?.id ?? "");
  const [body, setBody] = useState("");
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();
  const { refreshNotifications } = useMessageNotifications();
  const active = useMemo(
    () => items.find((item) => item.id === activeId) ?? items[0],
    [activeId, items],
  );
  const unreadTotal = useMemo(
    () => items.reduce((total, item) => total + item.unreadCount, 0),
    [items],
  );

  const refreshConversations = useCallback(async () => {
    try {
      const response = await fetch("/api/conversations", { cache: "no-store" });
      const payload = (await response.json().catch(() => null)) as
        | { conversations?: ConversationItem[] }
        | null;

      if (!response.ok || !payload?.conversations) return;

      setItems(payload.conversations);
      setActiveId((current) => {
        if (payload.conversations?.some((item) => item.id === current)) {
          return current;
        }
        return payload.conversations?.[0]?.id ?? "";
      });
    } catch {
      // Keep the last rendered messages when a background refresh fails.
    }
  }, []);

  useEffect(() => {
    const initialRefresh = window.setTimeout(() => {
      void refreshConversations();
    }, 0);
    const interval = window.setInterval(refreshConversations, 6_000);
    const handleFocus = () => void refreshConversations();
    window.addEventListener("focus", handleFocus);

    return () => {
      window.clearTimeout(initialRefresh);
      window.clearInterval(interval);
      window.removeEventListener("focus", handleFocus);
    };
  }, [refreshConversations]);

  useEffect(() => {
    if (!active?.id || active.unreadCount === 0) return;

    let cancelled = false;
    async function markActiveConversationRead() {
      try {
        const response = await fetch(`/api/conversations/${active?.id}/read`, {
          method: "PATCH",
          cache: "no-store",
        });
        const payload = (await response.json().catch(() => null)) as
          | { conversation?: ConversationItem }
          | null;

        if (!cancelled && response.ok && payload?.conversation) {
          setItems((previous) =>
            previous.map((item) =>
              item.id === payload.conversation?.id ? payload.conversation : item,
            ),
          );
          void refreshNotifications({ silent: true });
        }
      } catch {
        // A later refresh will retry the read state.
      }
    }

    void markActiveConversationRead();
    return () => {
      cancelled = true;
    };
  }, [active?.id, active?.unreadCount, refreshNotifications]);

  function sendMessage() {
    if (!active || !body.trim()) return;
    setError("");
    const nextBody = body;
    setBody("");
    startTransition(async () => {
      try {
        const response = await fetch(`/api/conversations/${active.id}/messages`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ body: nextBody }),
        });
        const payload = (await response.json().catch(() => null)) as
          | { conversation?: ConversationItem; message?: string }
          | null;

        if (!response.ok || !payload?.conversation) {
          setError(payload?.message ?? "Message impossible.");
          setBody(nextBody);
          return;
        }

        setItems((previous) =>
          previous.map((item) =>
            item.id === payload.conversation?.id ? payload.conversation : item,
          ),
        );
        void refreshNotifications({ silent: true });
      } catch {
        setError("Erreur réseau. Réessayez.");
        setBody(nextBody);
      }
    });
  }

  if (items.length === 0) {
    return (
      <div className="rounded-3xl border border-dashed border-white/15 bg-white/[0.03] p-8 text-center text-sm text-white/55">
        <MessageCircle className="mx-auto mb-3 size-8 text-white/35" />
        Aucune conversation pour le moment.
      </div>
    );
  }

  return (
    <section className="grid min-h-[560px] overflow-hidden rounded-3xl border border-white/10 bg-zinc-950/80 shadow-2xl backdrop-blur lg:grid-cols-[320px_minmax(0,1fr)]">
      <aside className="border-b border-white/10 lg:border-r lg:border-b-0">
        <div className="border-b border-white/10 px-4 py-3">
          <div className="flex items-center justify-between gap-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-pink-200">
              Conversations
            </p>
            {unreadTotal > 0 ? (
              <span className="inline-flex min-w-6 items-center justify-center rounded-full bg-red-500 px-2 py-0.5 text-[10px] font-bold text-white">
                {unreadTotal > 99 ? "99+" : unreadTotal}
              </span>
            ) : null}
          </div>
        </div>
        <div className="max-h-80 overflow-y-auto lg:max-h-[620px]">
          {items.map((item) => {
            const otherName =
              viewer === "client" ? item.providerName : item.clientName;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveId(item.id)}
                className={cn(
                  "block w-full border-b border-white/10 px-4 py-3 text-left transition-colors",
                  item.id === active?.id
                    ? "bg-pink-400/10"
                    : "hover:bg-white/[0.04]",
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-white">
                      {otherName}
                    </p>
                    <p className="truncate text-xs text-white/50">
                      {item.serviceName}
                    </p>
                  </div>
                  {item.unreadCount > 0 ? (
                    <span className="inline-flex min-w-5 shrink-0 items-center justify-center rounded-full bg-red-500 px-1.5 text-[10px] font-bold leading-5 text-white">
                      {item.unreadCount > 99 ? "99+" : item.unreadCount}
                    </span>
                  ) : null}
                </div>
                <p className="mt-1 truncate text-xs text-white/35">
                  {item.lastMessage?.body ?? "Aucun message."}
                </p>
              </button>
            );
          })}
        </div>
      </aside>

      {active ? (
        <div className="flex min-h-0 flex-col">
          <header className="border-b border-white/10 px-5 py-4">
            <p className="text-sm font-semibold text-white">
              {viewer === "client" ? active.providerName : active.clientName}
            </p>
            <p className="text-xs text-white/45">
              {active.serviceName} ·{" "}
              {new Date(active.scheduledAt).toLocaleDateString("fr-FR")}
            </p>
          </header>

          <div className="flex-1 space-y-3 overflow-y-auto px-5 py-5">
            {active.messages.length === 0 ? (
              <p className="rounded-2xl border border-dashed border-white/10 bg-white/[0.03] p-5 text-center text-sm text-white/45">
                Démarrez l&apos;échange autour de cette réservation.
              </p>
            ) : (
              active.messages.map((message) => {
                const mine = message.senderId === currentUserId;
                return (
                  <div
                    key={message.id}
                    className={cn(
                      "flex",
                      mine ? "justify-end" : "justify-start",
                    )}
                  >
                    <div
                      className={cn(
                        "max-w-[78%] rounded-2xl px-4 py-2 text-sm leading-6",
                        mine
                          ? "bg-pink-400 text-pink-950"
                          : "bg-white/8 text-white/80",
                      )}
                    >
                      <p>{message.body}</p>
                      <p
                        className={cn(
                          "mt-1 text-[10px]",
                          mine ? "text-pink-950/60" : "text-white/35",
                        )}
                      >
                        {new Date(message.createdAt).toLocaleTimeString(
                          "fr-FR",
                          { hour: "2-digit", minute: "2-digit" },
                        )}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div className="border-t border-white/10 p-4">
            {error ? <p className="mb-2 text-xs text-red-300">{error}</p> : null}
            <div className="flex gap-2">
              <input
                value={body}
                onChange={(event) => setBody(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault();
                    sendMessage();
                  }
                }}
                placeholder="Écrire un message..."
                className="h-11 min-w-0 flex-1 rounded-2xl border border-white/10 bg-white/5 px-4 text-sm text-white outline-none placeholder:text-white/35 focus:border-pink-400/40 focus:ring-2 focus:ring-pink-400/20"
              />
              <button
                type="button"
                onClick={sendMessage}
                disabled={isPending || !body.trim()}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-pink-400 px-4 text-sm font-semibold text-pink-950 shadow-lg shadow-pink-500/20 transition-colors hover:bg-pink-300 disabled:opacity-60"
              >
                {isPending ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Send className="size-4" />
                )}
                <span className="hidden sm:inline">Envoyer</span>
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
