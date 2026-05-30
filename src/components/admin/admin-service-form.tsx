"use client"

import {
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
  type ReactNode,
} from "react"
import { Camera, Crown, ImageIcon, X } from "lucide-react"

import { Button } from "@/src/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/src/components/ui/card"
import { Input } from "@/src/components/ui/input"
import { ImageCropModal } from "@/src/components/ui/image-crop-modal"

type Plan = "free" | "essential" | "pro" | "premium"

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

type ServicePayload = {
  name: string
  category: string
  price: number
  duration: number
  city: string
  neighborhood: string
  description: string
  featured: boolean
  image?: string
}

type Props = {
  onServiceCreated: () => Promise<void> | void
  plan?: Plan
  servicesCount?: number
  latestServiceCreatedAt?: string
  rulesLoading?: boolean
}

const initialValues: ServiceFormValues = {
  name: "",
  category: "",
  price: "",
  duration: "",
  city: "",
  neighborhood: "",
  description: "",
  featured: false,
}

const MAX_IMAGE_BYTES = 5 * 1024 * 1024
const FREE_SERVICES_MAX = 7
const FREE_COOLDOWN_MS = 2 * 24 * 60 * 60 * 1000

export function AdminServiceForm({
  onServiceCreated,
  plan = "free",
  servicesCount = 0,
  latestServiceCreatedAt,
  rulesLoading = false,
}: Props) {
  const [values, setValues] = useState<ServiceFormValues>(initialValues)
  const [imageDataUrl, setImageDataUrl] = useState<string | null>(null)
  const [stagingImage, setStagingImage] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [successMessage, setSuccessMessage] = useState("")
  const [errorMessage, setErrorMessage] = useState("")
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const isPremium = plan === "premium"

  const creationBlockedReason = useMemo(() => {
    if (rulesLoading) {
      return "Chargement de vos limites de publication..."
    }
    if (plan !== "free") return ""
    if (servicesCount >= FREE_SERVICES_MAX) {
      return "Votre forfait gratuit autorise 7 prestations maximum. Vous pouvez modifier ou supprimer une prestation existante."
    }
    if (!latestServiceCreatedAt) return ""

    const latestTime = new Date(latestServiceCreatedAt).getTime()
    if (!Number.isFinite(latestTime)) return ""

    const nextAllowedAt = new Date(latestTime + FREE_COOLDOWN_MS)
    if (Date.now() >= nextAllowedAt.getTime()) return ""

    return `Le forfait gratuit permet de publier une prestation tous les 2 jours. Prochaine publication possible le ${nextAllowedAt.toLocaleDateString("fr-FR")} à ${nextAllowedAt.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}.`
  }, [latestServiceCreatedAt, plan, rulesLoading, servicesCount])

  const isDisabled = useMemo(() => {
    return (
      submitting ||
      Boolean(creationBlockedReason) ||
      !values.name.trim() ||
      !values.category.trim() ||
      !values.price.trim() ||
      !values.duration.trim() ||
      !values.city.trim() ||
      !values.neighborhood.trim() ||
      !values.description.trim()
    )
  }, [creationBlockedReason, submitting, values])

  function updateField<Key extends keyof ServiceFormValues>(field: Key, value: ServiceFormValues[Key]) {
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
    reader.readAsDataURL(file)
  }

  function clearImage() {
    setImageDataUrl(null)
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitting(true)
    setSuccessMessage("")
    setErrorMessage("")

    const payload: ServicePayload = {
      name: values.name.trim(),
      category: values.category.trim(),
      price: Number(values.price),
      duration: Number(values.duration),
      city: values.city.trim(),
      neighborhood: values.neighborhood.trim(),
      description: values.description.trim(),
      featured: values.featured,
      image: imageDataUrl ?? undefined,
    }

    try {
      const response = await fetch("/api/services", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      const data = await response.json().catch(() => null)

      if (!response.ok) {
        const message =
          data && typeof data.message === "string"
            ? data.message
            : "Impossible d'ajouter la prestation pour le moment."
        throw new Error(message)
      }

      setValues(initialValues)
      clearImage()
      setSuccessMessage(
        data && typeof data.message === "string"
          ? data.message
          : "La prestation a été ajoutée avec succès."
      )
      await onServiceCreated()
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Erreur inattendue."
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Card className="admin-card">
      <CardHeader>
        <CardTitle>Publier une prestation</CardTitle>
        <CardDescription>
          Renseignez les informations essentielles : la photo, la coiffure, la zone
          et le tarif. Vos clientes verront cette prestation immédiatement sur la
          marketplace.
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form className="space-y-5" onSubmit={handleSubmit}>
          {creationBlockedReason ? (
            <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-700 dark:text-amber-300">
              {creationBlockedReason}
            </div>
          ) : null}

          <ImagePicker
            imageDataUrl={imageDataUrl}
            onChoose={() => fileInputRef.current?.click()}
            onClear={clearImage}
            disabled={submitting || Boolean(creationBlockedReason)}
          />
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif"
            onChange={handleImageChange}
            className="hidden"
          />

          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Nom de la coiffure" htmlFor="name">
              <Input
                id="name"
                placeholder="Ex : Tresses bohèmes"
                value={values.name}
                onChange={(event) => updateField("name", event.target.value)}
              />
            </Field>

            <Field label="Catégorie" htmlFor="category">
              <Input
                id="category"
                placeholder="Ex : Coiffure protectrice"
                value={values.category}
                onChange={(event) => updateField("category", event.target.value)}
              />
            </Field>

            <Field label="Ville" htmlFor="city">
              <Input
                id="city"
                placeholder="Ex : Paris"
                value={values.city}
                onChange={(event) => updateField("city", event.target.value)}
              />
            </Field>

            <Field label="Quartier" htmlFor="neighborhood">
              <Input
                id="neighborhood"
                placeholder="Ex : 11e arrondissement"
                value={values.neighborhood}
                onChange={(event) =>
                  updateField("neighborhood", event.target.value)
                }
              />
            </Field>

            <Field label="Prix (FCFA)" htmlFor="price">
              <Input
                id="price"
                type="number"
                min="0"
                step="100"
                placeholder="15000"
                value={values.price}
                onChange={(event) => updateField("price", event.target.value)}
              />
            </Field>

            <Field label="Durée (minutes)" htmlFor="duration">
              <Input
                id="duration"
                type="number"
                min="0"
                step="1"
                placeholder="90"
                value={values.duration}
                onChange={(event) => updateField("duration", event.target.value)}
              />
            </Field>
          </div>

          <Field label="Description" htmlFor="description">
            <textarea
              id="description"
              rows={4}
              placeholder="Décrivez la prestation, le résultat attendu et ce qui est inclus."
              className="flex min-h-24 w-full rounded-xl border border-input bg-transparent px-3 py-2 text-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
              value={values.description}
              onChange={(event) => updateField("description", event.target.value)}
            />
          </Field>

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
              disabled={!isPremium}
              onChange={(event) => updateField("featured", event.target.checked)}
              className="mt-0.5 size-4 rounded border border-input accent-amber-500 disabled:cursor-not-allowed"
            />
            <span className="space-y-1">
              <span className="flex items-center gap-2 font-medium">
                Mettre cette prestation en vedette
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] ${
                    isPremium
                      ? "bg-amber-400 text-amber-950"
                      : "bg-amber-500/15 text-amber-700 dark:text-amber-300"
                  }`}
                >
                  <Crown className="size-3" />
                  Premium
                </span>
              </span>
              <span className="block text-muted-foreground">
                {isPremium
                  ? "Met votre service en haut de la marketplace avec un badge « Vedette »."
                  : "Réservé aux abonnés Premium. Passez à un forfait supérieur pour activer la mise en avant."}
              </span>
            </span>
          </label>

          {(successMessage || errorMessage) && (
            <div
              className={
                errorMessage
                  ? "rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
                  : "rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-700 dark:text-emerald-300"
              }
            >
              {errorMessage || successMessage}
            </div>
          )}

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-muted-foreground">
              {plan === "free" ? (
                "Gratuit : 7 prestations maximum, modification ou suppression possible."
              ) : (
                <>
                  Votre prestation sera publiée sur la marketplace.
                </>
              )}
            </p>
            <Button type="submit" size="lg" disabled={isDisabled}>
              {submitting ? "Publication…" : "Publier la prestation"}
            </Button>
          </div>
        </form>
      </CardContent>
      {stagingImage ? (
        <ImageCropModal
          src={stagingImage}
          aspect={4 / 3}
          title="Recadrer la photo de la prestation"
          onSave={(croppedUrl) => {
            setImageDataUrl(croppedUrl)
            setStagingImage(null)
          }}
          onCancel={() => setStagingImage(null)}
        />
      ) : null}
    </Card>
  )
}

type ImagePickerProps = {
  imageDataUrl: string | null
  onChoose: () => void
  onClear: () => void
  disabled?: boolean
}

function ImagePicker({ imageDataUrl, onChoose, onClear, disabled }: ImagePickerProps) {
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
          className="flex aspect-video w-full flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-white/15 bg-white/5 text-muted-foreground transition-all duration-200 hover:border-amber-300/40 hover:bg-white/10"
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

type FieldProps = {
  label: string
  htmlFor: string
  children: ReactNode
}

function Field({ label, htmlFor, children }: FieldProps) {
  return (
    <label className="grid gap-2 text-sm font-medium" htmlFor={htmlFor}>
      <span>{label}</span>
      {children}
    </label>
  )
}
