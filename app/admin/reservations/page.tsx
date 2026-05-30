import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowLeft,
  CalendarCheck,
  CheckCircle2,
  Clock4,
  MapPin,
  Phone,
  ShieldX,
  Sparkles,
} from "lucide-react";
import { ReservationStatusActions } from "@/src/components/admin/reservation-status-actions";
import { auth } from "@/src/lib/auth";
import {
  getReservationsForCoiffeur,
  type ReservationStatus,
} from "@/src/lib/reservations-store";

const STATUS_LABEL: Record<ReservationStatus, string> = {
  pending: "En attente",
  confirmed: "Confirmée",
  cancelled: "Annulée",
  completed: "Terminée",
};

const STATUS_PILL: Record<ReservationStatus, string> = {
  pending:
    "bg-blue-500/15 text-blue-300 ring-1 ring-blue-500/30",
  confirmed:
    "bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-500/30",
  cancelled: "bg-red-500/15 text-red-300 ring-1 ring-red-500/30",
  completed:
    "bg-amber-500/15 text-amber-300 ring-1 ring-amber-500/30",
};

export default async function AdminReservationsPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login?callbackUrl=/admin/reservations");
  }

  const reservations = await getReservationsForCoiffeur(session.user.id);

  const now = Date.now();
  const upcoming = reservations.filter(
    (r) =>
      new Date(r.scheduledAt).getTime() >= now &&
      (r.status === "pending" || r.status === "confirmed"),
  );
  const past = reservations.filter(
    (r) =>
      r.status === "completed" ||
      r.status === "cancelled" ||
      new Date(r.scheduledAt).getTime() < now,
  );

  const pendingCount = reservations.filter((r) => r.status === "pending").length;

  return (
    <main className="relative min-h-screen overflow-hidden bg-black text-white">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.04)_1px,transparent_1px)] bg-size-[56px_56px] opacity-60"
      />

      <div className="relative mx-auto w-full max-w-5xl space-y-8 px-4 py-6 sm:px-6 sm:py-10 lg:px-8 lg:py-12">
        <Link
          href="/admin"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-white/60 transition-colors hover:text-amber-200 sm:text-sm"
        >
          <ArrowLeft className="size-4" />
          Retour au tableau de bord
        </Link>

        <header className="space-y-3">
          <span className="inline-flex items-center gap-2 rounded-full border border-pink-400/30 bg-pink-400/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.22em] text-pink-200">
            <CalendarCheck className="size-3.5" />
            Mes réservations
          </span>
          <h1 className="text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
            Suivez vos rendez-vous et gérez les demandes.
          </h1>
          <p className="max-w-2xl text-sm text-white/55">
            {reservations.length} réservation
            {reservations.length > 1 ? "s" : ""} au total ·{" "}
            {pendingCount > 0 ? (
              <strong className="text-amber-200">
                {pendingCount} en attente de votre confirmation
              </strong>
            ) : (
              "Aucune demande en attente."
            )}
          </p>
        </header>

        <Section title="À venir" count={upcoming.length}>
          {upcoming.length === 0 ? (
            <EmptyState message="Aucun rendez-vous prévu pour le moment." />
          ) : (
            <ul className="space-y-3">
              {upcoming.map((r) => (
                <ReservationCard key={r.id} reservation={r} />
              ))}
            </ul>
          )}
        </Section>

        <Section title="Historique" count={past.length}>
          {past.length === 0 ? (
            <EmptyState message="Pas encore d'historique." />
          ) : (
            <ul className="space-y-3">
              {past.map((r) => (
                <ReservationCard key={r.id} reservation={r} />
              ))}
            </ul>
          )}
        </Section>
      </div>
    </main>
  );

  function ReservationCard({
    reservation,
  }: {
    reservation: (typeof reservations)[number];
  }) {
    const date = new Date(reservation.scheduledAt);
    return (
      <li className="overflow-hidden rounded-3xl border border-white/10 bg-linear-to-br from-zinc-800/60 via-zinc-900/70 to-zinc-950/90 p-5 backdrop-blur sm:rounded-[2rem] sm:p-6">
        <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-pink-200">
              {reservation.serviceName}
            </p>
            <h3 className="text-lg font-semibold tracking-tight text-white">
              {reservation.clientName}
            </h3>
            <p className="text-xs text-white/55">
              {reservation.servicePrice.toLocaleString("fr-FR")} FCFA ·{" "}
              {reservation.durationMin} min
            </p>
          </div>

          <div className="flex flex-col items-start gap-2 sm:items-end">
            <span
              className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] ${STATUS_PILL[reservation.status]}`}
            >
              <StatusIcon status={reservation.status} />
              {STATUS_LABEL[reservation.status]}
            </span>
            <p className="inline-flex items-center gap-1.5 text-xs font-medium text-white/75">
              <Clock4 className="size-3.5 text-pink-300" />
              {date.toLocaleDateString("fr-FR", {
                weekday: "short",
                day: "numeric",
                month: "short",
              })}{" "}
              ·{" "}
              {date
                .toLocaleTimeString("fr-FR", {
                  hour: "2-digit",
                  minute: "2-digit",
                })
                .replace(":", "h")}
            </p>
          </div>
        </header>

        <div className="mt-4 grid gap-3 text-xs text-white/65 sm:grid-cols-2">
          <p className="inline-flex items-start gap-1.5">
            <Phone className="mt-0.5 size-3.5 text-pink-300" />
            <a
              href={`tel:${reservation.clientPhone}`}
              className="hover:text-white"
            >
              {reservation.clientPhone}
            </a>
          </p>
          <p className="inline-flex items-start gap-1.5">
            <MapPin className="mt-0.5 size-3.5 text-pink-300" />
            {reservation.clientAddress}
          </p>
        </div>

        {reservation.notes ? (
          <p className="mt-3 rounded-2xl border border-white/10 bg-white/5 p-3 text-xs leading-5 text-white/65">
            <span className="font-semibold text-white/80">Note du client : </span>
            {reservation.notes}
          </p>
        ) : null}

        <div className="mt-4">
          <ReservationStatusActions
            reservationId={reservation.id}
            currentStatus={reservation.status}
          />
        </div>
      </li>
    );
  }
}

function StatusIcon({ status }: { status: ReservationStatus }) {
  if (status === "confirmed")
    return <CheckCircle2 className="size-3" />;
  if (status === "completed") return <Sparkles className="size-3" />;
  if (status === "cancelled") return <ShieldX className="size-3" />;
  return <Clock4 className="size-3" />;
}

function Section({
  title,
  count,
  children,
}: {
  title: string;
  count: number;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-3">
      <header className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-white sm:text-xl">
          {title}
        </h2>
        <span className="text-xs text-white/45">{count} élément{count > 1 ? "s" : ""}</span>
      </header>
      {children}
    </section>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="rounded-3xl border border-dashed border-white/15 bg-white/3 p-6 text-center text-sm text-white/55 backdrop-blur">
      {message}
    </div>
  );
}
