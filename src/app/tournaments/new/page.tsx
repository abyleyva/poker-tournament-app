"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useI18n } from "@/lib/i18n";
import { saveLocalTournament } from "@/lib/local-tournaments";

type LevelRow = {
  key: string;
  isBreak: boolean;
  smallBlind: number | "";
  bigBlind: number | "";
  ante: number | "";
  durationMinutes: number | "";
  breakLabel: string;
};

type PrizeRow = {
  key: string;
  percentage: number | "";
};

const CURRENCIES = ["MXN", "USD", "EUR", "GBP", "CAD", "ARS", "COP", "CLP", "BRL"];

let keyCounter = 0;
function nextKey() {
  keyCounter += 1;
  return `k${keyCounter}`;
}

function defaultLevels(): LevelRow[] {
  const blinds = [
    [25, 50],
    [50, 100],
    [75, 150],
    [100, 200],
    [150, 300],
  ];
  return blinds.map(([sb, bb]) => ({
    key: nextKey(),
    isBreak: false,
    smallBlind: sb,
    bigBlind: bb,
    ante: 0,
    durationMinutes: 15,
    breakLabel: "",
  }));
}

export default function NewTournamentPage() {
  const { t, lang } = useI18n();
  const router = useRouter();

  const [name, setName] = useState("");
  const [currency, setCurrency] = useState("MXN");
  const [language, setLanguage] = useState(lang);
  const [buyIn, setBuyIn] = useState<number | "">(500);
  const [startingStack, setStartingStack] = useState<number | "">(10000);

  const [allowRebuy, setAllowRebuy] = useState(true);
  const [rebuyPrice, setRebuyPrice] = useState<number | "">(500);
  const [rebuyStack, setRebuyStack] = useState<number | "">(10000);
  const [maxRebuys, setMaxRebuys] = useState<number | "">("");

  const [allowAddOn, setAllowAddOn] = useState(false);
  const [addOnPrice, setAddOnPrice] = useState<number | "">(500);
  const [addOnStack, setAddOnStack] = useState<number | "">(15000);

  const [levels, setLevels] = useState<LevelRow[]>(defaultLevels());
  const [linkDurations, setLinkDurations] = useState(false);
  const [prizes, setPrizes] = useState<PrizeRow[]>([
    { key: nextKey(), percentage: 50 },
    { key: nextKey(), percentage: 30 },
    { key: nextKey(), percentage: 20 },
  ]);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const totalPrizePct = useMemo(
    () => prizes.reduce((sum, p) => sum + (typeof p.percentage === "number" ? p.percentage : 0), 0),
    [prizes]
  );

  // Consecutive level numbering that skips breaks entirely (a break never
  // consumes a number, so the next blind level continues the sequence).
  const levelNumbers = useMemo(() => {
    let counter = 0;
    return levels.map((l) => {
      if (l.isBreak) return null;
      counter += 1;
      return counter;
    });
  }, [levels]);

  function updateLevel(key: string, patch: Partial<LevelRow>) {
    setLevels((prev) => prev.map((l) => (l.key === key ? { ...l, ...patch } : l)));
  }

  function updateLevelDuration(key: string, durationMinutes: number | "") {
    if (linkDurations) {
      // "Edit together" mode: this one change applies to every level and break.
      setLevels((prev) => prev.map((l) => ({ ...l, durationMinutes })));
    } else {
      updateLevel(key, { durationMinutes });
    }
  }

  function addLevel() {
    const last = [...levels].reverse().find((l) => !l.isBreak);
    setLevels((prev) => [
      ...prev,
      {
        key: nextKey(),
        isBreak: false,
        smallBlind: last ? Number(last.smallBlind) * 2 : 25,
        bigBlind: last ? Number(last.bigBlind) * 2 : 50,
        ante: last ? last.ante : 0,
        durationMinutes: last ? last.durationMinutes : 15,
        breakLabel: "",
      },
    ]);
  }

  function addBreak() {
    setLevels((prev) => [
      ...prev,
      {
        key: nextKey(),
        isBreak: true,
        smallBlind: "",
        bigBlind: "",
        ante: "",
        durationMinutes: 15,
        breakLabel: lang === "es" ? "Descanso" : "Break",
      },
    ]);
  }

  function removeLevel(key: string) {
    setLevels((prev) => prev.filter((l) => l.key !== key));
  }

  function addPrize() {
    setPrizes((prev) => [...prev, { key: nextKey(), percentage: 0 }]);
  }

  function updatePrize(key: string, percentage: number | "") {
    setPrizes((prev) => prev.map((p) => (p.key === key ? { ...p, percentage } : p)));
  }

  function removePrize(key: string) {
    setPrizes((prev) => prev.filter((p) => p.key !== key));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const payload = {
        name,
        language,
        currency,
        buyIn: Number(buyIn) || 0,
        startingStack: Number(startingStack) || 0,
        allowRebuy,
        rebuyPrice: allowRebuy ? Number(rebuyPrice) || 0 : null,
        rebuyStack: allowRebuy ? Number(rebuyStack) || 0 : null,
        maxRebuys: allowRebuy && maxRebuys !== "" ? Number(maxRebuys) : null,
        allowAddOn,
        addOnPrice: allowAddOn ? Number(addOnPrice) || 0 : null,
        addOnStack: allowAddOn ? Number(addOnStack) || 0 : null,
        levels: levels.map((l, idx) => ({
          order: idx,
          isBreak: l.isBreak,
          smallBlind: l.isBreak ? null : Number(l.smallBlind) || 0,
          bigBlind: l.isBreak ? null : Number(l.bigBlind) || 0,
          ante: l.isBreak ? null : Number(l.ante) || 0,
          durationMinutes: Number(l.durationMinutes) || 1,
          breakLabel: l.isBreak ? l.breakLabel || "Descanso" : null,
        })),
        prizes: prizes.map((p, idx) => ({
          position: idx + 1,
          percentage: Number(p.percentage) || 0,
        })),
      };

      const res = await fetch("/api/tournaments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || t("wizard_error_generic"));

      saveLocalTournament({
        id: json.id,
        name: json.name,
        adminToken: json.adminToken,
        createdAt: new Date().toISOString(),
      });

      router.push(`/tournaments/${json.id}/admin?admin=${json.adminToken}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("wizard_error_generic"));
      setSubmitting(false);
    }
  }

  const inputClass =
    "w-full rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2 text-white placeholder-neutral-500 focus:border-emerald-500 focus:outline-none";
  const labelClass = "block text-sm font-medium text-neutral-300 mb-1";
  const sectionClass = "rounded-2xl border border-neutral-800 bg-neutral-900/50 p-6";

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-2xl font-bold text-white mb-6">{t("wizard_title")}</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        <section className={sectionClass}>
          <h2 className="text-lg font-semibold text-white mb-4">{t("wizard_section_general")}</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className={labelClass}>{t("wizard_name")}</label>
              <input
                className={inputClass}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t("wizard_name_placeholder")}
                required
              />
            </div>
            <div>
              <label className={labelClass}>{t("wizard_currency")}</label>
              <select className={inputClass} value={currency} onChange={(e) => setCurrency(e.target.value)}>
                {CURRENCIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>{t("wizard_language")}</label>
              <select
                className={inputClass}
                value={language}
                onChange={(e) => setLanguage(e.target.value as "es" | "en")}
              >
                <option value="es">Español</option>
                <option value="en">English</option>
              </select>
            </div>
          </div>
        </section>

        <section className={sectionClass}>
          <h2 className="text-lg font-semibold text-white mb-4">{t("wizard_section_entries")}</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className={labelClass}>{t("wizard_buyIn")}</label>
              <input
                type="number"
                min={0}
                className={inputClass}
                value={buyIn}
                onChange={(e) => setBuyIn(e.target.value === "" ? "" : Number(e.target.value))}
              />
            </div>
            <div>
              <label className={labelClass}>{t("wizard_startingStack")}</label>
              <input
                type="number"
                min={0}
                className={inputClass}
                value={startingStack}
                onChange={(e) => setStartingStack(e.target.value === "" ? "" : Number(e.target.value))}
              />
            </div>
          </div>

          <div className="mt-5 rounded-xl border border-neutral-800 p-4">
            <label className="flex items-center gap-2 text-white font-medium">
              <input type="checkbox" checked={allowRebuy} onChange={(e) => setAllowRebuy(e.target.checked)} />
              {t("wizard_allowRebuy")}
            </label>
            {allowRebuy && (
              <div className="mt-3 grid gap-4 sm:grid-cols-3">
                <div>
                  <label className={labelClass}>{t("wizard_rebuyPrice")}</label>
                  <input
                    type="number"
                    min={0}
                    className={inputClass}
                    value={rebuyPrice}
                    onChange={(e) => setRebuyPrice(e.target.value === "" ? "" : Number(e.target.value))}
                  />
                </div>
                <div>
                  <label className={labelClass}>{t("wizard_rebuyStack")}</label>
                  <input
                    type="number"
                    min={0}
                    className={inputClass}
                    value={rebuyStack}
                    onChange={(e) => setRebuyStack(e.target.value === "" ? "" : Number(e.target.value))}
                  />
                </div>
                <div>
                  <label className={labelClass}>{t("wizard_maxRebuys")}</label>
                  <input
                    type="number"
                    min={0}
                    className={inputClass}
                    value={maxRebuys}
                    onChange={(e) => setMaxRebuys(e.target.value === "" ? "" : Number(e.target.value))}
                  />
                </div>
              </div>
            )}
          </div>

          <div className="mt-4 rounded-xl border border-neutral-800 p-4">
            <label className="flex items-center gap-2 text-white font-medium">
              <input type="checkbox" checked={allowAddOn} onChange={(e) => setAllowAddOn(e.target.checked)} />
              {t("wizard_allowAddOn")}
            </label>
            {allowAddOn && (
              <div className="mt-3 grid gap-4 sm:grid-cols-2">
                <div>
                  <label className={labelClass}>{t("wizard_addOnPrice")}</label>
                  <input
                    type="number"
                    min={0}
                    className={inputClass}
                    value={addOnPrice}
                    onChange={(e) => setAddOnPrice(e.target.value === "" ? "" : Number(e.target.value))}
                  />
                </div>
                <div>
                  <label className={labelClass}>{t("wizard_addOnStack")}</label>
                  <input
                    type="number"
                    min={0}
                    className={inputClass}
                    value={addOnStack}
                    onChange={(e) => setAddOnStack(e.target.value === "" ? "" : Number(e.target.value))}
                  />
                </div>
              </div>
            )}
          </div>
        </section>

        <section className={sectionClass}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">{t("wizard_section_levels")}</h2>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setLinkDurations((v) => !v)}
                title={t("wizard_level_link_duration_hint")}
                aria-pressed={linkDurations}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                  linkDurations
                    ? "bg-emerald-600 text-white hover:bg-emerald-500"
                    : "border border-neutral-700 text-neutral-200 hover:border-neutral-500"
                }`}
              >
                🔗 {t("wizard_level_link_duration")}
              </button>
              <button type="button" onClick={addLevel} className="rounded-lg bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-500">
                {t("wizard_level_add")}
              </button>
              <button type="button" onClick={addBreak} className="rounded-lg border border-neutral-700 px-3 py-1.5 text-sm text-neutral-200 hover:border-neutral-500">
                {t("wizard_level_add_break")}
              </button>
            </div>
          </div>
          {linkDurations && (
            <p className="mb-3 text-xs text-emerald-400">{t("wizard_level_link_duration_hint")}</p>
          )}

          <div className="space-y-3">
            {levels.map((l, idx) => (
              <div
                key={l.key}
                className={`rounded-xl border p-3 ${l.isBreak ? "border-amber-700/60 bg-amber-900/10" : "border-neutral-800"}`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-neutral-300">
                    {l.isBreak ? t("wizard_level_break") : t("wizard_level_number", { n: levelNumbers[idx] ?? idx + 1 })}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeLevel(l.key)}
                    className="text-xs text-neutral-500 hover:text-red-400"
                  >
                    {t("wizard_level_remove")}
                  </button>
                </div>
                {l.isBreak ? (
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <label className={labelClass}>{t("wizard_level_break_label")}</label>
                      <input
                        className={inputClass}
                        value={l.breakLabel}
                        onChange={(e) => updateLevel(l.key, { breakLabel: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className={labelClass}>{t("wizard_level_duration")}</label>
                      <input
                        type="number"
                        min={1}
                        className={inputClass}
                        value={l.durationMinutes}
                        onChange={(e) =>
                          updateLevelDuration(l.key, e.target.value === "" ? "" : Number(e.target.value))
                        }
                      />
                    </div>
                  </div>
                ) : (
                  <div className="grid gap-3 sm:grid-cols-4">
                    <div>
                      <label className={labelClass}>{t("wizard_level_small")}</label>
                      <input
                        type="number"
                        min={0}
                        className={inputClass}
                        value={l.smallBlind}
                        onChange={(e) =>
                          updateLevel(l.key, { smallBlind: e.target.value === "" ? "" : Number(e.target.value) })
                        }
                      />
                    </div>
                    <div>
                      <label className={labelClass}>{t("wizard_level_big")}</label>
                      <input
                        type="number"
                        min={0}
                        className={inputClass}
                        value={l.bigBlind}
                        onChange={(e) =>
                          updateLevel(l.key, { bigBlind: e.target.value === "" ? "" : Number(e.target.value) })
                        }
                      />
                    </div>
                    <div>
                      <label className={labelClass}>{t("wizard_level_ante")}</label>
                      <input
                        type="number"
                        min={0}
                        className={inputClass}
                        value={l.ante}
                        onChange={(e) =>
                          updateLevel(l.key, { ante: e.target.value === "" ? "" : Number(e.target.value) })
                        }
                      />
                    </div>
                    <div>
                      <label className={labelClass}>{t("wizard_level_duration")}</label>
                      <input
                        type="number"
                        min={1}
                        className={inputClass}
                        value={l.durationMinutes}
                        onChange={(e) =>
                          updateLevelDuration(l.key, e.target.value === "" ? "" : Number(e.target.value))
                        }
                      />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        <section className={sectionClass}>
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-lg font-semibold text-white">{t("wizard_section_prizes")}</h2>
            <button type="button" onClick={addPrize} className="rounded-lg bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-500">
              {t("wizard_prize_add")}
            </button>
          </div>
          <p className="text-sm text-neutral-400 mb-4">{t("wizard_prizes_hint")}</p>

          <div className="space-y-2">
            {prizes.map((p, idx) => (
              <div key={p.key} className="flex items-center gap-3">
                <span className="w-24 text-sm text-neutral-300">{t("wizard_prize_position", { n: idx + 1 })}</span>
                <input
                  type="number"
                  min={0}
                  max={100}
                  className={inputClass}
                  value={p.percentage}
                  onChange={(e) => updatePrize(p.key, e.target.value === "" ? "" : Number(e.target.value))}
                />
                <span className="text-neutral-400">%</span>
                <button
                  type="button"
                  onClick={() => removePrize(p.key)}
                  className="text-xs text-neutral-500 hover:text-red-400"
                >
                  {t("wizard_level_remove")}
                </button>
              </div>
            ))}
          </div>

          <p className={`mt-3 text-sm ${totalPrizePct === 100 ? "text-emerald-400" : "text-amber-400"}`}>
            {t("wizard_prize_total")}: {totalPrizePct}%{totalPrizePct !== 100 ? ` — ${t("wizard_prize_total_warning")}` : ""}
          </p>
        </section>

        {error && <p className="text-red-400 text-sm">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-xl bg-emerald-600 px-6 py-3 font-semibold text-white hover:bg-emerald-500 disabled:opacity-60 transition-colors"
        >
          {submitting ? t("wizard_submitting") : t("wizard_submit")}
        </button>
      </form>
    </div>
  );
}
