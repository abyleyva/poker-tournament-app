"use client";

import { useRef, useState } from "react";
import { useI18n } from "@/lib/i18n";

// Logos are stored inline as data URLs (no external file storage configured
// for this project). Raster images are downscaled client-side before upload
// to keep the resulting DB rows small; this cap must stay in sync with
// MAX_LOGO_DATA_URL_LENGTH in src/lib/tournament-service.ts.
const MAX_DIMENSION = 320;
const MAX_SOURCE_BYTES = 5 * 1024 * 1024;
const MAX_OUTPUT_LENGTH = 400_000;

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error ?? new Error("read failed"));
    reader.readAsDataURL(file);
  });
}

function resizeRasterImage(dataUrl: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, MAX_DIMENSION / Math.max(img.width, img.height));
      const width = Math.max(1, Math.round(img.width * scale));
      const height = Math.max(1, Math.round(img.height * scale));
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("no canvas context"));
        return;
      }
      ctx.clearRect(0, 0, width, height);
      ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL("image/png"));
    };
    img.onerror = () => reject(new Error("image load failed"));
    img.src = dataUrl;
  });
}

type Props = {
  label: string;
  hint?: string;
  value: string | null;
  onChange: (dataUrl: string | null) => void;
};

export function LogoUploadField({ label, hint, value, onChange }: Props) {
  const { t } = useI18n();
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleFile(file: File) {
    setError(null);
    if (!file.type.startsWith("image/")) {
      setError(t("settings_logo_error_type"));
      return;
    }
    if (file.size > MAX_SOURCE_BYTES) {
      setError(t("settings_logo_error_size"));
      return;
    }
    setBusy(true);
    try {
      const raw = await readFileAsDataUrl(file);
      const final = file.type === "image/svg+xml" ? raw : await resizeRasterImage(raw);
      if (final.length > MAX_OUTPUT_LENGTH) {
        setError(t("settings_logo_error_too_big_after_resize"));
        return;
      }
      onChange(final);
    } catch {
      setError(t("settings_logo_error_generic"));
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div>
      <label className="block text-xs font-medium text-neutral-400 mb-1">{label}</label>
      {hint && <p className="mb-2 text-xs text-neutral-500">{hint}</p>}
      <div className="flex items-center gap-3">
        <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-neutral-700 bg-neutral-900">
          {value ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={value} alt="" className="max-h-full max-w-full object-contain" />
          ) : (
            <span className="text-2xl text-neutral-700">—</span>
          )}
        </div>
        <div className="flex flex-col gap-1">
          <div className="flex gap-2">
            <button
              type="button"
              disabled={busy}
              onClick={() => inputRef.current?.click()}
              className="rounded-lg border border-neutral-700 px-3 py-1.5 text-xs text-neutral-200 hover:border-accent-500 disabled:opacity-50"
            >
              {busy ? t("settings_logo_uploading") : value ? t("settings_logo_change") : t("settings_logo_upload")}
            </button>
            {value && (
              <button
                type="button"
                onClick={() => onChange(null)}
                className="rounded-lg border border-neutral-700 px-3 py-1.5 text-xs text-neutral-500 hover:border-red-400 hover:text-red-400"
              >
                {t("settings_logo_remove")}
              </button>
            )}
          </div>
          {error && <p className="text-xs text-red-400">{error}</p>}
        </div>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/svg+xml"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
        }}
      />
    </div>
  );
}
