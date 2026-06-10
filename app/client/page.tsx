import Link from "next/link";
import { redirect } from "next/navigation";
import {
  CheckCircle2,
  Clock4,
  MessageCircle,
  Sparkles,
  Star,
} from "lucide-react";
import { SignOutButton } from "@/src/components/auth/sign-out-button";
import { ReviewForm } from "@/src/components/client/review-form";
import { MessagesLinkWithNotifications } from "@/src/components/messages/message-notifications";
import { SupportLink } from "@/src/components/support/support-link";
import { auth } from "@/src/lib/auth";
import { getReservationsForClient } from "@/src/lib/reservations-store";
import { getUserById } from "@/src/lib/users-store";
import { cn } from "@/src/lib/utils";

const STATUS_LABEL = {
  pending: "En attente",
  confirmed: "Confirmée",
  cancelled: "Annulée",
  completed: "Terminée",
} as const;

const STATUS_CLASS = {
  pending: "bg-blue-500/15 text-blue-300 ring-blue-500/30",
  confirmed: "bg-emerald-500/15 text-emerald-300 ring-emerald-500/30",
  cancelled: "bg-red-500/15 text-red-300 ring-red-500/30",
  completed: "bg-pink-500/15 text-pink-200 ring-pink-500/30",
} as const;

export default async function ClientPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/client-login?callbackUrl=/client");
  }

  const user = await getUserById(session.user.id);
  if (!user) redirect("/client-login?callbackUrl=/client");
  if (user.role !== "client") redirect("/admin");

  const reservations = await getReservationsForClient(user.id);

  return (
    <main className="relative min-h-screen overflow-hidden bg-black text-white">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.04)_1px,transparent_1px)] bg-size-[56px_56px] opacity-60"
      />

      <section className="relative mx-auto w-full max-w-5xl space-y-8 px-4 py-6 sm:px-6 sm:py-10 lg:px-8 lg:py-12">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-3">
            <span className="inline-flex items-center gap-2 rounded-full border border-pink-400/30 bg-pink-400/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.22em] text-pink-200">
              <Sparkles className="size-3.5" />
              Espace client
            </span>
            <h1 className="text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
              Bonjour {user.name}
            </h1>
            <p className="max-w-2xl text-sm leading-6 text-white/55">
              Retrouvez vos réservations, échangez avec le professionnel et
              notez une prestation une fois terminée.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link
              href="/marketplace"
              className="inline-flex h-10 items-center justify-center rounded-2xl border border-white/10 bg-white/5 px-4 text-sm font-semibold text-white/75 transition-colors hover:bg-white/10 hover:text-white"
            >
              Marketplace
            </Link>
            <MessagesLinkWithNotifications
              href="/client/messages"
              className="inline-flex h-10 items-center justify-center gap-2 rounded-2xl bg-pink-400 px-4 text-sm font-semibold text-pink-950 shadow-lg shadow-pink-500/20 transition-colors hover:bg-pink-300"
            >
              Messages
            </MessagesLinkWithNotifications>
            <SupportLink
              href="/support"
              icon="life-buoy"
              label="Support"
              className="inline-flex h-10 items-center justify-center gap-2 rounded-2xl border border-sky-400/30 bg-sky-400/10 px-4 text-sm font-semibold text-sky-100 transition-colors hover:bg-sky-400/20"
            />
            <SignOutButton />
          </div>
        </header>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-white">Mes réservations</h2>
          {reservations.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-white/15 bg-white/[0.03] p-8 text-center text-sm text-white/55">
              Aucune réservation pour le moment.
            </div>
          ) : (
            <ul className="space-y-4">
              {reservations.map((reservation) => (
                <li
                  key={reservation.id}
                  className="rounded-3xl border border-white/10 bg-linear-to-br from-zinc-800/60 via-zinc-900/70 to-zinc-950/90 p-5 backdrop-blur sm:p-6"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="space-y-1">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-pink-200">
                        {reservation.serviceName}
                      </p>
                      <h3 className="text-lg font-semibold text-white">
                        {new Date(reservation.scheduledAt).toLocaleDateString(
                          "fr-FR",
                          {
                            weekday: "long",
                            day: "numeric",
                            month: "long",
                            hour: "2-digit",
                            minute: "2-digit",
                          },
                        )}
                      </h3>
                      <p className="text-xs text-white/50">
                        {reservation.servicePrice.toLocaleString("fr-FR")} FCFA ·{" "}
                        {reservation.durationMin} min
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={cn(
                          "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] ring-1",
                          STATUS_CLASS[reservation.status],
                        )}
                      >
                        {reservation.status === "completed" ? (
                          <CheckCircle2 className="size-3" />
                        ) : (
                          <Clock4 className="size-3" />
                        )}
                        {STATUS_LABEL[reservation.status]}
                      </span>
                      {reservation.conversationId ? (
                        <Link
                          href="/client/messages"
                          className="inline-flex items-center gap-1.5 rounded-full border border-pink-400/25 bg-pink-400/10 px-3 py-1 text-xs font-semibold text-pink-100 transition-colors hover:bg-pink-400/20"
                        >
                          <MessageCircle className="size-3.5" />
                          Chat
                        </Link>
                      ) : null}
                    </div>
                  </div>

                  {reservation.review ? (
                    <div className="mt-4 rounded-2xl border border-emerald-400/20 bg-emerald-400/5 p-4">
                      <p className="flex items-center gap-1.5 text-sm font-semibold text-emerald-200">
                        <Star className="size-4 fill-current" />
                        Avis publié · {reservation.review.rating}/5
                      </p>
                      {reservation.review.comment ? (
                        <p className="mt-2 text-sm text-white/60">
                          {reservation.review.comment}
                        </p>
                      ) : null}
                    </div>
                  ) : reservation.status === "completed" ? (
                    <div className="mt-4">
                      <ReviewForm reservationId={reservation.id} />
                    </div>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </section>
      </section>
    </main>
  );
}
