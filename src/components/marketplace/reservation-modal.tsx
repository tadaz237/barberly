"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import {
  AlertCircle,
  ArrowLeft,
  CalendarCheck,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Loader2,
  MapPin,
  Phone,
  UserRound,
  X,
} from "lucide-react";

type Step = "date" | "slot" | "form" | "done";

type Props = {
  open: boolean;
  onClose: () => void;
  serviceId: string;
  serviceName: string;
  servicePrice: number;
  serviceDurationMin: number;
};

export function ReservationModal({
  open,
  onClose,
  serviceId,
  serviceName,
  servicePrice,
  serviceDurationMin,
}: Props) {
  const [step, setStep] = useState<Step>("date");
  const [monthCursor, setMonthCursor] = useState(() => firstDayOfMonth(new Date()));
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [slots, setSlots] = useState<string[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [form, setForm] = useState({
    clientName: "",
    clientAddress: "",
    clientPhone: "",
    notes: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onClose]);

  useEffect(() => {
    if (!selectedDate) return;
    setSlotsLoading(true);
    setSelectedSlot(null);
    setSlots([]);
    setError(null);
    const dayISO = selectedDate.toISOString();
    fetch(
      `/api/reservations/availability?service=${encodeURIComponent(
        serviceId,
      )}&date=${encodeURIComponent(dayISO)}`,
    )
      .then((r) => r.json())
      .then((data) => setSlots(Array.isArray(data.slots) ? data.slots : []))
      .catch(() => setError("Impossible de charger les créneaux."))
      .finally(() => setSlotsLoading(false));
  }, [selectedDate, serviceId]);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedSlot) return;
    setError(null);

    startTransition(async () => {
      try {
        const res = await fetch("/api/reservations", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            serviceId,
            scheduledAt: selectedSlot,
            clientName: form.clientName,
            clientAddress: form.clientAddress,
            clientPhone: form.clientPhone,
            notes: form.notes || undefined,
          }),
        });
        const payload = (await res.json().catch(() => null)) as
          | { message?: string }
          | null;
        if (!res.ok) {
          setError(payload?.message ?? "Réservation impossible.");
          return;
        }
        setSuccess(
          payload?.message ??
            "Réservation envoyée. Le coiffeur va confirmer rapidement.",
        );
        setStep("done");
      } catch {
        setError("Erreur réseau. Réessayez dans un instant.");
      }
    });
  }

  function reset() {
    setStep("date");
    setSelectedDate(null);
    setSelectedSlot(null);
    setSlots([]);
    setForm({ clientName: "", clientAddress: "", clientPhone: "", notes: "" });
    setError(null);
    setSuccess(null);
    onClose();
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-3 sm:p-6"
      onClick={reset}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl border border-white/10 bg-zinc-950 shadow-2xl sm:rounded-[2rem]"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-start justify-between gap-3 border-b border-white/10 px-5 py-4 sm:px-7 sm:py-5">
          <div className="space-y-1">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-pink-200">
              Réserver une prestation
            </p>
            <h2 className="text-lg font-semibold tracking-tight text-white sm:text-xl">
              {serviceName}
            </h2>
            <p className="text-xs text-white/55">
              {serviceDurationMin} min · {servicePrice.toLocaleString("fr-FR")} FCFA
            </p>
          </div>
          <button
            type="button"
            onClick={reset}
            aria-label="Fermer"
            className="inline-flex size-9 items-center justify-center rounded-full bg-white/5 text-white/70 transition-colors hover:bg-white/10 hover:text-white"
          >
            <X className="size-4" />
          </button>
        </header>

        <Stepper step={step} />

        <div className="flex-1 overflow-y-auto px-5 py-5 sm:px-7">
          {step === "date" ? (
            <DateStep
              monthCursor={monthCursor}
              setMonthCursor={setMonthCursor}
              selectedDate={selectedDate}
              onPick={(d) => {
                setSelectedDate(d);
                setStep("slot");
              }}
            />
          ) : null}

          {step === "slot" ? (
            <SlotStep
              date={selectedDate!}
              slots={slots}
              loading={slotsLoading}
              selectedSlot={selectedSlot}
              onPick={(slot) => setSelectedSlot(slot)}
              onContinue={() => setStep("form")}
              onBack={() => setStep("date")}
            />
          ) : null}

          {step === "form" ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <button
                type="button"
                onClick={() => setStep("slot")}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-white/55 hover:text-amber-200"
              >
                <ArrowLeft className="size-3.5" />
                Changer l&apos;horaire
              </button>

              {selectedDate && selectedSlot ? (
                <div className="rounded-2xl border border-pink-400/20 bg-pink-400/5 p-4 text-sm">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-pink-200">
                    Créneau choisi
                  </p>
                  <p className="mt-1 font-medium text-white">
                    {formatDateLong(new Date(selectedSlot))}
                  </p>
                  <p className="text-xs text-white/55">
                    Durée estimée : {serviceDurationMin} min
                  </p>
                </div>
              ) : null}

              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Votre nom complet" Icon={UserRound}>
                  <input
                    type="text"
                    value={form.clientName}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, clientName: e.target.value }))
                    }
                    required
                    placeholder="Awa Diallo"
                    className={inputClass}
                  />
                </Field>
                <Field label="Téléphone" Icon={Phone}>
                  <input
                    type="tel"
                    value={form.clientPhone}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, clientPhone: e.target.value }))
                    }
                    required
                    placeholder="+225 07 12 34 56 78"
                    className={inputClass}
                  />
                </Field>
              </div>

              <Field label="Adresse de la prestation" Icon={MapPin}>
                <input
                  type="text"
                  value={form.clientAddress}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, clientAddress: e.target.value }))
                  }
                  required
                  placeholder="Rue, numéro, quartier, ville…"
                  className={inputClass}
                />
              </Field>

              <Field label="Notes pour le coiffeur (optionnel)">
                <textarea
                  value={form.notes}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, notes: e.target.value }))
                  }
                  rows={3}
                  placeholder="Type de cheveux, attentes particulières…"
                  className={`${inputClass} min-h-20 py-2.5`}
                />
              </Field>

              {error ? (
                <div
                  role="alert"
                  className="flex items-start gap-3 rounded-2xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-200"
                >
                  <AlertCircle className="mt-0.5 size-4 shrink-0" />
                  <p>{error}</p>
                </div>
              ) : null}

              <button
                type="submit"
                disabled={isPending}
                className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-pink-400 px-5 text-sm font-semibold text-zinc-950 shadow-lg shadow-pink-500/30 transition-colors hover:bg-pink-300 disabled:opacity-60"
              >
                {isPending ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <>
                    <CalendarCheck className="size-4" />
                    Envoyer ma demande
                  </>
                )}
              </button>
            </form>
          ) : null}

          {step === "done" ? (
            <div className="space-y-4 text-center">
              <div className="mx-auto inline-flex size-14 items-center justify-center rounded-2xl bg-emerald-500/15 ring-1 ring-emerald-500/40">
                <CheckCircle2 className="size-7 text-emerald-300" />
              </div>
              <h3 className="text-xl font-semibold text-white">
                Demande envoyée !
              </h3>
              <p className="mx-auto max-w-md text-sm text-white/60">
                {success}
              </p>
              <button
                type="button"
                onClick={reset}
                className="inline-flex h-11 items-center justify-center rounded-2xl bg-pink-400 px-6 text-sm font-semibold text-zinc-950 hover:bg-pink-300"
              >
                Fermer
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function Stepper({ step }: { step: Step }) {
  const steps: { key: Step; label: string }[] = [
    { key: "date", label: "Date" },
    { key: "slot", label: "Horaire" },
    { key: "form", label: "Coordonnées" },
  ];
  const stepIndex =
    step === "done"
      ? 3
      : steps.findIndex((s) => s.key === step);
  return (
    <ol className="flex items-center gap-2 border-b border-white/10 px-5 py-3 text-[11px] sm:px-7">
      {steps.map((s, i) => {
        const active = i === stepIndex;
        const done = i < stepIndex;
        return (
          <li key={s.key} className="flex items-center gap-2">
            <span
              className={`inline-flex size-6 items-center justify-center rounded-full text-[10px] font-bold transition-colors ${
                done
                  ? "bg-pink-400 text-zinc-950"
                  : active
                    ? "bg-pink-400/20 text-pink-200 ring-2 ring-pink-400/50"
                    : "bg-white/5 text-white/45"
              }`}
            >
              {i + 1}
            </span>
            <span
              className={`font-semibold uppercase tracking-[0.18em] ${
                active || done ? "text-white/85" : "text-white/40"
              }`}
            >
              {s.label}
            </span>
            {i < steps.length - 1 ? (
              <span className="mx-1 size-1 rounded-full bg-white/15" />
            ) : null}
          </li>
        );
      })}
    </ol>
  );
}

function DateStep({
  monthCursor,
  setMonthCursor,
  selectedDate,
  onPick,
}: {
  monthCursor: Date;
  setMonthCursor: (d: Date) => void;
  selectedDate: Date | null;
  onPick: (d: Date) => void;
}) {
  const days = useMemo(() => buildMonthGrid(monthCursor), [monthCursor]);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => setMonthCursor(addMonths(monthCursor, -1))}
          aria-label="Mois précédent"
          className="inline-flex size-9 items-center justify-center rounded-full bg-white/5 text-white/70 transition-colors hover:bg-white/10 hover:text-white"
        >
          <ChevronLeft className="size-4" />
        </button>
        <p className="text-sm font-semibold capitalize text-white">
          {formatMonthYear(monthCursor)}
        </p>
        <button
          type="button"
          onClick={() => setMonthCursor(addMonths(monthCursor, 1))}
          aria-label="Mois suivant"
          className="inline-flex size-9 items-center justify-center rounded-full bg-white/5 text-white/70 transition-colors hover:bg-white/10 hover:text-white"
        >
          <ChevronRight className="size-4" />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-[10px] uppercase tracking-[0.12em] text-white/40">
        {["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"].map((d) => (
          <span key={d}>{d}</span>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {days.map(({ date, inMonth }, idx) => {
          const isPast = date < today;
          const isSelected =
            selectedDate &&
            selectedDate.toDateString() === date.toDateString();
          return (
            <button
              key={idx}
              type="button"
              onClick={() => !isPast && inMonth && onPick(date)}
              disabled={isPast || !inMonth}
              className={`aspect-square rounded-xl text-sm font-medium transition-colors ${
                !inMonth
                  ? "text-white/15"
                  : isPast
                    ? "text-white/25"
                    : isSelected
                      ? "bg-pink-400 text-zinc-950 shadow-lg shadow-pink-500/40"
                      : "bg-white/5 text-white/85 hover:bg-pink-400/15 hover:text-pink-100"
              }`}
            >
              {date.getDate()}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function SlotStep({
  date,
  slots,
  loading,
  selectedSlot,
  onPick,
  onContinue,
  onBack,
}: {
  date: Date;
  slots: string[];
  loading: boolean;
  selectedSlot: string | null;
  onPick: (slot: string) => void;
  onContinue: () => void;
  onBack: () => void;
}) {
  return (
    <div className="space-y-4">
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-1.5 text-xs font-medium text-white/55 hover:text-amber-200"
      >
        <ArrowLeft className="size-3.5" />
        Changer la date
      </button>

      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-pink-200">
          {formatDateLong(date)}
        </p>
        <p className="mt-1 text-xs text-white/55">
          Choisissez un créneau disponible.
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-10 text-white/55">
          <Loader2 className="mr-2 size-5 animate-spin" />
          Chargement…
        </div>
      ) : slots.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/15 bg-white/3 p-6 text-center text-sm text-white/55">
          Aucun créneau disponible ce jour-là. Essayez une autre date.
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
          {slots.map((iso) => {
            const t = new Date(iso);
            const active = selectedSlot === iso;
            return (
              <button
                key={iso}
                type="button"
                onClick={() => onPick(iso)}
                className={`rounded-xl border px-2 py-2 text-sm font-semibold transition-colors ${
                  active
                    ? "border-pink-400 bg-pink-400/20 text-pink-100"
                    : "border-white/10 bg-white/5 text-white/75 hover:border-pink-400/40 hover:text-pink-200"
                }`}
              >
                {t
                  .toLocaleTimeString("fr-FR", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })
                  .replace(":", "h")}
              </button>
            );
          })}
        </div>
      )}

      {slots.length > 0 ? (
        <button
          type="button"
          onClick={onContinue}
          disabled={!selectedSlot}
          className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-2xl bg-pink-400 text-sm font-semibold text-zinc-950 shadow-lg shadow-pink-500/30 hover:bg-pink-300 disabled:opacity-50"
        >
          Continuer
          <ChevronRight className="size-4" />
        </button>
      ) : null}
    </div>
  );
}

function Field({
  label,
  Icon,
  children,
}: {
  label: string;
  Icon?: typeof UserRound;
  children: React.ReactNode;
}) {
  return (
    <label className="grid gap-1.5 text-sm font-medium text-white/80">
      <span className="inline-flex items-center gap-1.5">
        {Icon ? <Icon className="size-3.5 text-pink-200/70" /> : null}
        {label}
      </span>
      {children}
    </label>
  );
}

const inputClass =
  "h-11 w-full rounded-xl border border-white/15 bg-white/5 px-3.5 text-sm text-white placeholder:text-white/35 shadow-inner shadow-black/20 transition-colors focus:border-pink-400/50 focus:outline-none focus:ring-2 focus:ring-pink-400/20";

function firstDayOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function addMonths(date: Date, months: number): Date {
  return new Date(date.getFullYear(), date.getMonth() + months, 1);
}

function buildMonthGrid(cursor: Date): { date: Date; inMonth: boolean }[] {
  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);

  // ISO weekday: 0 = Sunday in JS getDay(). We want Monday first → shift.
  const startOffset = (firstDay.getDay() + 6) % 7;
  const start = new Date(year, month, 1 - startOffset);

  const days: { date: Date; inMonth: boolean }[] = [];
  const totalCells = Math.ceil((startOffset + lastDay.getDate()) / 7) * 7;
  for (let i = 0; i < totalCells; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    days.push({ date: d, inMonth: d.getMonth() === month });
  }
  return days;
}

function formatMonthYear(date: Date): string {
  return date.toLocaleDateString("fr-FR", {
    month: "long",
    year: "numeric",
  });
}

function formatDateLong(date: Date): string {
  return date.toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
