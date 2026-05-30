"use client";

import { useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  CheckCircle2,
  Flower2,
  Loader2,
  Scissors,
  ShieldCheck,
  Sparkles,
  UserRound,
} from "lucide-react";
import {
  KYC_MIN_BIO_LENGTH,
  getAdultMaxBirthDate,
  normalizeKycInput,
  sanitizeCityInput,
  sanitizePersonNameInput,
  sanitizePhoneInput,
  sanitizePositiveIntegerInput,
  sanitizeServiceAreasInput,
  validateKycInput,
} from "@/src/lib/kyc-validation";

type Gender = "male" | "female";

type Specialty =
  | "tresses"
  | "coloration"
  | "enfants"
  | "coupe-homme"
  | "barbier"
  | "degrade"
  | "rasage"
  | "tonte"
  | "coupe-femme"
  | "brushing"
  | "lissages-soins"
  | "extensions"
  | "evenement"
  | "soins-cuir-chevelu";

const SPECIALTY_LABEL: Record<Specialty, string> = {
  "coupe-homme": "Coupe homme",
  barbier: "Barbier",
  degrade: "Dégradé",
  rasage: "Rasage traditionnel",
  tonte: "Tonte",
  "coupe-femme": "Coupe femme",
  brushing: "Brushing",
  tresses: "Tresses & protectrices",
  coloration: "Coloration",
  "lissages-soins": "Lissages & soins",
  "soins-cuir-chevelu": "Soins du cuir chevelu",
  extensions: "Extensions / mèches",
  evenement: "Mariage / événement",
  enfants: "Enfants",
};

const COIFFEUR_SPECIALTIES: Specialty[] = [
  "coupe-homme",
  "barbier",
  "degrade",
  "rasage",
  "tonte",
  "tresses",
  "coloration",
  "enfants",
];

const COIFFEUSE_SPECIALTIES: Specialty[] = [
  "coupe-femme",
  "brushing",
  "tresses",
  "coloration",
  "lissages-soins",
  "soins-cuir-chevelu",
  "extensions",
  "evenement",
  "enfants",
];

type FormState = {
  legalName: string;
  dateOfBirth: string;
  phone: string;
  city: string;
  specialties: Specialty[];
  experienceYears: string;
  bio: string;
  serviceAreas: string;
};

const initial: FormState = {
  legalName: "",
  dateOfBirth: "",
  phone: "",
  city: "",
  specialties: [],
  experienceYears: "",
  bio: "",
  serviceAreas: "",
};

type Submission =
  | { state: "idle" }
  | { state: "error"; message: string }
  | { state: "success"; message: string };

type InitialValues = Partial<FormState>;

type Props = {
  defaultName?: string;
  gender?: Gender | null;
  initialValues?: InitialValues;
  resubmission?: boolean;
};

export function KycForm({
  defaultName,
  gender: initialGender,
  initialValues,
  resubmission,
}: Props) {
  const router = useRouter();
  const [gender, setGender] = useState<Gender>(initialGender ?? "male");
  const [values, setValues] = useState<FormState>({
    ...initial,
    legalName: initialValues?.legalName ?? defaultName ?? "",
    dateOfBirth: initialValues?.dateOfBirth ?? "",
    phone: initialValues?.phone ?? "",
    city: initialValues?.city ?? "",
    specialties: initialValues?.specialties ?? [],
    experienceYears: initialValues?.experienceYears ?? "",
    bio: initialValues?.bio ?? "",
    serviceAreas: initialValues?.serviceAreas ?? "",
  });
  const [status, setStatus] = useState<Submission>({ state: "idle" });
  const [isPending, startTransition] = useTransition();

  const palette = gender === "female" ? PINK : AMBER;
  const specialtyList =
    gender === "female" ? COIFFEUSE_SPECIALTIES : COIFFEUR_SPECIALTIES;

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setValues((v) => ({ ...v, [key]: value }));
  }

  function toggleSpecialty(s: Specialty) {
    setValues((v) => ({
      ...v,
      specialties: v.specialties.includes(s)
        ? v.specialties.filter((x) => x !== s)
        : [...v.specialties, s],
    }));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus({ state: "idle" });

    if (values.specialties.length === 0) {
      setStatus({
        state: "error",
        message: "Sélectionnez au moins une spécialité.",
      });
      return;
    }

    const validationMessage = validateKycInput(values);
    if (validationMessage) {
      setStatus({ state: "error", message: validationMessage });
      return;
    }

    const normalizedValues = normalizeKycInput(values);

    startTransition(async () => {
      try {
        const res = await fetch("/api/kyc", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...normalizedValues,
            specialties: values.specialties,
            experienceYears: Number(normalizedValues.experienceYears || 0),
            gender,
          }),
        });
        const payload = (await res.json().catch(() => null)) as
          | { message?: string }
          | null;

        if (!res.ok) {
          setStatus({
            state: "error",
            message: payload?.message ?? "Soumission impossible.",
          });
          return;
        }

        setStatus({
          state: "success",
          message: payload?.message ?? "Profil envoyé.",
        });
        router.refresh();
        setTimeout(() => router.push("/admin"), 800);
      } catch {
        setStatus({
          state: "error",
          message: "Erreur réseau. Réessayez.",
        });
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {!initialGender ? (
        <Section
          index={1}
          Icon={gender === "female" ? Flower2 : Scissors}
          title="Vous êtes coiffeur ou coiffeuse ?"
          description="On adapte la liste de spécialités à votre univers."
          palette={palette}
        >
          <div className="grid gap-3 sm:grid-cols-2">
            {(
              [
                { value: "male", label: "Coiffeur", Icon: Scissors },
                { value: "female", label: "Coiffeuse", Icon: Flower2 },
              ] as const
            ).map(({ value, label, Icon }) => {
              const active = gender === value;
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => setGender(value)}
                  aria-pressed={active}
                  className={`flex items-center gap-3 rounded-2xl border px-4 py-3 text-sm font-medium transition-colors ${
                    active
                      ? value === "female"
                        ? "border-pink-400/50 bg-pink-400/10 text-pink-100"
                        : "border-amber-400/50 bg-amber-400/10 text-amber-100"
                      : "border-white/10 bg-white/5 text-white/60 hover:border-white/30 hover:text-white"
                  }`}
                >
                  <Icon className="size-4" />
                  {label}
                </button>
              );
            })}
          </div>
        </Section>
      ) : null}

      <Section
        index={initialGender ? 1 : 2}
        Icon={UserRound}
        title="Vos informations"
        description="Ces données apparaissent sur votre profil après validation."
        palette={palette}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label="Nom et prénom (état civil)"
            htmlFor="legalName"
            palette={palette}
            hint="Lettres, espaces, apostrophes et tirets uniquement."
          >
            <input
              id="legalName"
              type="text"
              value={values.legalName}
              onChange={(e) =>
                update("legalName", sanitizePersonNameInput(e.target.value))
              }
              required
              minLength={3}
              maxLength={80}
              autoComplete="name"
              placeholder="Awa Diallo"
              className={inputClass(palette)}
            />
          </Field>

          <Field label="Date de naissance" htmlFor="dateOfBirth" palette={palette}>
            <div className="w-full max-w-[13.5rem] min-w-0 sm:max-w-none">
              <input
                id="dateOfBirth"
                type="date"
                value={values.dateOfBirth}
                onChange={(e) => update("dateOfBirth", e.target.value)}
                required
                max={getAdultMaxBirthDate()}
                className={`${inputClass(palette)} min-w-0 max-w-full`}
              />
            </div>
          </Field>

          <Field
            label="Téléphone visible par vos clientes"
            htmlFor="phone"
            palette={palette}
            hint="Format accepté : chiffres, espaces, +, parenthèses et tirets."
          >
            <input
              id="phone"
              type="tel"
              value={values.phone}
              onChange={(e) => update("phone", sanitizePhoneInput(e.target.value))}
              required
              inputMode="tel"
              maxLength={20}
              autoComplete="tel"
              placeholder="+225 07 12 34 56 78"
              className={inputClass(palette)}
            />
          </Field>

          <Field label="Ville de résidence" htmlFor="city" palette={palette}>
            <input
              id="city"
              type="text"
              value={values.city}
              onChange={(e) => update("city", sanitizeCityInput(e.target.value))}
              required
              minLength={2}
              maxLength={60}
              autoComplete="address-level2"
              placeholder="Paris"
              className={inputClass(palette)}
            />
          </Field>
        </div>
      </Section>

      <Section
        index={initialGender ? 2 : 3}
        Icon={Sparkles}
        title="Votre profil pro"
        description="Aidez la clientèle à comprendre votre style et vos zones d'intervention."
        palette={palette}
      >
        <div className="space-y-2">
          <span className="text-sm font-medium text-white/80">Spécialités</span>
          <div className="flex flex-wrap gap-2">
            {specialtyList.map((s) => {
              const active = values.specialties.includes(s);
              return (
                <button
                  key={s}
                  type="button"
                  onClick={() => toggleSpecialty(s)}
                  aria-pressed={active}
                  className={`rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors ${
                    active
                      ? gender === "female"
                        ? "border-pink-400/50 bg-pink-400/15 text-pink-100"
                        : "border-amber-400/50 bg-amber-400/15 text-amber-100"
                      : "border-white/15 bg-white/5 text-white/65 hover:border-white/30 hover:text-white"
                  }`}
                >
                  {SPECIALTY_LABEL[s]}
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Années d'expérience" htmlFor="experienceYears" palette={palette}>
            <input
              id="experienceYears"
              type="number"
              min="0"
              max="80"
              value={values.experienceYears}
              onChange={(e) =>
                update(
                  "experienceYears",
                  sanitizePositiveIntegerInput(e.target.value),
                )
              }
              required
              inputMode="numeric"
              placeholder="5"
              className={inputClass(palette)}
            />
          </Field>

          <Field label="Zones d'intervention" htmlFor="serviceAreas" palette={palette}>
            <input
              id="serviceAreas"
              type="text"
              value={values.serviceAreas}
              onChange={(e) =>
                update("serviceAreas", sanitizeServiceAreasInput(e.target.value))
              }
              required
              minLength={3}
              maxLength={120}
              placeholder="Paris 11e, 12e, 20e"
              className={inputClass(palette)}
            />
          </Field>
        </div>

        <Field
          label="Présentation (visible sur votre profil public)"
          htmlFor="bio"
          palette={palette}
        >
          <textarea
            id="bio"
            value={values.bio}
            onChange={(e) => update("bio", e.target.value)}
            required
            minLength={KYC_MIN_BIO_LENGTH}
            maxLength={500}
            rows={4}
            placeholder="Votre approche, vos formations, ce qui vous distingue…"
            className={`${inputClass(palette)} min-h-24 py-2.5`}
          />
        </Field>
      </Section>

      {status.state === "error" ? (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-2xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-300"
        >
          <AlertCircle className="mt-0.5 size-4 shrink-0" />
          <p>{status.message}</p>
        </div>
      ) : null}

      {status.state === "success" ? (
        <div
          role="status"
          className="flex items-start gap-3 rounded-2xl border border-emerald-400/30 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-200"
        >
          <CheckCircle2 className="mt-0.5 size-4 shrink-0" />
          <p>{status.message}</p>
        </div>
      ) : null}

      <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-white/45">
          <ShieldCheck className={`mr-1 inline-block size-3.5 ${palette.textSoft}`} />
          Vos informations sont conservées en interne pour la validation de
          votre profil.
        </p>

        <button
          type="submit"
          disabled={isPending}
          className={`inline-flex h-12 items-center justify-center gap-2 rounded-2xl px-6 text-sm font-semibold shadow-lg transition-colors disabled:opacity-60 ${palette.button}`}
        >
          {isPending ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Envoi…
            </>
          ) : (
            <>
              <ShieldCheck className="size-4" />
              {resubmission ? "Renvoyer mon dossier" : "Envoyer mon dossier"}
            </>
          )}
        </button>
      </div>
    </form>
  );
}

type Palette = {
  icon: string;
  pill: string;
  textSoft: string;
  focusBorder: string;
  focusRing: string;
  button: string;
};

const AMBER: Palette = {
  icon: "bg-amber-400/15 ring-amber-400/30 text-amber-200",
  pill: "text-amber-200",
  textSoft: "text-amber-300",
  focusBorder: "focus:border-amber-400/50",
  focusRing: "focus:ring-amber-400/20",
  button:
    "bg-amber-400 text-amber-950 shadow-amber-500/30 hover:bg-amber-300",
};

const PINK: Palette = {
  icon: "bg-pink-400/15 ring-pink-400/30 text-pink-200",
  pill: "text-pink-200",
  textSoft: "text-pink-300",
  focusBorder: "focus:border-pink-400/50",
  focusRing: "focus:ring-pink-400/20",
  button:
    "bg-pink-400 text-pink-950 shadow-pink-500/30 hover:bg-pink-300",
};

function inputClass(palette: Palette) {
  return `h-11 w-full min-w-0 rounded-xl border border-white/15 bg-white/5 px-3.5 text-sm text-white placeholder:text-white/35 shadow-inner shadow-black/20 transition-colors ${palette.focusBorder} focus:outline-none focus:ring-2 ${palette.focusRing}`;
}

function Field({
  label,
  htmlFor,
  children,
  palette,
  hint,
}: {
  label: string;
  htmlFor: string;
  children: React.ReactNode;
  palette: Palette;
  hint?: string;
}) {
  return (
    <label
      htmlFor={htmlFor}
      className="grid gap-1.5 text-sm font-medium text-white/80"
    >
      <span>{label}</span>
      {children}
      {hint ? <span className="text-xs font-normal text-white/40">{hint}</span> : null}
      <span aria-hidden className={`hidden ${palette.textSoft}`} />
    </label>
  );
}

type IconType = typeof UserRound;

function Section({
  index,
  Icon,
  title,
  description,
  children,
  palette,
}: {
  index: number;
  Icon: IconType;
  title: string;
  description: string;
  children: React.ReactNode;
  palette: Palette;
}) {
  return (
    <section className="space-y-5 rounded-3xl border border-white/10 bg-linear-to-br from-zinc-800/60 via-zinc-900/70 to-zinc-950/90 p-5 shadow-[0_10px_40px_-12px_rgba(0,0,0,0.6)] backdrop-blur-xl sm:rounded-[2rem] sm:p-7">
      <header className="flex items-start gap-4">
        <span
          className={`flex size-10 shrink-0 items-center justify-center rounded-2xl ring-1 ${palette.icon}`}
        >
          <Icon className="size-5" />
        </span>
        <div className="flex-1 space-y-1">
          <p
            className={`text-[11px] font-semibold uppercase tracking-[0.22em] ${palette.pill}`}
          >
            Étape {index}
          </p>
          <h2 className="text-lg font-semibold tracking-tight text-white sm:text-xl">
            {title}
          </h2>
          <p className="text-sm text-white/55">{description}</p>
        </div>
      </header>
      <div className="space-y-4">{children}</div>
    </section>
  );
}
