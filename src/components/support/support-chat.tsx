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
  Check,
  CheckCheck,
  Headphones,
  LifeBuoy,
  Loader2,
  Send,
} from "lucide-react";
import type { SupportConversation, SupportMessage } from "@/src/lib/support-store";
import { cn } from "@/src/lib/utils";

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  return parts
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("") || "?";
}

function formatListTime(iso: string) {
  const date = new Date(iso);
  const now = new Date();
  if (date.toDateString() === now.toDateString()) {
    return date.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
  }
  const diffDays = Math.floor(
    (now.getTime() - date.getTime()) / (24 * 60 * 60 * 1000),
  );
  if (diffDays < 7) return date.toLocaleDateString("fr-FR", { weekday: "short" });
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
  | { kind: "message"; id: string; message: SupportMessage };

function buildTimeline(messages: SupportMessage[]): TimelineItem[] {
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

function MessageTimeline({
  scrollRef,
  messages,
  isMine,
  emptyLabel,
}: {
  scrollRef: React.RefObject<HTMLDivElement | null>;
  messages: SupportMessage[];
  isMine: (message: SupportMessage) => boolean;
  emptyLabel: string;
}) {
  const timeline = buildTimeline(messages);
  return (
    <div
      ref={scrollRef}
      className="min-h-0 flex-1 space-y-1.5 overflow-y-auto px-4 py-5 sm:px-5"
    >
      {timeline.length === 0 ? (
        <div className="flex h-full items-center justify-center">
          <p className="max-w-xs rounded-2xl border border-dashed border-white/10 bg-white/3 px-5 py-4 text-center text-sm text-white/45">
            {emptyLabel}
          </p>
        </div>
      ) : (
        timeline.map((entry) => {
          if (entry.kind === "separator") {
            return (
              <div key={entry.id} className="flex items-center justify-center py-3">
                <span className="rounded-full bg-white/5 px-3 py-1 text-[10px] font-medium uppercase tracking-wide text-white/45">
                  {entry.label}
                </span>
              </div>
            );
          }
          const message = entry.message;
          const mine = isMine(message);
          return (
            <div
              key={entry.id}
              className={cn("flex", mine ? "justify-end" : "justify-start")}
            >
              <div
                className={cn(
                  "max-w-[80%] rounded-2xl px-3.5 py-2 text-sm leading-relaxed shadow-sm sm:max-w-[70%]",
                  mine
                    ? "rounded-br-md bg-sky-400 text-sky-950"
                    : "rounded-bl-md bg-white/[0.07] text-white/85",
                )}
              >
                <p className="whitespace-pre-wrap wrap-break-word">{message.body}</p>
                <p
                  className={cn(
                    "mt-1 flex items-center justify-end gap-1 text-[10px]",
                    mine ? "text-sky-950/55" : "text-white/35",
                  )}
                >
                  {new Date(message.createdAt).toLocaleTimeString("fr-FR", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
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
  );
}

function Composer({
  body,
  setBody,
  onSend,
  isPending,
  error,
  placeholder,
}: {
  body: string;
  setBody: (value: string) => void;
  onSend: () => void;
  isPending: boolean;
  error: string;
  placeholder: string;
}) {
  return (
    <div className="border-t border-white/10 p-3 sm:p-4">
      {error ? <p className="mb-2 px-1 text-xs text-red-300">{error}</p> : null}
      <div className="flex items-end gap-2 rounded-2xl border border-white/10 bg-white/5 p-1.5 transition-colors focus-within:border-sky-400/40 focus-within:ring-2 focus-within:ring-sky-400/20">
        <textarea
          value={body}
          rows={1}
          onChange={(event) => setBody(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              onSend();
            }
          }}
          placeholder={placeholder}
          className="max-h-32 min-h-9 min-w-0 flex-1 resize-none bg-transparent px-3 py-2 text-sm text-white outline-none placeholder:text-white/35"
        />
        <button
          type="button"
          onClick={onSend}
          disabled={isPending || !body.trim()}
          aria-label="Envoyer le message"
          className="inline-flex size-9 shrink-0 items-center justify-center rounded-xl bg-sky-400 font-semibold text-sky-950 shadow-lg shadow-sky-500/20 transition-colors hover:bg-sky-300 disabled:opacity-50"
        >
          {isPending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Send className="size-4" />
          )}
        </button>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* User-facing support chat (single thread with the super admin)              */
/* -------------------------------------------------------------------------- */

export function SupportChat({
  currentUserId,
  initialConversation,
}: {
  currentUserId: string;
  initialConversation: SupportConversation | null;
}) {
  const [conversation, setConversation] = useState(initialConversation);
  const [body, setBody] = useState("");
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();
  const scrollRef = useRef<HTMLDivElement>(null);
  const messages = useMemo(() => conversation?.messages ?? [], [conversation]);

  const refresh = useCallback(async () => {
    try {
      const response = await fetch("/api/support", { cache: "no-store" });
      const payload = (await response.json().catch(() => null)) as
        | { conversation?: SupportConversation | null }
        | null;
      if (response.ok && payload) setConversation(payload.conversation ?? null);
    } catch {
      // Keep the last rendered state when a background refresh fails.
    }
  }, []);

  useEffect(() => {
    const interval = window.setInterval(refresh, 6_000);
    const handleFocus = () => void refresh();
    window.addEventListener("focus", handleFocus);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener("focus", handleFocus);
    };
  }, [refresh]);

  useEffect(() => {
    if ((conversation?.unreadForUser ?? 0) === 0) return;

    let cancelled = false;
    async function markRead() {
      try {
        const response = await fetch("/api/support/read", {
          method: "PATCH",
          cache: "no-store",
        });
        const payload = (await response.json().catch(() => null)) as
          | { conversation?: SupportConversation | null }
          | null;
        if (!cancelled && response.ok && payload) {
          setConversation(payload.conversation ?? null);
        }
      } catch {
        // A later refresh retries the read state.
      }
    }

    void markRead();
    return () => {
      cancelled = true;
    };
  }, [conversation?.unreadForUser]);

  useEffect(() => {
    const element = scrollRef.current;
    if (element) element.scrollTop = element.scrollHeight;
  }, [messages.length]);

  function sendMessage() {
    if (!body.trim()) return;
    setError("");
    const nextBody = body;
    setBody("");
    startTransition(async () => {
      try {
        const response = await fetch("/api/support", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ body: nextBody }),
        });
        const payload = (await response.json().catch(() => null)) as
          | { conversation?: SupportConversation; message?: string }
          | null;
        if (!response.ok || !payload?.conversation) {
          setError(payload?.message ?? "Message impossible.");
          setBody(nextBody);
          return;
        }
        setConversation(payload.conversation);
      } catch {
        setError("Erreur réseau. Réessayez.");
        setBody(nextBody);
      }
    });
  }

  return (
    <section className="flex h-160 flex-col overflow-hidden rounded-3xl border border-white/10 bg-zinc-950/80 shadow-2xl backdrop-blur">
      <header className="flex items-center gap-3 border-b border-white/10 px-4 py-3.5 sm:px-5">
        <span className="inline-flex size-11 items-center justify-center rounded-full bg-sky-400/15 text-sky-200 ring-1 ring-sky-400/30">
          <LifeBuoy className="size-5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-white">
            Support Barberly
          </p>
          <p className="truncate text-xs text-white/45">
            Équipe de validation · réponse sous 24-48 h
          </p>
        </div>
      </header>

      <MessageTimeline
        scrollRef={scrollRef}
        messages={messages}
        isMine={(message) => message.senderId === currentUserId}
        emptyLabel="Une question, un souci avec votre KYC ou votre compte ? Écrivez-nous, le super admin vous répondra ici."
      />

      <Composer
        body={body}
        setBody={setBody}
        onSend={sendMessage}
        isPending={isPending}
        error={error}
        placeholder="Décrivez votre demande au support…"
      />
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/* Super-admin support inbox (all user threads)                               */
/* -------------------------------------------------------------------------- */

export function SupportInbox({
  initialConversations,
}: {
  initialConversations: SupportConversation[];
}) {
  const [items, setItems] = useState(initialConversations);
  const [activeId, setActiveId] = useState(initialConversations[0]?.id ?? "");
  const [mobileChatOpen, setMobileChatOpen] = useState(false);
  const [body, setBody] = useState("");
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();
  const scrollRef = useRef<HTMLDivElement>(null);

  const active = useMemo(
    () => items.find((item) => item.id === activeId) ?? items[0],
    [activeId, items],
  );
  const unreadTotal = useMemo(
    () => items.reduce((total, item) => total + item.unreadForAdmin, 0),
    [items],
  );

  const refresh = useCallback(async () => {
    try {
      const response = await fetch("/api/support/conversations", {
        cache: "no-store",
      });
      const payload = (await response.json().catch(() => null)) as
        | { conversations?: SupportConversation[] }
        | null;
      if (!response.ok || !payload?.conversations) return;
      setItems(payload.conversations);
      setActiveId((current) =>
        payload.conversations?.some((item) => item.id === current)
          ? current
          : payload.conversations?.[0]?.id ?? "",
      );
    } catch {
      // Keep the last rendered state when a background refresh fails.
    }
  }, []);

  useEffect(() => {
    const interval = window.setInterval(refresh, 6_000);
    const handleFocus = () => void refresh();
    window.addEventListener("focus", handleFocus);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener("focus", handleFocus);
    };
  }, [refresh]);

  useEffect(() => {
    if (!active?.id || active.unreadForAdmin === 0) return;
    let cancelled = false;
    async function markRead() {
      try {
        const response = await fetch(
          `/api/support/conversations/${active?.id}/read`,
          { method: "PATCH", cache: "no-store" },
        );
        const payload = (await response.json().catch(() => null)) as
          | { conversation?: SupportConversation }
          | null;
        if (!cancelled && response.ok && payload?.conversation) {
          setItems((previous) =>
            previous.map((item) =>
              item.id === payload.conversation?.id ? payload.conversation : item,
            ),
          );
        }
      } catch {
        // A later refresh retries the read state.
      }
    }
    void markRead();
    return () => {
      cancelled = true;
    };
  }, [active?.id, active?.unreadForAdmin]);

  useEffect(() => {
    const element = scrollRef.current;
    if (element) element.scrollTop = element.scrollHeight;
  }, [active?.id, active?.messages.length]);

  function openConversation(id: string) {
    setActiveId(id);
    setMobileChatOpen(true);
  }

  function sendReply() {
    if (!active || !body.trim()) return;
    setError("");
    const nextBody = body;
    setBody("");
    startTransition(async () => {
      try {
        const response = await fetch(
          `/api/support/conversations/${active.id}/messages`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ body: nextBody }),
          },
        );
        const payload = (await response.json().catch(() => null)) as
          | { conversation?: SupportConversation; message?: string }
          | null;
        if (!response.ok || !payload?.conversation) {
          setError(payload?.message ?? "Réponse impossible.");
          setBody(nextBody);
          return;
        }
        setItems((previous) =>
          previous.map((item) =>
            item.id === payload.conversation?.id ? payload.conversation : item,
          ),
        );
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
          <Headphones className="size-6 text-white/40" />
        </span>
        <p className="text-base font-medium text-white/85">
          Aucune demande de support
        </p>
        <p className="mt-1.5 max-w-sm text-sm text-white/45">
          Les messages envoyés par les utilisateurs depuis l&apos;icône support
          apparaîtront ici.
        </p>
      </div>
    );
  }

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
            <Headphones className="size-4 text-sky-200" />
            <p className="text-sm font-semibold text-white">Demandes support</p>
          </div>
          {unreadTotal > 0 ? (
            <span className="inline-flex min-w-6 items-center justify-center rounded-full bg-red-500 px-2 py-0.5 text-[10px] font-bold text-white">
              {unreadTotal > 99 ? "99+" : unreadTotal}
            </span>
          ) : null}
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto">
          {items.map((item) => {
            const isActive = item.id === active?.id;
            const previewTime = item.lastMessage?.createdAt ?? item.updatedAt;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => openConversation(item.id)}
                className={cn(
                  "flex w-full items-center gap-3 border-b border-white/6 px-4 py-3 text-left transition-colors",
                  isActive
                    ? "border-l-2 border-l-sky-400 bg-sky-400/12"
                    : "hover:bg-white/4",
                )}
              >
                <Avatar
                  name={item.userName}
                  size="sm"
                  className={
                    isActive
                      ? "bg-sky-400/15 text-sky-100 ring-sky-400/30"
                      : "bg-white/8 text-white/70 ring-white/10"
                  }
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-sm font-semibold text-white">
                      {item.userName}
                    </p>
                    <span className="shrink-0 text-[10px] text-white/35">
                      {formatListTime(previewTime)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <p
                      className={cn(
                        "mt-0.5 truncate text-xs",
                        item.unreadForAdmin > 0
                          ? "font-medium text-white/75"
                          : "text-white/40",
                      )}
                    >
                      {item.lastMessage?.body ?? "Aucun message."}
                    </p>
                    {item.unreadForAdmin > 0 ? (
                      <span className="inline-flex min-w-5 shrink-0 items-center justify-center rounded-full bg-sky-400 px-1.5 text-[10px] font-bold leading-5 text-zinc-950">
                        {item.unreadForAdmin > 99 ? "99+" : item.unreadForAdmin}
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
              aria-label="Retour à la liste"
              className="inline-flex size-9 items-center justify-center rounded-full text-white/60 transition-colors hover:bg-white/5 hover:text-white lg:hidden"
            >
              <ArrowLeft className="size-4" />
            </button>
            <Avatar
              name={active.userName}
              className="bg-sky-400/15 text-sky-100 ring-sky-400/30"
            />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-white">
                {active.userName}
              </p>
              <p className="truncate text-xs text-white/45">{active.userEmail}</p>
            </div>
          </header>

          <MessageTimeline
            scrollRef={scrollRef}
            messages={active.messages}
            isMine={(message) => message.fromSupport}
            emptyLabel="Aucun message dans cette conversation."
          />

          <Composer
            body={body}
            setBody={setBody}
            onSend={sendReply}
            isPending={isPending}
            error={error}
            placeholder="Répondre à l'utilisateur…"
          />
        </div>
      ) : null}
    </section>
  );
}
