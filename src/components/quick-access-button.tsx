"use client";

import { useState } from "react";
import { Check, Copy, Share2, Smartphone, X } from "lucide-react";
import { cn } from "@/src/lib/utils";

type MobilePlatform = "ios" | "android" | "other";

type NavigatorWithStandalone = Navigator & {
  standalone?: boolean;
};

function readPlatform(): MobilePlatform {
  if (typeof navigator === "undefined") return "other";

  const userAgent = navigator.userAgent;
  const isiOS =
    /iPad|iPhone|iPod/.test(userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  if (isiOS) return "ios";

  if (/Android/i.test(userAgent)) return "android";

  return "other";
}

function isStandaloneDisplay() {
  if (typeof window === "undefined") return false;

  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as NavigatorWithStandalone).standalone === true
  );
}

async function copyText(value: string) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(value);
    return;
  }

  const textarea = document.createElement("textarea");
  textarea.value = value;
  textarea.setAttribute("readonly", "true");
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand("copy");
  document.body.removeChild(textarea);
}

type QuickAccessButtonProps = {
  className?: string;
  mobilePanelPlacement?: "top" | "bottom";
};

export function QuickAccessButton({
  className,
  mobilePanelPlacement = "top",
}: QuickAccessButtonProps) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [shared, setShared] = useState(false);
  const [platform] = useState(readPlatform);
  const [standalone] = useState(isStandaloneDisplay);

  async function shareCurrentPage() {
    const url = window.location.href;
    const title = document.title || "Barberly";

    if (navigator.share) {
      try {
        await navigator.share({
          title,
          text: "Acces rapide Barberly",
          url,
        });
        setShared(true);
        window.setTimeout(() => setShared(false), 1800);
        return;
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }
      }
    }

    await copyCurrentPage();
  }

  async function copyCurrentPage() {
    await copyText(window.location.href);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  const platformHint =
    platform === "ios"
      ? "Sur cet appareil: ouvrez Partager, puis Ajouter a l'ecran d'accueil."
      : platform === "android"
        ? "Sur cet appareil: ouvrez le menu du navigateur, puis Ajouter a l'ecran d'accueil."
        : "Choisissez la ligne iOS ou Android selon le telephone.";

  return (
    <div className={cn("relative", className)}>
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-expanded={open}
        className="inline-flex h-9 items-center gap-2 rounded-full border border-emerald-300/30 bg-emerald-300/10 px-3 text-xs font-semibold text-emerald-100 shadow-sm backdrop-blur transition-all duration-200 hover:-translate-y-0.5 hover:bg-emerald-300/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300/60 sm:text-sm"
      >
        <Smartphone className="size-4" />
        <span className="hidden sm:inline">Acces rapide</span>
        <span className="sm:hidden">Acces</span>
      </button>

      {open ? (
        <div
          className={cn(
            "fixed inset-x-3 z-50 mx-auto max-w-sm rounded-2xl border border-white/10 bg-zinc-950/95 p-3 text-xs leading-5 text-white/70 shadow-2xl shadow-black/40 backdrop-blur sm:absolute sm:inset-x-auto sm:right-0 sm:top-[calc(100%+0.6rem)] sm:mx-0 sm:w-[min(21rem,calc(100vw-2rem))] sm:max-w-none",
            mobilePanelPlacement === "bottom"
              ? "bottom-[calc(1rem+env(safe-area-inset-bottom))] top-auto"
              : "top-16",
          )}
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-semibold text-white">
                {standalone ? "Acces deja ajoute" : "Acces rapide mobile"}
              </p>
              <p className="mt-1">{platformHint}</p>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Fermer"
              className="inline-flex size-7 shrink-0 items-center justify-center rounded-full bg-white/5 text-white/60 transition-colors hover:bg-white/10 hover:text-white"
            >
              <X className="size-3.5" />
            </button>
          </div>

          <div className="mt-3 grid gap-2">
            <div
              className={cn(
                "rounded-xl border px-3 py-2",
                platform === "ios"
                  ? "border-emerald-300/35 bg-emerald-300/10 text-emerald-100"
                  : "border-white/10 bg-white/5 text-white/65",
              )}
            >
              <p className="font-semibold text-white">iPhone / iPad</p>
              <p className="mt-0.5">
                Safari: bouton Partager, puis Ajouter a l&apos;ecran
                d&apos;accueil.
              </p>
            </div>
            <div
              className={cn(
                "rounded-xl border px-3 py-2",
                platform === "android"
                  ? "border-emerald-300/35 bg-emerald-300/10 text-emerald-100"
                  : "border-white/10 bg-white/5 text-white/65",
              )}
            >
              <p className="font-semibold text-white">Android</p>
              <p className="mt-0.5">
                Chrome: menu du navigateur, puis Ajouter a l&apos;ecran
                d&apos;accueil.
              </p>
            </div>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={shareCurrentPage}
              className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl bg-emerald-400 px-3 text-xs font-semibold text-emerald-950 transition-colors hover:bg-emerald-300"
            >
              {shared ? <Check className="size-3.5" /> : <Share2 className="size-3.5" />}
              {shared ? "Partage" : "Partager"}
            </button>
            <button
              type="button"
              onClick={copyCurrentPage}
              className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 text-xs font-semibold text-white/75 transition-colors hover:bg-white/10 hover:text-white"
            >
              {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
              {copied ? "Copie" : "Copier"}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
