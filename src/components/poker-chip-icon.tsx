import { CHIP_COLORS, isChipColorId } from "@/lib/chip-colors";

/**
 * Small SVG rendering of a physical poker chip — a colored disc with edge
 * marks and a dashed inner ring — used by the chip color picker in the
 * "Fichas" tab so colors are chosen visually instead of typed as text.
 */
export function PokerChipIcon({
  colorId,
  size = 28,
  className,
}: {
  colorId: string;
  size?: number;
  className?: string;
}) {
  // Any legacy/custom text value that isn't one of the fixed palette ids
  // falls back to a neutral gray chip, so the picker never breaks on old data.
  const def = isChipColorId(colorId) ? CHIP_COLORS[colorId] : CHIP_COLORS.gray;
  const edgeMarks = Array.from({ length: 8 }, (_, i) => i * 45);

  return (
    <svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      className={className}
      aria-hidden="true"
    >
      <circle cx="50" cy="50" r="47" fill={def.hex} stroke="rgba(0,0,0,0.35)" strokeWidth="1.5" />
      {edgeMarks.map((angle) => (
        <rect
          key={angle}
          x="46"
          y="3"
          width="8"
          height="16"
          rx="2"
          fill={def.accent}
          transform={`rotate(${angle} 50 50)`}
        />
      ))}
      <circle
        cx="50"
        cy="50"
        r="31"
        fill="none"
        stroke={def.accent}
        strokeWidth="3.5"
        strokeDasharray="7 6"
        opacity="0.9"
      />
    </svg>
  );
}
