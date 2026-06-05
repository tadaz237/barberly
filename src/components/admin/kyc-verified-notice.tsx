"use client"

import { useEffect, useState } from "react"
import { X } from "lucide-react"
import { cn } from "@/src/lib/utils"

const STORAGE_PREFIX = "kyc-verified-seen:"
const AUTO_HIDE_MS = 8000

/**
 * Affiche la bannière « Profil vérifié » une seule fois, lors de la première
 * connexion au dashboard après validation du KYC par l'admin. Le passage est
 * mémorisé par utilisateur dans le localStorage : la bannière ne réapparaît
 * plus aux visites suivantes, et disparaît automatiquement après quelques
 * secondes (ou via le bouton de fermeture).
 */
export function KycVerifiedNotice({
  userId,
  children,
}: {
  userId: string
  children: React.ReactNode
}) {
  const [state, setState] = useState<"hidden" | "visible" | "leaving">("hidden")

  useEffect(() => {
    const key = `${STORAGE_PREFIX}${userId}`

    let alreadySeen = false
    try {
      alreadySeen = window.localStorage.getItem(key) === "1"
    } catch {
      alreadySeen = false
    }
    if (alreadySeen) return

    try {
      window.localStorage.setItem(key, "1")
    } catch {
      // Stockage indisponible : on affiche quand même la bannière cette fois-ci.
    }

    const showTimer = window.setTimeout(() => setState("visible"), 50)
    const hideTimer = window.setTimeout(() => setState("leaving"), AUTO_HIDE_MS)
    return () => {
      window.clearTimeout(showTimer)
      window.clearTimeout(hideTimer)
    }
  }, [userId])

  if (state === "hidden") return null

  return (
    <div
      className={cn(
        "relative transition-all duration-500 ease-out",
        state === "leaving"
          ? "pointer-events-none -translate-y-1 opacity-0"
          : "translate-y-0 opacity-100",
      )}
      onTransitionEnd={() => {
        if (state === "leaving") setState("hidden")
      }}
    >
      <button
        type="button"
        onClick={() => setState("leaving")}
        aria-label="Fermer"
        className="absolute right-3 top-3 z-10 inline-flex size-7 items-center justify-center rounded-full bg-white/5 text-white/60 transition-colors hover:bg-white/10 hover:text-white"
      >
        <X className="size-4" />
      </button>
      {children}
    </div>
  )
}
