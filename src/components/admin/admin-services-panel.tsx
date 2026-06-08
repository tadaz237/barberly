"use client"

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
  type ReactNode,
} from "react"
import { Camera, Crown, Edit3, ImageIcon, Loader2, Trash2, X } from "lucide-react"

import {
  AdminServiceForm,
  SERVICE_CATEGORIES,
} from "@/src/components/admin/admin-service-form"
import {
  MARKETPLACE_TONES,
  getMarketplaceRoleLabel,
  getMarketplaceToneKey,
  type MarketplaceGender,
} from "@/src/components/marketplace/marketplace-theme"
import { Button } from "@/src/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/src/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/src/components/ui/dialog"
import { ImageCropModal } from "@/src/components/ui/image-crop-modal"
import { Input } from "@/src/components/ui/input"
import {
  MAX_SERVICE_DURATION_MINUTES,
  MIN_SERVICE_DESCRIPTION_LENGTH,
} from "@/src/lib/service-validation"
import { cn } from "@/src/lib/utils"

type ServiceItem = {
  id: string
  ownerId: string | null
  name: string
  category: string
  price: number
  duration: number
  city: string
  neighborhood: string
  description: string
  image?: string
  featured?: boolean
  createdAt: string
  ownerGender?: MarketplaceGender
}

type ServicesResponse = {
  services: ServiceItem[]
}

type Plan = "free" | "essential" | "pro" | "premium"

export function AdminServicesPanel({ plan = "free" }: { plan?: Plan }) {
  const [services, setServices] = useState<ServiceItem[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")
  const [actionMessage, setActionMessage] = useState("")
  const [editingService, setEditingService] = useState<ServiceItem | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const featuredCount = useMemo(
    () => services.filter((service) => service.featured).length,
    [services]
  )

  const latestServiceCreatedAt = services[0]?.createdAt

  const loadServices = useCallback(async (showRefreshingState = false) => {
    if (showRefreshingState) {
      setRefreshing(true)
    } else {
      setLoading(true)
    }

    setErrorMessage("")

    try {
      const response = await fetch("/api/services?owner=me", {
        cache: "no-store",
      })
      const data = (await response.json()) as ServicesResponse

      if (!response.ok) {
        throw new Error("Impossible de récupérer les services.")
      }

      setServices(Array.isArray(data.services) ? data.services : [])
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Une erreur inattendue est survenue lors du chargement."
      )
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    void loadServices()
  }, [loadServices])

  async function handleDelete(service: ServiceItem) {
    const confirmed = window.confirm(
      `Supprimer définitivement la prestation "${service.name}" ?`
    )
    if (!confirmed) return

    setDeletingId(service.id)
    setErrorMessage("")
    setActionMessage("")

    try {
      const response = await fetch(`/api/services/${service.id}`, {
        method: "DELETE",
      })
      const data = await response.json().catch(() => null)

      if (!response.ok) {
        throw new Error(
          data && typeof data.message === "string"
            ? data.message
            : "Suppression impossible."
        )
      }

      setActionMessage(
        data && typeof data.message === "string"
          ? data.message
          : "Prestation supprimée."
      )
      await loadServices(true)
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Erreur inattendue."
      )
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,0.95fr)_minmax(21rem,0.75fr)] xl:items-start">
      <div className="space-y-5">
        <AdminServiceForm
          onServiceCreated={() => loadServices(true)}
          plan={plan}
          servicesCount={services.length}
          latestServiceCreatedAt={latestServiceCreatedAt}
          rulesLoading={loading}
        />

        <div className="grid gap-3 sm:grid-cols-3">
          <MetricCard
            label="Services publiés"
            value={services.length}
            helper="Prestations visibles sur votre vitrine."
          />
          <MetricCard
            label="Mises en avant"
            value={featuredCount}
            helper="Prestations marquées comme prioritaires."
          />
          <MetricCard
            label="Villes actives"
            value={new Set(services.map((service) => service.city)).size}
            helper="Nombre de villes d'intervention distinctes."
          />
        </div>
      </div>

      <Card className="admin-card xl:sticky xl:top-24">
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1">
            <CardTitle>Vos prestations</CardTitle>
            <CardDescription>
              Les prestations que vous avez publiées. Elles apparaissent sur la marketplace
              avec leur photo et leur zone d&apos;intervention.
            </CardDescription>
          </div>

          <Button
            type="button"
            variant="outline"
            onClick={() => loadServices(true)}
            disabled={loading || refreshing}
          >
            {refreshing ? "Actualisation…" : "Rafraîchir"}
          </Button>
        </CardHeader>

        <CardContent className="space-y-3">
          {actionMessage ? (
            <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-700 dark:text-emerald-300">
              {actionMessage}
            </div>
          ) : null}

          {errorMessage ? (
            <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {errorMessage}
            </div>
          ) : null}

          {loading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, index) => (
                <div
                  key={index}
                  className="rounded-xl border border-white/10 bg-white/5 p-4"
                >
                  <div className="h-4 w-2/3 animate-pulse rounded bg-muted" />
                  <div className="mt-3 h-3 w-1/2 animate-pulse rounded bg-muted" />
                  <div className="mt-4 h-14 animate-pulse rounded bg-muted" />
                </div>
              ))}
            </div>
          ) : services.length === 0 ? (
            <div className="rounded-xl border border-dashed border-white/15 bg-white/5 px-5 py-8 text-center">
              <p className="font-medium">Aucun service disponible pour le moment.</p>
              <p className="mt-2 text-sm text-muted-foreground">
                Ajoutez votre première prestation avec le formulaire pour alimenter
                la vitrine publique.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {services.map((service) => {
                const toneKey = getMarketplaceToneKey(
                  service.ownerGender,
                  service.category
                )
                const tone = MARKETPLACE_TONES[toneKey]
                const roleLabel = getMarketplaceRoleLabel(toneKey)

                return (
                  <article
                    key={service.id}
                    className={cn(
                      "group/service flex flex-col gap-3 rounded-xl border border-white/10 bg-white/5 p-3 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-white/10 sm:flex-row sm:gap-4",
                      tone.cardHover
                    )}
                  >
                  <div
                    className={cn(
                      "h-36 w-full shrink-0 overflow-hidden rounded-lg border sm:size-20",
                      tone.avatar
                    )}
                  >
                    {service.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={service.image}
                        alt=""
                        className="size-full object-cover"
                      />
                    ) : (
                      <div className="flex size-full items-center justify-center text-xs text-muted-foreground">
                        Sans photo
                      </div>
                    )}
                    </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-base font-semibold">{service.name}</h3>
                          {service.featured ? (
                            <span className="rounded-full bg-amber-300/15 px-2.5 py-1 text-xs font-medium text-amber-100">
                              Mis en avant
                            </span>
                          ) : null}
                          <span
                            className={cn(
                              "rounded-full px-2.5 py-1 text-xs font-medium",
                              tone.chip
                            )}
                          >
                            {roleLabel}
                          </span>
                        </div>

                        <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                          <span
                            className={cn(
                              "rounded-full px-2.5 py-1",
                              tone.chip
                            )}
                          >
                            {service.category}
                          </span>
                          <span className="rounded-full bg-white/10 px-2.5 py-1">
                            {service.city} · {service.neighborhood}
                          </span>
                        </div>
                      </div>

                      <div className="flex shrink-0 flex-col items-start gap-2 sm:items-end">
                        <div className="text-sm font-medium text-foreground">
                          {service.price.toLocaleString("fr-FR")} FCFA • {service.duration} min
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setEditingService(service)}
                          >
                            <Edit3 className="size-3.5" />
                            Modifier
                          </Button>
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            disabled={deletingId === service.id}
                            onClick={() => handleDelete(service)}
                          >
                            {deletingId === service.id ? (
                              <Loader2 className="size-3.5 animate-spin" />
                            ) : (
                              <Trash2 className="size-3.5" />
                            )}
                            Supprimer
                          </Button>
                        </div>
                      </div>
                    </div>

                    <p className="mt-3 line-clamp-2 text-sm leading-6 text-muted-foreground">
                      {service.description}
                    </p>
                  </div>
                  </article>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {editingService ? (
        <ServiceEditDialog
          service={editingService}
          plan={plan}
          open={Boolean(editingService)}
          onOpenChange={(open) => {
            if (!open) setEditingService(null)
          }}
          onSaved={async (message) => {
            setEditingService(null)
            setActionMessage(message)
            await loadServices(true)
          }}
        />
      ) : null}
    </div>
  )
}

type MetricCardProps = {
  label: string
  value: number
  helper: string
}

type ServiceFormValues = {
  name: string
  category: string
  price: string
  duration: string
  city: string
  neighborhood: string
  description: string
  featured: boolean
}

const MAX_IMAGE_BYTES = 5 * 1024 * 1024

function serviceToFormValues(service: ServiceItem): ServiceFormValues {
  return {
    name: service.name,
    category: service.category,
    price: String(service.price),
    duration: String(service.duration),
    city: service.city,
    neighborhood: service.neighborhood,
    description: service.description,
    featured: Boolean(service.featured),
  }
}

function ServiceEditDialog({
  service,
  plan,
  open,
  onOpenChange,
  onSaved,
}: {
  service: ServiceItem
  plan: Plan
  open: boolean
  onOpenChange: (open: boolean) => void
  onSaved: (message: string) => Promise<void> | void
}) {
  const [values, setValues] = useState<ServiceFormValues>(() =>
    serviceToFormValues(service)
  )
  const [imageDataUrl, setImageDataUrl] = useState<string | null>(
    service.image ?? null
  )
  const [stagingImage, setStagingImage] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const isPremium = plan === "premium"

  useEffect(() => {
    if (!open) return
    setValues(serviceToFormValues(service))
    setImageDataUrl(service.image ?? null)
    setStagingImage(null)
    setSubmitting(false)
    setErrorMessage("")
  }, [open, service])

  const isDisabled = useMemo(() => {
    return (
      submitting ||
      !values.name.trim() ||
      !values.category.trim() ||
      !values.price.trim() ||
      !values.duration.trim() ||
      !Number.isFinite(Number(values.duration)) ||
      Number(values.duration) <= 0 ||
      Number(values.duration) > MAX_SERVICE_DURATION_MINUTES ||
      !values.city.trim() ||
      !values.neighborhood.trim() ||
      values.description.trim().length < MIN_SERVICE_DESCRIPTION_LENGTH
    )
  }, [submitting, values])

  function updateField<Key extends keyof ServiceFormValues>(
    field: Key,
    value: ServiceFormValues[Key],
  ) {
    setValues((current) => ({ ...current, [field]: value }))
  }

  function handleImageChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ""
    if (!file) return

    if (!file.type.startsWith("image/")) {
      setErrorMessage("Le fichier choisi n'est pas une image.")
      return
    }

    if (file.size > MAX_IMAGE_BYTES) {
      setErrorMessage("Image trop volumineuse (max 5 Mo).")
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setStagingImage(reader.result)
        setErrorMessage("")
      }
    }
    reader.onerror = () => setErrorMessage("Lecture du fichier impossible.")
    reader.readAsDataURL(file)
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitting(true)
    setErrorMessage("")

    try {
      const response = await fetch(`/api/services/${service.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: values.name.trim(),
          category: values.category.trim(),
          price: Number(values.price),
          duration: Number(values.duration),
          city: values.city.trim(),
          neighborhood: values.neighborhood.trim(),
          description: values.description.trim(),
          featured: isPremium && values.featured,
          image: imageDataUrl,
        }),
      })
      const data = await response.json().catch(() => null)

      if (!response.ok) {
        throw new Error(
          data && typeof data.message === "string"
            ? data.message
            : "Mise à jour impossible."
        )
      }

      await onSaved(
        data && typeof data.message === "string"
          ? data.message
          : "Prestation mise à jour."
      )
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Erreur inattendue."
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Modifier la prestation</DialogTitle>
            <DialogDescription>
              Mettez à jour les informations visibles sur la marketplace.
            </DialogDescription>
          </DialogHeader>

          {stagingImage ? (
            <ImageCropModal
              src={stagingImage}
              aspect={4 / 3}
              title="Recadrer la photo de la prestation"
              mode="inline"
              onSave={(croppedUrl) => {
                setImageDataUrl(croppedUrl)
                setStagingImage(null)
              }}
              onCancel={() => setStagingImage(null)}
            />
          ) : (
          <form className="space-y-5" onSubmit={handleSubmit}>
            <ServiceImagePicker
              imageDataUrl={imageDataUrl}
              onChoose={() => fileInputRef.current?.click()}
              onClear={() => setImageDataUrl(null)}
              disabled={submitting}
            />
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif"
              onChange={handleImageChange}
              className="hidden"
            />

            <div className="grid gap-4 md:grid-cols-2">
              <ServiceField label="Nom de la coiffure" htmlFor="edit-service-name">
                <Input
                  id="edit-service-name"
                  value={values.name}
                  onChange={(event) => updateField("name", event.target.value)}
                />
              </ServiceField>

              <ServiceField label="Catégorie" htmlFor="edit-service-category">
                <div
                  id="edit-service-category"
                  role="group"
                  aria-label="Catégorie"
                  className="grid grid-cols-2 gap-2"
                >
                  {SERVICE_CATEGORIES.map((category) => {
                    const active = values.category === category
                    return (
                      <button
                        key={category}
                        type="button"
                        aria-pressed={active}
                        onClick={() => updateField("category", category)}
                        className={`rounded-xl border px-4 py-2.5 text-sm font-semibold transition-colors ${
                          active
                            ? "border-amber-400/60 bg-amber-400/15 text-amber-200"
                            : "border-white/10 bg-white/5 text-muted-foreground hover:border-amber-300/40 hover:text-foreground"
                        }`}
                      >
                        {category}
                      </button>
                    )
                  })}
                </div>
              </ServiceField>

              <ServiceField label="Ville" htmlFor="edit-service-city">
                <Input
                  id="edit-service-city"
                  value={values.city}
                  onChange={(event) => updateField("city", event.target.value)}
                />
              </ServiceField>

              <ServiceField label="Quartier" htmlFor="edit-service-neighborhood">
                <Input
                  id="edit-service-neighborhood"
                  value={values.neighborhood}
                  onChange={(event) =>
                    updateField("neighborhood", event.target.value)
                  }
                />
              </ServiceField>

              <ServiceField label="Prix (FCFA)" htmlFor="edit-service-price">
                <Input
                  id="edit-service-price"
                  type="number"
                  min="0"
                  step="100"
                  value={values.price}
                  onChange={(event) => updateField("price", event.target.value)}
                />
              </ServiceField>

              <ServiceField label="Durée (minutes)" htmlFor="edit-service-duration">
                <Input
                  id="edit-service-duration"
                  type="number"
                  min="1"
                  max="720"
                  step="1"
                  value={values.duration}
                  onChange={(event) =>
                    updateField("duration", event.target.value)
                  }
                />
              </ServiceField>
            </div>


            <ServiceField label="Description" htmlFor="edit-service-description">
              <textarea
                id="edit-service-description"
                rows={4}
                minLength={MIN_SERVICE_DESCRIPTION_LENGTH}
                className="flex min-h-24 w-full rounded-xl border border-input bg-transparent px-3 py-2 text-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
                value={values.description}
                onChange={(event) =>
                  updateField("description", event.target.value)
                }
              />
            </ServiceField>

            <label
              className={`flex items-start gap-3 rounded-2xl border p-4 text-sm transition-colors ${
                isPremium
                  ? "border-amber-400/40 bg-amber-400/5"
                  : "cursor-not-allowed border-border/70 bg-muted/40 opacity-90"
              }`}
            >
              <input
                type="checkbox"
                checked={isPremium && values.featured}
                disabled={!isPremium || submitting}
                onChange={(event) =>
                  updateField("featured", event.target.checked)
                }
                className="mt-0.5 size-4 rounded border border-input accent-amber-500 disabled:cursor-not-allowed"
              />
              <span className="space-y-1">
                <span className="flex items-center gap-2 font-medium">
                  Mettre cette prestation en vedette
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-amber-700 dark:text-amber-300">
                    <Crown className="size-3" />
                    Premium
                  </span>
                </span>
                <span className="block text-muted-foreground">
                  Réservé aux abonnés Premium.
                </span>
              </span>
            </label>

            {errorMessage ? (
              <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                {errorMessage}
              </div>
            ) : null}

            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="outline"
                disabled={submitting}
                onClick={() => onOpenChange(false)}
              >
                Annuler
              </Button>
              <Button type="submit" disabled={isDisabled}>
                {submitting ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : null}
                Enregistrer
              </Button>
            </div>
          </form>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}

function ServiceImagePicker({
  imageDataUrl,
  onChoose,
  onClear,
  disabled,
}: {
  imageDataUrl: string | null
  onChoose: () => void
  onClear: () => void
  disabled?: boolean
}) {
  return (
    <div className="space-y-2">
      <span className="text-sm font-medium">Photo de la prestation</span>
      {imageDataUrl ? (
        <div className="relative overflow-hidden rounded-2xl border border-border/70">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imageDataUrl}
            alt="Aperçu de la prestation"
            className="aspect-video w-full object-cover"
          />
          <div className="absolute inset-x-3 bottom-3 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onChoose}
              disabled={disabled}
              className="inline-flex items-center gap-1.5 rounded-full bg-background/80 px-3 py-1.5 text-xs font-medium shadow backdrop-blur hover:bg-background"
            >
              <Camera className="size-3.5" />
              Changer
            </button>
            <button
              type="button"
              onClick={onClear}
              disabled={disabled}
              aria-label="Retirer la photo"
              className="inline-flex size-8 items-center justify-center rounded-full bg-background/80 text-foreground shadow backdrop-blur hover:bg-background"
            >
              <X className="size-4" />
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={onChoose}
          disabled={disabled}
          className="flex aspect-video w-full flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border/80 bg-muted/30 text-muted-foreground transition-colors hover:border-primary/60 hover:bg-muted/50"
        >
          <div className="flex size-10 items-center justify-center rounded-xl bg-background shadow-sm">
            <ImageIcon className="size-5" />
          </div>
          <div className="text-center">
            <p className="text-sm font-medium text-foreground">
              Ajouter une photo de la coiffure
            </p>
            <p className="text-xs">PNG / JPEG / WEBP — max 5 Mo</p>
          </div>
        </button>
      )}
    </div>
  )
}

function ServiceField({
  label,
  htmlFor,
  children,
}: {
  label: string
  htmlFor: string
  children: ReactNode
}) {
  return (
    <label className="grid gap-2 text-sm font-medium" htmlFor={htmlFor}>
      <span>{label}</span>
      {children}
    </label>
  )
}

function MetricCard({ label, value, helper }: MetricCardProps) {
  return (
    <Card className="admin-card">
      <CardContent className="space-y-2 pt-4">
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="text-3xl font-semibold tracking-tight text-white">{value}</p>
        <p className="text-sm text-muted-foreground">{helper}</p>
      </CardContent>
    </Card>
  )
}
