"use client";

import { useEffect, useState } from "react";
import { Download, Info, Share2, Smartphone } from "lucide-react";
import { cn } from "@/src/lib/utils";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

type InstallMode = "idle" | "ready" | "ios";

type NavigatorWithStandalone = Navigator & {
  standalone?: boolean;
};

function readInstallEnvironment() {
  if (typeof window === "undefined") {
    return { isStandalone: false, mode: "idle" as InstallMode };
  }

  const standalone =
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as NavigatorWithStandalone).standalone === true;
  const isiOS =
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);

  return {
    isStandalone: standalone,
    mode: isiOS ? ("ios" as InstallMode) : ("idle" as InstallMode),
  };
}

export function PwaInstallButton({ className }: { className?: string }) {
  const [promptEvent, setPromptEvent] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [installEnvironment, setInstallEnvironment] = useState(
    readInstallEnvironment
  );
  const [helpOpen, setHelpOpen] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setPromptEvent(event as BeforeInstallPromptEvent);
      setHelpOpen(false);
    };

    const handleInstalled = () => {
      setPromptEvent(null);
      setInstallEnvironment((current) => ({ ...current, isStandalone: true }));
      setHelpOpen(false);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleInstalled);
    };
  }, []);

  if (installEnvironment.isStandalone) return null;

  async function install() {
    if (!promptEvent) {
      setHelpOpen((open) => !open);
      return;
    }

    await promptEvent.prompt();
    await promptEvent.userChoice.catch(() => null);
    setPromptEvent(null);
  }

  const canPrompt = Boolean(promptEvent);
  const mode = canPrompt ? "ready" : installEnvironment.mode;

  return (
    <div className={cn("relative", className)}>
      <button
        type="button"
        onClick={install}
        aria-expanded={helpOpen}
        className={cn(
          "inline-flex h-9 items-center gap-2 rounded-full border px-3 text-xs font-semibold shadow-sm backdrop-blur transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300/60 sm:text-sm",
          canPrompt
            ? "border-emerald-300/40 bg-emerald-300/15 text-emerald-100 hover:-translate-y-0.5 hover:bg-emerald-300/25"
            : "border-white/15 bg-white/5 text-white/75 hover:bg-white/10"
        )}
      >
        {canPrompt ? (
          <Download className="size-4" />
        ) : mode === "ios" ? (
          <Share2 className="size-4" />
        ) : (
          <Smartphone className="size-4" />
        )}
        <span className="hidden sm:inline">
          {canPrompt ? "Installer l'app" : "Installer"}
        </span>
        <span className="sm:hidden">PWA</span>
        {!canPrompt ? <Info className="size-3.5 opacity-70" /> : null}
      </button>

      {helpOpen && !canPrompt ? (
        <div className="absolute right-0 top-[calc(100%+0.6rem)] z-40 w-[min(20rem,calc(100vw-2rem))] rounded-2xl border border-white/10 bg-zinc-950/95 p-3 text-xs leading-5 text-white/70 shadow-2xl shadow-black/40 backdrop-blur">
          <p className="font-semibold text-white">Installation PWA</p>
          <p className="mt-1">
            {mode === "ios"
              ? "Sur iPhone ou iPad, utilisez Partager puis Ajouter a l'ecran d'accueil."
              : "Le bouton d'installation devient actif sur Chrome ou Edge quand l'app est ouverte en HTTPS ou localhost."}
          </p>
        </div>
      ) : null}
    </div>
  );
}
