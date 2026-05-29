"use client"

import { useCallback, useEffect, useMemo, useState } from "react"

import { AdminServiceForm } from "@/src/components/admin/admin-service-form"
import { Button } from "@/src/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/src/components/ui/card"

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

  const featuredCount = useMemo(
    () => services.filter((service) => service.featured).length,
    [services]
  )

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

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
      <div className="space-y-6">
        <AdminServiceForm onServiceCreated={() => loadServices(true)} plan={plan} />

        <div className="grid gap-4 sm:grid-cols-3">
          <MetricCard
            label="Services publiés"
            value={services.length}
            helper="Catalogue actuellement visible via l'API."
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

      <Card className="admin-card border-border/70 bg-card/90 backdrop-blur">
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1">
            <CardTitle>Vos prestations</CardTitle>
            <CardDescription>
              Les services que vous avez publiés. Ils apparaissent sur la marketplace
              avec leur photo et leur zone d&apos;intervention.
            </CardDescription>
          </div>

          <Button
            type="button"
            variant="outline"
            onClick={() => loadServices(true)}
            disabled={loading || refreshing}
          >
            {refreshing ? "Actualisation..." : "Rafraîchir"}
          </Button>
        </CardHeader>

        <CardContent className="space-y-4">
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
                  className="rounded-2xl border border-border/70 bg-muted/40 p-4"
                >
                  <div className="h-4 w-2/3 animate-pulse rounded bg-muted" />
                  <div className="mt-3 h-3 w-1/2 animate-pulse rounded bg-muted" />
                  <div className="mt-4 h-14 animate-pulse rounded bg-muted" />
                </div>
              ))}
            </div>
          ) : services.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border/80 bg-muted/30 px-5 py-8 text-center">
              <p className="font-medium">Aucun service disponible pour le moment.</p>
              <p className="mt-2 text-sm text-muted-foreground">
                Ajoutez votre première prestation avec le formulaire pour alimenter
                la vitrine publique.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {services.map((service) => (
                <article
                  key={service.id}
                  className="flex gap-4 rounded-2xl border border-border/70 bg-background/70 p-3 shadow-sm"
                >
                  <div className="size-20 shrink-0 overflow-hidden rounded-xl bg-muted">
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
                            <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
                              Mis en avant
                            </span>
                          ) : null}
                        </div>

                        <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                          <span className="rounded-full bg-muted px-2.5 py-1">
                            {service.category}
                          </span>
                          <span className="rounded-full bg-muted px-2.5 py-1">
                            {service.city} · {service.neighborhood}
                          </span>
                        </div>
                      </div>

                      <div className="text-sm font-medium text-foreground">
                        {service.price.toLocaleString("fr-FR")} FCFA • {service.duration} min
                      </div>
                    </div>

                    <p className="mt-3 line-clamp-2 text-sm leading-6 text-muted-foreground">
                      {service.description}
                    </p>
                  </div>
                </article>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

type MetricCardProps = {
  label: string
  value: number
  helper: string
}

function MetricCard({ label, value, helper }: MetricCardProps) {
  return (
    <Card className="admin-card border-border/70 bg-card/80 backdrop-blur">
      <CardContent className="space-y-2 pt-4">
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="text-3xl font-semibold tracking-tight">{value}</p>
        <p className="text-sm text-muted-foreground">{helper}</p>
      </CardContent>
    </Card>
  )
}