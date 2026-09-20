// Modo de retención que el organizador (tournament director) puede aplicar
// sobre el buy-in (y, opcionalmente, sobre recompras/add-ons) como cuota de
// administración, gestión y logística, antes de calcular la bolsa de premios.
//
// - "none": no se retiene nada (comportamiento por defecto / histórico).
// - "percentage": se retiene un porcentaje del monto pagado (0-100).
// - "fixed": se retiene un monto fijo por pago, nunca mayor al monto pagado.
export type FeeMode = "none" | "percentage" | "fixed";

export const DEFAULT_FEE_MODE: FeeMode = "none";

export const FEE_MODE_IDS: FeeMode[] = ["none", "percentage", "fixed"];

export function isFeeMode(value: unknown): value is FeeMode {
  return value === "none" || value === "percentage" || value === "fixed";
}
