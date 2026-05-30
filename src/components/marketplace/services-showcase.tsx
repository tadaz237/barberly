"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  ChevronDown,
  Clock3,
  Crown,
  LocateFixed,
  MapPin,
  Navigation,
  Scissors,
  Search,
  Sparkles,
  Star,
  TrendingUp,
  X,
} from "lucide-react";
import type { ServiceItem } from "@/src/lib/services-store";
import { ImageLightbox } from "@/src/components/ui/image-lightbox";

type ServicesResponse = {
  services: ServiceItem[];
};

type SortKey = "featured" | "price-asc" | "price-desc" | "duration-asc";
type NearbySortKey = SortKey | "distance";
type UserLocation = { latitude: number; longitude: number };

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: "featured", label: "Recommandés" },
  { value: "price-asc", label: "Prix croissant" },
  { value: "price-desc", label: "Prix décroissant" },
  { value: "duration-asc", label: "Durée courte" },
];

const RADIUS_OPTIONS = [5, 10, 20, 50];
const AUDIENCE_CATEGORY_KEYS = new Set([
  "homme",
  "femme",
  "coiffure homme",
  "coiffure femme",
  "coupe homme",
  "coupe femme",
]);

function normalizeFilterLabel(value: string) {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ");
}

function isAudienceCategory(category: string) {
  return AUDIENCE_CATEGORY_KEYS.has(normalizeFilterLabel(category));
}

function hasServiceCoordinates(service: ServiceItem) {
  return (
    typeof service.latitude === "number" &&
    Number.isFinite(service.latitude) &&
    typeof service.longitude === "number" &&
    Number.isFinite(service.longitude)
  );
}

function distanceKm(from: UserLocation, service: ServiceItem) {
  if (!hasServiceCoordinates(service)) return null;

  const earthRadiusKm = 6371;
  const toRad = (value: number) => (value * Math.PI) / 180;
  const dLat = toRad((service.latitude as number) - from.latitude);
  const dLng = toRad((service.longitude as number) - from.longitude);
  const lat1 = toRad(from.latitude);
  const lat2 = toRad(service.latitude as number);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1) *
      Math.cos(lat2) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return earthRadiusKm * c;
}

function formatDistance(value: number) {
  if (value < 1) return `${Math.round(value * 1000)} m`;
  if (value < 10) return `${value.toFixed(1).replace(".", ",")} km`;
  return `${Math.round(value)} km`;
}

export function ServicesShowcase() {
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [activeGender, setActiveGender] = useState<"all" | "male" | "female">("all");
  const [sort, setSort] = useState<NearbySortKey>("featured");
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [nearbyEnabled, setNearbyEnabled] = useState(false);
  const [radiusKm, setRadiusKm] = useState(20);
  const [locating, setLocating] = useState(false);
  const [locationMessage, setLocationMessage] = useState<string | null>(null);

  useEffect(() => {
    void loadServices();
  }, []);

  async function loadServices() {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch("/api/services", { cache: "no-store" });
      if (!response.ok) {
        throw new Error("Impossible de charger les services pour le moment.");
      }
      const data = (await response.json()) as ServicesResponse;
      setServices(data.services ?? []);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Erreur inattendue lors du chargement."
      );
    } finally {
      setLoading(false);
    }
  }

  const categories = useMemo(() => {
    const set = new Set<string>();
    services.forEach((s) => {
      if (!isAudienceCategory(s.category)) {
        set.add(s.category);
      }
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [services]);

  const locations = useMemo(
    () => new Set(services.map((s) => s.city)).size,
    [services]
  );

  const geolocatedServices = useMemo(
    () => services.filter(hasServiceCoordinates).length,
    [services]
  );

  const distanceByServiceId = useMemo(() => {
    const distances = new Map<string, number>();
    if (!userLocation) return distances;

    services.forEach((service) => {
      const distance = distanceKm(userLocation, service);
      if (distance !== null) {
        distances.set(service.id, distance);
      }
    });

    return distances;
  }, [services, userLocation]);

  const filtered = useMemo(() => {
    let result = services;

    if (query.trim()) {
      const q = query.trim().toLowerCase();
      result = result.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.description.toLowerCase().includes(q) ||
          s.city.toLowerCase().includes(q) ||
          s.neighborhood.toLowerCase().includes(q) ||
          s.category.toLowerCase().includes(q)
      );
    }

    if (activeCategory !== "all") {
      result = result.filter((s) => s.category === activeCategory);
    }

    if (activeGender !== "all") {
      result = result.filter((s) => s.ownerGender === activeGender);
    }

    if (nearbyEnabled && userLocation) {
      result = result.filter((s) => {
        const distance = distanceByServiceId.get(s.id);
        return distance !== undefined && distance <= radiusKm;
      });
    }

    switch (sort) {
      case "distance":
        return [...result].sort((a, b) => {
          const distanceA = distanceByServiceId.get(a.id) ?? Number.POSITIVE_INFINITY;
          const distanceB = distanceByServiceId.get(b.id) ?? Number.POSITIVE_INFINITY;
          return distanceA - distanceB;
        });
      case "price-asc":
        return [...result].sort((a, b) => a.price - b.price);
      case "price-desc":
        return [...result].sort((a, b) => b.price - a.price);
      case "duration-asc":
        return [...result].sort((a, b) => a.duration - b.duration);
      case "featured":
      default:
        return [...result].sort(
          (a, b) => Number(Boolean(b.featured)) - Number(Boolean(a.featured))
        );
    }
  }, [
    services,
    query,
    activeCategory,
    activeGender,
    nearbyEnabled,
    userLocation,
    distanceByServiceId,
    radiusKm,
    sort,
  ]);

  const hasFilter =
    query.trim().length > 0 ||
    activeCategory !== "all" ||
    activeGender !== "all" ||
    nearbyEnabled;

  function resetFilters() {
    setQuery("");
    setActiveCategory("all");
    setActiveGender("all");
    setNearbyEnabled(false);
    setSort("featured");
  }

  function enableNearbySearch() {
    if (nearbyEnabled) {
      setNearbyEnabled(false);
      if (sort === "distance") setSort("featured");
      return;
    }

    if (userLocation) {
      setNearbyEnabled(true);
      setSort("distance");
      setLocationMessage(null);
      return;
    }

    if (!("geolocation" in navigator)) {
      setLocationMessage("La géolocalisation n'est pas disponible sur ce navigateur.");
      return;
    }

    setLocating(true);
    setLocationMessage(null);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
        setNearbyEnabled(true);
        setSort("distance");
        setLocating(false);
      },
      () => {
        setLocationMessage(
          "Position indisponible. Autorisez la localisation pour voir les pros proches."
        );
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  }

  return (
    <div className="space-y-8 sm:space-y-12">
      <section className="grid gap-6 border-b border-white/10 pb-6 sm:pb-8 lg:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)] lg:items-end">
        <div className="space-y-5 sm:space-y-6">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.25em] text-white/70 backdrop-blur">
            <Sparkles className="size-3.5" />
            Beauté à domicile
          </span>

          <div className="space-y-3">
            <h1 className="text-balance text-3xl font-semibold tracking-tight text-white sm:text-4xl lg:text-5xl">
              Trouvez le coiffeur qui vient{" "}
              <span className="bg-linear-to-r from-pink-300 via-fuchsia-300 to-purple-300 bg-clip-text text-transparent">
                à votre porte
              </span>
              .
            </h1>
            <p className="max-w-2xl text-sm leading-6 text-white/60 sm:text-base sm:leading-7">
              Comparez les prestations, les tarifs et les zones d&apos;intervention.
              Réservez en quelques clics auprès d&apos;un pro de confiance.
            </p>
          </div>

          <SearchBar value={query} onChange={setQuery} />

          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-white/50">
            <span>{services.length} prestations</span>
            <span aria-hidden className="size-1 rounded-full bg-white/20" />
            <span>{locations} zones desservies</span>
            <span aria-hidden className="size-1 rounded-full bg-white/20" />
            <span>{geolocatedServices} avec position</span>
            <span aria-hidden className="size-1 rounded-full bg-white/20" />
            <span>Réservation directe</span>
          </div>
        </div>
        <NearbyPanel
          enabled={nearbyEnabled}
          locating={locating}
          radiusKm={radiusKm}
          locationMessage={locationMessage}
          userLocation={userLocation}
          onToggle={enableNearbySearch}
          onRadiusChange={setRadiusKm}
        />
      </section>

      <Filters
        categories={categories}
        activeCategory={activeCategory}
        onCategoryChange={setActiveCategory}
        activeGender={activeGender}
        onGenderChange={setActiveGender}
        sort={sort}
        onSortChange={setSort}
        nearbyEnabled={nearbyEnabled}
        hasLocation={Boolean(userLocation)}
      />

      <section className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm text-white/60">
            {loading
              ? "Chargement…"
              : `${filtered.length} prestation${filtered.length > 1 ? "s" : ""} ${filtered.length > 1 ? "trouvées" : "trouvée"}`}
          </p>
          {hasFilter && !loading ? (
            <button
              type="button"
              onClick={resetFilters}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-pink-200 hover:text-pink-100"
            >
              <X className="size-3.5" />
              Effacer les filtres
            </button>
          ) : null}
        </div>

        {loading ? (
          <SkeletonGrid />
        ) : error ? (
          <ErrorBox message={error} onRetry={loadServices} />
        ) : filtered.length === 0 ? (
          <EmptyState hasFilter={hasFilter} onReset={resetFilters} />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((service) => (
              <ServiceCard
                key={service.id}
                service={service}
                distance={
                  userLocation ? distanceByServiceId.get(service.id) : undefined
                }
              />
            ))}
          </div>
        )}
      </section>

      <ProCta />
    </div>
  );
}

function NearbyPanel({
  enabled,
  locating,
  radiusKm,
  locationMessage,
  userLocation,
  onToggle,
  onRadiusChange,
}: {
  enabled: boolean;
  locating: boolean;
  radiusKm: number;
  locationMessage: string | null;
  userLocation: UserLocation | null;
  onToggle: () => void;
  onRadiusChange: (value: number) => void;
}) {
  return (
    <div className="rounded-3xl border border-emerald-400/25 bg-emerald-400/10 p-4 shadow-[0_18px_50px_-28px_rgba(52,211,153,0.55)] sm:p-5">
      <div className="flex items-start gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-emerald-400/15 ring-1 ring-emerald-300/25">
          <Navigation className="size-5 text-emerald-200" />
        </span>
        <div className="min-w-0 flex-1 space-y-3">
          <div className="space-y-1">
            <p className="text-sm font-semibold text-white">Trouver près de moi</p>
            <p className="text-xs leading-5 text-white/55">
              Classe les prestations géolocalisées autour de votre position.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={onToggle}
              disabled={locating}
              className={`inline-flex h-10 items-center gap-2 rounded-2xl px-4 text-sm font-semibold transition-colors disabled:opacity-60 ${
                enabled
                  ? "bg-emerald-300 text-emerald-950 hover:bg-emerald-200"
                  : "border border-emerald-300/30 bg-emerald-300/10 text-emerald-100 hover:bg-emerald-300/15"
              }`}
            >
              <LocateFixed className="size-4" />
              {locating ? "Recherche..." : enabled ? "Proximité activée" : "Activer"}
            </button>
            <select
              value={radiusKm}
              onChange={(event) => onRadiusChange(Number(event.target.value))}
              disabled={!enabled}
              className="h-10 rounded-2xl border border-white/15 bg-white/5 px-3 text-sm font-medium text-white shadow-inner shadow-black/20 outline-none disabled:opacity-50"
              aria-label="Rayon de recherche"
            >
              {RADIUS_OPTIONS.map((radius) => (
                <option key={radius} value={radius} className="bg-zinc-900">
                  {radius} km
                </option>
              ))}
            </select>
          </div>

          {userLocation && enabled ? (
            <p className="text-xs text-emerald-100/70">
              Rayon actif : {radiusKm} km autour de votre position.
            </p>
          ) : null}

          {locationMessage ? (
            <p className="text-xs leading-5 text-amber-200">{locationMessage}</p>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function SearchBar({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="relative max-w-xl">
      <Search className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-white/40" />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Rechercher un service, une catégorie, une zone…"
        className="h-12 w-full rounded-2xl border border-white/15 bg-white/5 pr-12 pl-11 text-sm text-white placeholder:text-white/40 shadow-inner shadow-black/20 backdrop-blur transition-colors focus:border-pink-400/40 focus:outline-none focus:ring-2 focus:ring-pink-400/20"
      />
      {value ? (
        <button
          type="button"
          onClick={() => onChange("")}
          aria-label="Effacer la recherche"
          className="absolute top-1/2 right-3 flex size-7 -translate-y-1/2 items-center justify-center rounded-lg text-white/40 transition-colors hover:bg-white/5 hover:text-white/80"
        >
          <X className="size-4" />
        </button>
      ) : null}
    </div>
  );
}

function Filters({
  categories,
  activeCategory,
  onCategoryChange,
  activeGender,
  onGenderChange,
  sort,
  onSortChange,
  nearbyEnabled,
  hasLocation,
}: {
  categories: string[];
  activeCategory: string;
  onCategoryChange: (c: string) => void;
  activeGender: "all" | "male" | "female";
  onGenderChange: (g: "all" | "male" | "female") => void;
  sort: NearbySortKey;
  onSortChange: (s: NearbySortKey) => void;
  nearbyEnabled: boolean;
  hasLocation: boolean;
}) {
  const sortOptions: { value: NearbySortKey; label: string }[] =
    nearbyEnabled && hasLocation
      ? [{ value: "distance", label: "Plus proches" }, ...SORT_OPTIONS]
      : SORT_OPTIONS;

  return (
    <div className="rounded-3xl border border-white/10 bg-zinc-950/70 p-4 shadow-[0_16px_50px_-30px_rgba(0,0,0,0.9)] backdrop-blur sm:p-5">
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[10px] font-semibold uppercase tracking-[0.22em] text-white/40">
            Univers
          </span>
          <GenderChip
            label="Tous"
            active={activeGender === "all"}
            tone="neutral"
            onClick={() => onGenderChange("all")}
          />
          <GenderChip
            label="Femme"
            active={activeGender === "female"}
            tone="pink"
            onClick={() => onGenderChange("female")}
          />
          <GenderChip
            label="Homme"
            active={activeGender === "male"}
            tone="amber"
            onClick={() => onGenderChange("male")}
          />
        </div>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          {categories.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {categories.map((c) => (
                <CategoryChip
                  key={c}
                  label={c}
                  active={activeCategory === c}
                  onClick={() => onCategoryChange(c)}
                />
              ))}
            </div>
          ) : null}

          <div className="relative shrink-0">
            <label htmlFor="marketplace-sort" className="sr-only">
              Trier
            </label>
            <select
              id="marketplace-sort"
              value={sort}
              onChange={(e) => onSortChange(e.target.value as NearbySortKey)}
              className="h-10 w-full cursor-pointer appearance-none rounded-xl border border-white/15 bg-white/5 pr-9 pl-4 text-sm font-medium text-white shadow-inner shadow-black/20 backdrop-blur transition-colors focus:border-pink-400/40 focus:outline-none focus:ring-2 focus:ring-pink-400/20 sm:w-auto"
            >
              {sortOptions.map((opt) => (
                <option key={opt.value} value={opt.value} className="bg-zinc-900">
                  {opt.label}
                </option>
              ))}
            </select>
            <ChevronDown
              aria-hidden
              className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-white/40"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function GenderChip({
  label,
  active,
  tone,
  onClick,
}: {
  label: string;
  active: boolean;
  tone: "neutral" | "pink" | "amber";
  onClick: () => void;
}) {
  const palette =
    active && tone === "pink"
      ? "border-pink-400/50 bg-pink-400/15 text-pink-100 shadow-[0_0_20px_-4px_rgba(244,114,182,0.4)]"
      : active && tone === "amber"
        ? "border-amber-400/50 bg-amber-400/15 text-amber-100 shadow-[0_0_20px_-4px_rgba(251,191,36,0.4)]"
        : active
          ? "border-white/30 bg-white/10 text-white"
          : "border-white/15 bg-white/5 text-white/65 hover:border-white/30 hover:text-white";
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-all ${palette}`}
    >
      {label}
    </button>
  );
}

function CategoryChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`rounded-full border px-4 py-1.5 text-xs font-medium transition-all ${
        active
          ? "border-pink-400/40 bg-pink-400/15 text-pink-200 shadow-[0_0_20px_-4px_rgba(244,114,182,0.4)]"
          : "border-white/15 bg-white/5 text-white/65 hover:border-white/30 hover:text-white"
      }`}
    >
      {label}
    </button>
  );
}

function ServiceCard({
  service,
  distance,
}: {
  service: ServiceItem;
  distance?: number;
}) {
  return (
    <Link
      href={`/marketplace/${service.id}`}
      className="group/card relative flex h-full flex-col overflow-hidden rounded-3xl border border-white/10 bg-linear-to-br from-zinc-800/60 via-zinc-900/70 to-zinc-950/90 shadow-[0_10px_40px_-12px_rgba(0,0,0,0.7),inset_0_1px_0_rgba(255,255,255,0.06)] backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:border-pink-400/30 hover:shadow-[0_24px_60px_-12px_rgba(244,114,182,0.25),inset_0_1px_0_rgba(255,255,255,0.1)]"
    >
      <div className="relative h-40 overflow-hidden bg-linear-to-br from-pink-400/20 via-fuchsia-500/10 to-purple-600/5">
        {service.image ? (
          <ImageLightbox src={service.image} alt={service.name}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={service.image}
              alt=""
              className="h-40 w-full object-cover transition-transform duration-500 group-hover/card:scale-105"
            />
          </ImageLightbox>
        ) : (
          <div className="flex size-full items-center justify-center">
            <Scissors className="relative size-12 text-pink-200/40 drop-shadow-[0_0_12px_rgba(244,114,182,0.4)]" />
          </div>
        )}
        <span
          aria-hidden
          className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-linear-to-t from-zinc-950/80 to-transparent"
        />
        <div className="absolute top-3 right-3 flex flex-col items-end gap-1.5">
          {service.featured ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-400 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-zinc-950 shadow-lg shadow-amber-500/30">
              <Star className="size-3 fill-current" />
              Vedette
            </span>
          ) : null}
          <OwnerPlanPill plan={service.ownerPlan} />
        </div>
        <span className="absolute top-3 left-3 inline-flex rounded-full bg-zinc-950/70 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/80 backdrop-blur">
          {service.category}
        </span>
      </div>

      <div className="flex flex-1 flex-col gap-3 p-5">
        <h3 className="text-base font-semibold tracking-tight text-white">
          {service.name}
        </h3>

        <p className="line-clamp-2 text-xs leading-5 text-white/55">
          {service.description}
        </p>

        <div className="mt-auto space-y-3 pt-2">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-white/55">
            <span className="inline-flex items-center gap-1.5">
              <MapPin className="size-3.5 text-pink-300/80" />
              {service.city} · {service.neighborhood}
            </span>
            {distance !== undefined ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-400/10 px-2 py-1 text-emerald-100">
                <Navigation className="size-3.5 text-emerald-200" />
                {formatDistance(distance)}
              </span>
            ) : null}
            <span className="inline-flex items-center gap-1.5">
              <Clock3 className="size-3.5 text-pink-300/80" />
              {service.duration} min
            </span>
          </div>

          <div className="flex items-center justify-between gap-2 border-t border-white/10 pt-3">
            <div className="space-y-0.5">
              <p className="text-[10px] uppercase tracking-[0.2em] text-white/40">
                À partir de
              </p>
              <p className="text-xl font-semibold text-white">
                {service.price.toLocaleString("fr-FR")}
                <span className="ml-1 text-sm text-white/60">FCFA</span>
              </p>
            </div>
            <span className="inline-flex items-center gap-1.5 rounded-xl bg-pink-400 px-3.5 py-2 text-xs font-semibold text-zinc-950 shadow-lg shadow-pink-500/20 transition-colors group-hover/card:bg-pink-300">
              Réserver
              <ArrowRight className="size-3.5" />
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}

function SkeletonGrid() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="overflow-hidden rounded-3xl border border-white/10 bg-white/5"
        >
          <div className="h-32 animate-pulse bg-white/5" />
          <div className="space-y-3 p-5">
            <div className="h-3 w-20 animate-pulse rounded-full bg-white/10" />
            <div className="h-4 w-3/4 animate-pulse rounded-full bg-white/10" />
            <div className="h-3 w-full animate-pulse rounded-full bg-white/10" />
            <div className="h-3 w-5/6 animate-pulse rounded-full bg-white/10" />
            <div className="mt-3 flex items-center justify-between border-t border-white/5 pt-3">
              <div className="h-8 w-16 animate-pulse rounded bg-white/10" />
              <div className="h-8 w-20 animate-pulse rounded-xl bg-white/10" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function ErrorBox({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <div className="rounded-3xl border border-red-400/30 bg-red-500/10 p-6 text-sm text-red-200">
      <p className="font-medium">{message}</p>
      <button
        type="button"
        onClick={onRetry}
        className="mt-3 inline-flex items-center gap-2 rounded-xl border border-red-400/40 bg-red-500/10 px-3 py-1.5 text-xs font-semibold hover:bg-red-500/20"
      >
        Réessayer
      </button>
    </div>
  );
}

function EmptyState({
  hasFilter,
  onReset,
}: {
  hasFilter: boolean;
  onReset: () => void;
}) {
  return (
    <div className="rounded-3xl border border-dashed border-white/15 bg-white/3 p-10 text-center backdrop-blur">
      <div className="mx-auto inline-flex size-12 items-center justify-center rounded-2xl border border-white/10 bg-white/5">
        <Search className="size-5 text-white/50" />
      </div>
      <p className="mt-4 text-base font-medium text-white/85">
        {hasFilter
          ? "Aucune prestation ne correspond à votre recherche."
          : "Aucune prestation publiée pour l'instant."}
      </p>
      <p className="mx-auto mt-2 max-w-md text-sm text-white/50">
        {hasFilter
          ? "Essayez d'élargir les filtres ou modifiez les mots-clés."
          : "Revenez bientôt — les coiffeurs s'inscrivent et publient leurs prestations."}
      </p>
      {hasFilter ? (
        <button
          type="button"
          onClick={onReset}
          className="mt-5 inline-flex items-center gap-2 rounded-xl border border-pink-400/30 bg-pink-400/10 px-4 py-2 text-xs font-semibold text-pink-200 hover:bg-pink-400/20"
        >
          <X className="size-3.5" />
          Réinitialiser les filtres
        </button>
      ) : null}
    </div>
  );
}

function ProCta() {
  return (
    <section className="relative overflow-hidden rounded-3xl border border-amber-400/30 bg-linear-to-br from-amber-400/10 via-zinc-900/60 to-zinc-950/80 p-6 shadow-[0_20px_60px_-20px_rgba(251,191,36,0.2)] sm:rounded-[2rem] sm:p-10">
      <div className="relative flex flex-col items-start gap-5 sm:flex-row sm:items-center sm:justify-between sm:gap-8">
        <div className="space-y-2">
          <p className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-amber-200">
            <Scissors className="size-3.5" />
            Vous êtes coiffeuse · coiffeur ?
          </p>
          <h3 className="text-xl font-semibold tracking-tight text-white sm:text-2xl">
            Publiez vos prestations, recevez des demandes.
          </h3>
          <p className="max-w-xl text-sm leading-6 text-white/60">
            Créez votre profil pro en quelques minutes et apparaissez auprès
            d&apos;une clientèle qualifiée près de votre zone d&apos;intervention.
          </p>
        </div>
        <Link
          href="/register"
          className="inline-flex shrink-0 items-center gap-2 rounded-2xl bg-amber-400 px-5 py-3 text-sm font-semibold text-zinc-950 shadow-lg shadow-amber-500/20 transition-colors hover:bg-amber-300"
        >
          Créer mon compte pro
          <ArrowRight className="size-4" />
        </Link>
      </div>
    </section>
  );
}

function OwnerPlanPill({ plan }: { plan?: string }) {
  if (!plan || plan === "free") return null;
  if (plan === "premium") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-amber-400 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em] text-amber-950 shadow-lg shadow-amber-500/30">
        <Crown className="size-3" />
        Premium
      </span>
    );
  }
  if (plan === "pro") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-violet-500 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em] text-white shadow-lg shadow-violet-500/30">
        <TrendingUp className="size-3" />
        Pro
      </span>
    );
  }
  if (plan === "essential") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-sky-500 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em] text-white shadow">
        <Sparkles className="size-3" />
        Essentiel
      </span>
    );
  }
  return null;
}
