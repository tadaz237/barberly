"use client";

import {
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
  useTransition,
} from "react";
import { createPortal } from "react-dom";
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
import {
  MARKETPLACE_TONES,
  getMarketplaceRoleLabel,
  getMarketplaceToneKey,
  type MarketplaceGender,
  type MarketplaceTone,
} from "@/src/components/marketplace/marketplace-theme";
import { cn } from "@/src/lib/utils";

type Step = "date" | "slot" | "form" | "done";

type Props = {
  open: boolean;
  onClose: () => void;
  serviceId: string;
  serviceName: string;
  servicePrice: number;
  serviceDurationMin: number;
  ownerGender?: MarketplaceGender;
  serviceCategory?: string;
};

function subscribeToClientMounted() {
  return () => {};
}

export function ReservationModal({
  open,
  onClose,
  serviceId,
  serviceName,
  servicePrice,
  serviceDurationMin,
  ownerGender,
  serviceCategory,
}: Props) {
  const mounted = useSyncExternalStore(
    subscribeToClientMounted,
    () => true,
    () => false,
  );
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
  const toneKey = getMarketplaceToneKey(ownerGender, serviceCategory);
  const tone = MARKETPLACE_TONES[toneKey];
  const roleLabel = getMarketplaceRoleLabel(toneKey);
  const inputClassName = cn(inputBaseClass, tone.focus);

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
    let ignore = false;
    const dayISO = selectedDate.toISOString();
    fetch(
      `/api/reservations/availability?service=${encodeURIComponent(
        serviceId,
      )}&date=${encodeURIComponent(dayISO)}`,
    )
      .then((r) => r.json())
      .then((data) => {
        if (!ignore) setSlots(Array.isArray(data.slots) ? data.slots : []);
      })
      .catch(() => {
        if (!ignore) setError("Impossible de charger les créneaux.");
      })
      .finally(() => {
        if (!ignore) setSlotsLoading(false);
      });
    return () => {
      ignore = true;
    };
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
            `Réservation envoyée. Votre ${roleLabel} va confirmer rapidement.`,
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

  if (!open || !mounted) return null;

  return createPortal(
    <div
      className="fixed inset-0 isolate z-[100] flex items-start justify-center overflow-y-auto bg-black/90 p-3 backdrop-blur-sm sm:items-center sm:p-6"
      onClick={reset}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="my-auto flex max-h-[calc(100dvh-1.5rem)] min-h-0 w-full max-w-2xl flex-col overflow-hidden rounded-3xl border border-white/10 bg-zinc-950 shadow-2xl sm:max-h-[calc(100dvh-3rem)] sm:rounded-[2rem]"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-start justify-between gap-3 border-b border-white/10 px-5 py-4 sm:px-7 sm:py-5">
          <div className="space-y-1">
            <p
              className={cn(
                "text-[11px] font-semibold uppercase tracking-[0.22em]",
                tone.text,
              )}
            >
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

        <Stepper step={step} tone={tone} />

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-5 sm:px-7">
          {step === "date" ? (
            <DateStep
              monthCursor={monthCursor}
              setMonthCursor={setMonthCursor}
              selectedDate={selectedDate}
              onPick={(d) => {
                setSelectedDate(d);
                setSelectedSlot(null);
                setSlots([]);
                setSlotsLoading(true);
                setError(null);
                setStep("slot");
              }}
              tone={tone}
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
              tone={tone}
            />
          ) : null}

          {step === "form" ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <button
                type="button"
                onClick={() => setStep("slot")}
                className={cn(
                  "inline-flex items-center gap-1.5 text-xs font-medium text-white/55",
                  tone.linkHover,
                )}
              >
                <ArrowLeft className="size-3.5" />
                Changer l&apos;horaire
              </button>

              {selectedDate && selectedSlot ? (
                <div className={cn("rounded-2xl border p-4 text-sm", tone.softPanel)}>
                  <p
                    className={cn(
                      "text-[11px] font-semibold uppercase tracking-[0.22em]",
                      tone.text,
                    )}
                  >
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
                <Field label="Votre nom complet" Icon={UserRound} tone={tone}>
                  <input
                    type="text"
                    value={form.clientName}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, clientName: e.target.value }))
                    }
                    required
                    placeholder="Awa Diallo"
                    className={inputClassName}
                  />
                </Field>
                <Field label="Téléphone" Icon={Phone} tone={tone}>
                  <input
                    type="tel"
                    value={form.clientPhone}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, clientPhone: e.target.value }))
                    }
                    required
                    placeholder="+225 07 12 34 56 78"
                    className={inputClassName}
                  />
                </Field>
              </div>

              <Field label="Adresse de la prestation" Icon={MapPin} tone={tone}>
                <input
                  type="text"
                  value={form.clientAddress}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, clientAddress: e.target.value }))
                  }
                  required
                  placeholder="Rue, numéro, quartier, ville…"
                  className={inputClassName}
                />
              </Field>

              <Field label={`Notes pour le ${roleLabel} (optionnel)`} tone={tone}>
                <textarea
                  value={form.notes}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, notes: e.target.value }))
                  }
                  rows={3}
                  placeholder="Type de cheveux, attentes particulières…"
                  className={cn(inputClassName, "min-h-20 py-2.5")}
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
                className={cn(
                  "inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl px-5 text-sm font-semibold shadow-lg transition-colors disabled:opacity-60",
                  tone.solidButton,
                )}
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
                className={cn(
                  "inline-flex h-11 items-center justify-center rounded-2xl px-6 text-sm font-semibold",
                  tone.solidButton,
                )}
              >
                Fermer
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </div>,
    document.body,
  );
}

function Stepper({ step, tone }: { step: Step; tone: MarketplaceTone }) {
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
    <ol className="flex items-center justify-between gap-1 border-b border-white/10 px-5 py-3 text-[11px] sm:justify-start sm:gap-2 sm:px-7">
      {steps.map((s, i) => {
        const active = i === stepIndex;
        const done = i < stepIndex;
        return (
          <li key={s.key} className="flex items-center gap-2">
            <span
              className={`inline-flex size-6 items-center justify-center rounded-full text-[10px] font-bold transition-colors ${
                done
                  ? tone.stepDone
                  : active
                    ? tone.stepActive
                    : "bg-white/5 text-white/45"
              }`}
            >
              {i + 1}
            </span>
            <span
              className={`font-semibold uppercase tracking-[0.18em] ${
                active || done ? "text-white/85" : "text-white/40"
              } hidden sm:inline`}
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
  tone,
}: {
  monthCursor: Date;
  setMonthCursor: (d: Date) => void;
  selectedDate: Date | null;
  onPick: (d: Date) => void;
  tone: MarketplaceTone;
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
                      ? tone.daySelected
                      : tone.dayIdle
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
  tone,
}: {
  date: Date;
  slots: string[];
  loading: boolean;
  selectedSlot: string | null;
  onPick: (slot: string) => void;
  onContinue: () => void;
  onBack: () => void;
  tone: MarketplaceTone;
}) {
  return (
    <div className="space-y-4">
      <button
        type="button"
        onClick={onBack}
        className={cn(
          "inline-flex items-center gap-1.5 text-xs font-medium text-white/55",
          tone.linkHover,
        )}
      >
        <ArrowLeft className="size-3.5" />
        Changer la date
      </button>

      <div>
        <p
          className={cn(
            "text-[11px] font-semibold uppercase tracking-[0.22em]",
            tone.text,
          )}
        >
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
                    ? tone.slotActive
                    : tone.slotIdle
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
          className={cn(
            "inline-flex h-11 w-full items-center justify-center gap-2 rounded-2xl text-sm font-semibold shadow-lg disabled:opacity-50",
            tone.solidButton,
          )}
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
  tone,
}: {
  label: string;
  Icon?: typeof UserRound;
  children: React.ReactNode;
  tone: MarketplaceTone;
}) {
  return (
    <label className="grid gap-1.5 text-sm font-medium text-white/80">
      <span className="inline-flex items-center gap-1.5">
        {Icon ? <Icon className={cn("size-3.5", tone.iconSoft)} /> : null}
        {label}
      </span>
      {children}
    </label>
  );
}

const inputBaseClass =
  "h-11 w-full rounded-xl border border-white/15 bg-white/5 px-3.5 text-sm text-white placeholder:text-white/35 shadow-inner shadow-black/20 transition-colors focus:outline-none focus:ring-2";

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
