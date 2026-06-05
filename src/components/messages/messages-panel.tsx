"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
} from "react";
import {
  ArrowLeft,
  CalendarDays,
  Check,
  CheckCheck,
  Loader2,
  MessageCircle,
  Send,
} from "lucide-react";
import type {
  ConversationItem,
  ConversationMessage,
} from "@/src/lib/conversations-store";
import { useMessageNotifications } from "@/src/components/messages/message-notifications";
import { cn } from "@/src/lib/utils";

type Props = {
  currentUserId: string;
  conversations: ConversationItem[];
  viewer: "client" | "professional";
};

type Accent = {
  label: string;
  eyebrow: string;
  activeItem: string;
  unreadDot: string;
  avatar: string;
  avatarActive: string;
  myBubble: string;
  myMeta: string;
  sendButton: string;
  focus: string;
};

const ACCENTS: Record<Props["viewer"], Accent> = {
  client: {
    label: "text-pink-200",
    eyebrow: "border-pink-400/30 bg-pink-400/10 text-pink-200",
    activeItem: "bg-pink-400/12 border-l-2 border-l-pink-400",
    unreadDot: "bg-pink-400",
    avatar: "bg-white/8 text-white/70 ring-white/10",
    avatarActive: "bg-pink-400/15 text-pink-100 ring-pink-400/30",
    myBubble: "bg-pink-400 text-pink-950 rounded-br-md",
    myMeta: "text-pink-950/55",
    sendButton:
      "bg-pink-400 text-pink-950 shadow-pink-500/20 hover:bg-pink-300",
    focus: "focus-within:border-pink-400/40 focus-within:ring-pink-400/20",
  },
  professional: {
    label: "text-amber-200",
    eyebrow: "border-amber-400/30 bg-amber-400/10 text-amber-200",
    activeItem: "bg-amber-400/12 border-l-2 border-l-amber-400",
    unreadDot: "bg-amber-400",
    avatar: "bg-white/8 text-white/70 ring-white/10",
    avatarActive: "bg-amber-400/15 text-amber-100 ring-amber-400/30",
    myBubble: "bg-amber-400 text-amber-950 rounded-br-md",
    myMeta: "text-amber-950/55",
    sendButton:
      "bg-amber-400 text-amber-950 shadow-amber-500/20 hover:bg-amber-300",
    focus: "focus-within:border-amber-400/40 focus-within:ring-amber-400/20",
  },
};

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  const letters = parts.slice(0, 2).map((part) => part[0]?.toUpperCase() ?? "");
  return letters.join("") || "?";
}

function formatListTime(iso: string) {
  const date = new Date(iso);
  const now = new Date();
  if (date.toDateString() === now.toDateString()) {
    return date.toLocaleTimeString("fr-FR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  }
  const diffDays = Math.floor(
    (now.getTime() - date.getTime()) / (24 * 60 * 60 * 1000),
  );
  if (diffDays < 7) {
    return date.toLocaleDateString("fr-FR", { weekday: "short" });
  }
  return date.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" });
}

function formatDaySeparator(iso: string) {
  const date = new Date(iso);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  if (date.toDateString() === today.toDateString()) return "Aujourd'hui";
  if (date.toDateString() === yesterday.toDateString()) return "Hier";
  return date.toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

type TimelineItem =
  | { kind: "separator"; id: string; label: string }
  | { kind: "message"; id: string; message: ConversationMessage };

function buildTimeline(messages: ConversationMessage[]): TimelineItem[] {
  const timeline: TimelineItem[] = [];
  let lastDay = "";
  for (const message of messages) {
    const day = new Date(message.createdAt).toDateString();
    if (day !== lastDay) {
      timeline.push({
        kind: "separator",
        id: `sep-${day}`,
        label: formatDaySeparator(message.createdAt),
      });
      lastDay = day;
    }
    timeline.push({ kind: "message", id: message.id, message });
  }
  return timeline;
}

function Avatar({
  name,
  className,
  size = "md",
}: {
  name: string;
  className?: string;
  size?: "sm" | "md";
}) {
  return (
    <span
      aria-hidden
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full font-semibold uppercase ring-1",
        size === "sm" ? "size-9 text-xs" : "size-11 text-sm",
        className,
      )}
    >
      {initials(name)}
    </span>
  );
}

export function MessagesPanel({ currentUserId, conversations, viewer }: Props) {
  const accent = ACCENTS[viewer];
  const [items, setItems] = useState(conversations);
  const [activeId, setActiveId] = useState(conversations[0]?.id ?? "");
  const [mobileChatOpen, setMobileChatOpen] = useState(false);
  const [body, setBody] = useState("");
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();
  const { refreshNotifications } = useMessageNotifications();
  const scrollRef = useRef<HTMLDivElement>(null);
  const active = useMemo(
    () => items.find((item) => item.id === activeId) ?? items[0],
    [activeId, items],
  );
  const unreadTotal = useMemo(
    () => items.reduce((total, item) => total + item.unreadCount, 0),
    [items],
  );
  const getOtherName = useCallback(
    (item: ConversationItem) =>
      item.clientId === currentUserId ? item.providerName : item.clientName,
    [currentUserId],
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

  useEffect(() => {
    const element = scrollRef.current;
    if (element) element.scrollTop = element.scrollHeight;
  }, [active?.id, active?.messages.length]);

  function openConversation(id: string) {
    setActiveId(id);
    setMobileChatOpen(true);
  }

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
      <div className="flex min-h-80 flex-col items-center justify-center rounded-3xl border border-dashed border-white/15 bg-white/3 p-10 text-center">
        <span className="mb-4 inline-flex size-14 items-center justify-center rounded-2xl border border-white/10 bg-white/5">
          <MessageCircle className="size-6 text-white/40" />
        </span>
        <p className="text-base font-medium text-white/85">
          Aucune conversation pour le moment
        </p>
        <p className="mt-1.5 max-w-sm text-sm text-white/45">
          Les échanges démarrent automatiquement après une réservation.
        </p>
      </div>
    );
  }

  const timeline = active ? buildTimeline(active.messages) : [];

  return (
    <section className="grid h-160 grid-cols-1 overflow-hidden rounded-3xl border border-white/10 bg-zinc-950/80 shadow-2xl backdrop-blur lg:grid-cols-[340px_minmax(0,1fr)]">
      <aside
        className={cn(
          "min-h-0 flex-col border-white/10 lg:flex lg:border-r",
          mobileChatOpen ? "hidden" : "flex",
        )}
      >
        <div className="flex items-center justify-between gap-3 border-b border-white/10 px-4 py-4">
          <div className="flex items-center gap-2">
            <MessageCircle className={cn("size-4", accent.label)} />
            <p className="text-sm font-semibold text-white">Conversations</p>
          </div>
          {unreadTotal > 0 ? (
            <span className="inline-flex min-w-6 items-center justify-center rounded-full bg-red-500 px-2 py-0.5 text-[10px] font-bold text-white">
              {unreadTotal > 99 ? "99+" : unreadTotal}
            </span>
          ) : null}
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto">
          {items.map((item) => {
            const otherName = getOtherName(item);
            const isActive = item.id === active?.id;
            const previewTime = item.lastMessage?.createdAt ?? item.updatedAt;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => openConversation(item.id)}
                className={cn(
                  "flex w-full items-center gap-3 border-b border-white/6 px-4 py-3 text-left transition-colors",
                  isActive ? accent.activeItem : "hover:bg-white/4",
                )}
              >
                <Avatar
                  name={otherName}
                  size="sm"
                  className={isActive ? accent.avatarActive : accent.avatar}
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-sm font-semibold text-white">
                      {otherName}
                    </p>
                    <span className="shrink-0 text-[10px] text-white/35">
                      {formatListTime(previewTime)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <p
                      className={cn(
                        "mt-0.5 truncate text-xs",
                        item.unreadCount > 0
                          ? "font-medium text-white/75"
                          : "text-white/40",
                      )}
                    >
                      {item.lastMessage?.body ?? "Aucun message."}
                    </p>
                    {item.unreadCount > 0 ? (
                      <span
                        className={cn(
                          "inline-flex min-w-5 shrink-0 items-center justify-center rounded-full px-1.5 text-[10px] font-bold leading-5 text-zinc-950",
                          accent.unreadDot,
                        )}
                      >
                        {item.unreadCount > 99 ? "99+" : item.unreadCount}
                      </span>
                    ) : null}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </aside>

      {active ? (
        <div
          className={cn(
            "min-h-0 flex-col bg-zinc-950/40 lg:flex",
            mobileChatOpen ? "flex" : "hidden",
          )}
        >
          <header className="flex items-center gap-3 border-b border-white/10 px-4 py-3.5 sm:px-5">
            <button
              type="button"
              onClick={() => setMobileChatOpen(false)}
              aria-label="Retour aux conversations"
              className="inline-flex size-9 items-center justify-center rounded-full text-white/60 transition-colors hover:bg-white/5 hover:text-white lg:hidden"
            >
              <ArrowLeft className="size-4" />
            </button>
            <Avatar
              name={getOtherName(active)}
              className={accent.avatarActive}
            />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-white">
                {getOtherName(active)}
              </p>
              <p className="flex items-center gap-1.5 truncate text-xs text-white/45">
                <CalendarDays className="size-3 shrink-0" />
                <span className="truncate">
                  {active.serviceName} ·{" "}
                  {new Date(active.scheduledAt).toLocaleDateString("fr-FR", {
                    day: "numeric",
                    month: "short",
                  })}
                </span>
              </p>
            </div>
          </header>

          <div
            ref={scrollRef}
            className="min-h-0 flex-1 space-y-1.5 overflow-y-auto px-4 py-5 sm:px-5"
          >
            {timeline.length === 0 ? (
              <div className="flex h-full items-center justify-center">
                <p className="max-w-xs rounded-2xl border border-dashed border-white/10 bg-white/3 px-5 py-4 text-center text-sm text-white/45">
                  Démarrez l&apos;échange autour de cette réservation.
                </p>
              </div>
            ) : (
              timeline.map((entry) => {
                if (entry.kind === "separator") {
                  return (
                    <div
                      key={entry.id}
                      className="flex items-center justify-center py-3"
                    >
                      <span className="rounded-full bg-white/5 px-3 py-1 text-[10px] font-medium uppercase tracking-wide text-white/45">
                        {entry.label}
                      </span>
                    </div>
                  );
                }

                const message = entry.message;
                const mine = message.senderId === currentUserId;
                return (
                  <div
                    key={entry.id}
                    className={cn(
                      "flex",
                      mine ? "justify-end" : "justify-start",
                    )}
                  >
                    <div
                      className={cn(
                        "max-w-[80%] rounded-2xl px-3.5 py-2 text-sm leading-relaxed shadow-sm sm:max-w-[70%]",
                        mine
                          ? accent.myBubble
                          : "rounded-bl-md bg-white/[0.07] text-white/85",
                      )}
                    >
                      <p className="whitespace-pre-wrap wrap-break-word">
                        {message.body}
                      </p>
                      <p
                        className={cn(
                          "mt-1 flex items-center justify-end gap-1 text-[10px]",
                          mine ? accent.myMeta : "text-white/35",
                        )}
                      >
                        {new Date(message.createdAt).toLocaleTimeString(
                          "fr-FR",
                          { hour: "2-digit", minute: "2-digit" },
                        )}
                        {mine ? (
                          message.readAt ? (
                            <CheckCheck className="size-3" />
                          ) : (
                            <Check className="size-3" />
                          )
                        ) : null}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div className="border-t border-white/10 p-3 sm:p-4">
            {error ? (
              <p className="mb-2 px-1 text-xs text-red-300">{error}</p>
            ) : null}
            <div
              className={cn(
                "flex items-end gap-2 rounded-2xl border border-white/10 bg-white/5 p-1.5 transition-colors focus-within:ring-2",
                accent.focus,
              )}
            >
              <textarea
                value={body}
                rows={1}
                onChange={(event) => setBody(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault();
                    sendMessage();
                  }
                }}
                placeholder="Écrire un message…"
                className="max-h-32 min-h-9 min-w-0 flex-1 resize-none bg-transparent px-3 py-2 text-sm text-white outline-none placeholder:text-white/35"
              />
              <button
                type="button"
                onClick={sendMessage}
                disabled={isPending || !body.trim()}
                aria-label="Envoyer le message"
                className={cn(
                  "inline-flex size-9 shrink-0 items-center justify-center rounded-xl font-semibold shadow-lg transition-colors disabled:opacity-50",
                  accent.sendButton,
                )}
              >
                {isPending ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Send className="size-4" />
                )}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
