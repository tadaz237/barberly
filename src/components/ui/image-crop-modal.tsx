"use client";

import { useState, useCallback } from "react";
import Cropper, { type Area } from "react-easy-crop";
import { Check, RefreshCcw, X, ZoomIn } from "lucide-react";
import { cn } from "@/src/lib/utils";

const MAX_OUTPUT_DIM = 1280;

type Props = {
  src: string;
  aspect?: number;
  title?: string;
  tone?: "amber" | "pink";
  mode?: "modal" | "inline";
  onSave: (dataUrl: string) => void;
  onCancel: () => void;
};

const TONE_CLASSES = {
  amber: {
    text: "text-amber-200",
    accent: "accent-amber-400",
    button:
      "bg-amber-400 text-amber-950 shadow-amber-500/30 hover:bg-amber-300",
  },
  pink: {
    text: "text-pink-200",
    accent: "accent-pink-400",
    button: "bg-pink-400 text-pink-950 shadow-pink-500/30 hover:bg-pink-300",
  },
} as const;

export function ImageCropModal({
  src,
  aspect = 4 / 3,
  title = "Recadrer l'image",
  tone = "amber",
  mode = "modal",
  onSave,
  onCancel,
}: Props) {
  const toneClasses = TONE_CLASSES[tone];
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [busy, setBusy] = useState(false);

  const onCropComplete = useCallback(
    (_: Area, areaPixels: Area) => setCroppedAreaPixels(areaPixels),
    [],
  );

  async function handleSave() {
    if (!croppedAreaPixels) return;
    setBusy(true);
    try {
      const dataUrl = await cropToDataUrl(src, croppedAreaPixels);
      onSave(dataUrl);
    } catch (err) {
      console.error("Crop error", err);
      setBusy(false);
    }
  }

  const cropper = (
    <div className="flex w-full max-w-2xl flex-col gap-4 rounded-3xl border border-white/10 bg-zinc-950 p-5 shadow-2xl sm:rounded-[2rem] sm:p-6">
        <header className="flex items-start justify-between gap-3">
          <div>
            <p
              className={cn(
                "text-[11px] font-semibold uppercase tracking-[0.22em]",
                toneClasses.text,
              )}
            >
              Édition de l&apos;image
            </p>
            <h2 className="text-lg font-semibold tracking-tight text-white">
              {title}
            </h2>
            <p className="mt-1 text-xs text-white/55">
              Glissez l&apos;image pour la repositionner, ajustez le zoom puis
              validez.
            </p>
          </div>
          <button
            type="button"
            onClick={onCancel}
            aria-label="Annuler"
            className="inline-flex size-9 shrink-0 items-center justify-center rounded-full bg-white/5 text-white/70 transition-colors hover:bg-white/10 hover:text-white"
          >
            <X className="size-4" />
          </button>
        </header>

        <div className="relative h-72 overflow-hidden rounded-2xl bg-black sm:h-96">
          <Cropper
            image={src}
            crop={crop}
            zoom={zoom}
            aspect={aspect}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onCropComplete}
            objectFit="contain"
          />
        </div>

        <div className="flex items-center gap-3">
          <ZoomIn className="size-4 text-white/55" />
          <input
            type="range"
            min={1}
            max={4}
            step={0.05}
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            aria-label="Zoom"
            className={cn("flex-1", toneClasses.accent)}
          />
          <button
            type="button"
            onClick={() => {
              setZoom(1);
              setCrop({ x: 0, y: 0 });
            }}
            className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white/70 transition-colors hover:bg-white/10 hover:text-white"
          >
            <RefreshCcw className="size-3.5" />
            Réinit
          </button>
        </div>

        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onCancel}
            disabled={busy}
            className="inline-flex h-11 items-center justify-center rounded-2xl border border-white/10 bg-white/5 px-5 text-sm font-semibold text-white/70 transition-colors hover:bg-white/10 hover:text-white disabled:opacity-50"
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={!croppedAreaPixels || busy}
            className={cn(
              "inline-flex h-11 items-center justify-center gap-2 rounded-2xl px-5 text-sm font-semibold shadow-lg transition-colors disabled:opacity-50",
              toneClasses.button,
            )}
          >
            <Check className="size-4" />
            Valider l&apos;image
          </button>
        </div>
    </div>
  );

  if (mode === "inline") {
    return cropper;
  }

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm">
      {cropper}
    </div>
  );
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

async function cropToDataUrl(src: string, area: Area): Promise<string> {
  const image = await loadImage(src);
  const canvas = document.createElement("canvas");
  const scale = Math.min(
    1,
    MAX_OUTPUT_DIM / Math.max(area.width, area.height),
  );
  canvas.width = Math.round(area.width * scale);
  canvas.height = Math.round(area.height * scale);
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D non disponible.");
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(
    image,
    area.x,
    area.y,
    area.width,
    area.height,
    0,
    0,
    canvas.width,
    canvas.height,
  );
  return canvas.toDataURL("image/jpeg", 0.82);
}
