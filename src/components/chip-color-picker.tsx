"use client";

import { useEffect, useRef, useState } from "react";
import { CHIP_COLOR_IDS, CHIP_COLORS, chipColorLabel } from "@/lib/chip-colors";
import { useI18n } from "@/lib/i18n";
import { PokerChipIcon } from "./poker-chip-icon";

/**
 * Visual replacement for a plain text input in the chip denomination rows:
 * a button showing the selected chip (icon + label) that opens a small grid
 * of the standard casino chip colors to pick from.
 */
export function ChipColorPicker({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (colorId: string) => void;
  placeholder: string;
}) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleClickOutside(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  return (
    <div ref={wrapperRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-2 rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2 text-left text-sm text-white focus:border-accent-500 focus:outline-none"
      >
        {value ? (
          <>
            <PokerChipIcon colorId={value} size={22} />
            <span className="truncate">{chipColorLabel(value, t)}</span>
          </>
        ) : (
          <span className="text-neutral-500">{placeholder}</span>
        )}
        <svg viewBox="0 0 20 20" width="14" height="14" className="ml-auto shrink-0 text-neutral-500" aria-hidden="true">
          <path d="M5 8l5 5 5-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open && (
        <div className="absolute left-0 top-full z-20 mt-1 grid grid-cols-5 gap-2 rounded-xl border border-neutral-700 bg-neutral-900 p-3 shadow-xl">
          {CHIP_COLOR_IDS.map((colorId) => (
            <button
              key={colorId}
              type="button"
              title={t(CHIP_COLORS[colorId].labelKey)}
              aria-label={t(CHIP_COLORS[colorId].labelKey)}
              onClick={() => {
                onChange(colorId);
                setOpen(false);
              }}
              className={`flex items-center justify-center rounded-lg p-1.5 ring-offset-2 ring-offset-neutral-900 transition-all hover:bg-neutral-800 ${
                value === colorId ? "ring-2 ring-white" : "ring-1 ring-transparent"
              }`}
            >
              <PokerChipIcon colorId={colorId} size={28} />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
