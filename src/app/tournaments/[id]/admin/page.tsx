"use client";

import { Suspense, useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { useI18n } from "@/lib/i18n";
import { useTournamentPoll } from "@/lib/use-tournament-poll";
import { formatClock, formatCurrency, secondsUntilNextBreak } from "@/lib/tournament-logic";
import { saveLocalTournament } from "@/lib/local-tournaments";
import { TournamentTimeline } from "@/components/tournament-timeline";
import { THEME_COLOR_IDS, THEME_COLORS, themeVars, type ThemeColorId } from "@/lib/theme";

export default function AdminPage() {
  return (
    <Suspense fallback={<div className="p-8 text-neutral-400">...</div>}>
      <AdminPageInner />
    </Suspense>
  );
}

function useLiveCountdown(remainingSeconds: number, isRunning: boolean) {
  const [display, setDisplay] = useState(remainingSeconds);
  useEffect(() => setDisplay(remainingSeconds), [remainingSeconds]);
  useEffect(() => {
    if (!isRunning) return;
    const id = setInterval(() => setDisplay((d) => Math.max(0, d - 1)), 1000);
    return () => clearInterval(id);
  }, [isRunning]);
  return display;
}

function CopyButton({ value, label, copiedLabel }: { value: string; label: string; copiedLabel: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value);
        } catch {
          // ignore
        }
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }}
      className="rounded-lg border border-neutral-700 px-2.5 py-1 text-xs text-neutral-200 hover:border-accent-500 transition-colors shrink-0"
    >
      {copied ? copiedLabel : label}
    </button>
  );
}

function AdminPageInner() {
  const { t, lang } = useI18n();
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const adminToken = searchParams.get("admin") ?? "";
  const id = params.id;

  const { data, error, loading, setData } = useTournamentPoll<any>(
    id ? `/api/tournaments/${id}?admin=${adminToken}` : null,
    2500
  );

  const [tab, setTab] = useState<"clock" | "players" | "prizes" | "settings">("clock");

  useEffect(() => {
    if (data?.isAdmin && data?.name) {
      saveLocalTournament({ id, name: data.name, adminToken, createdAt: new Date().toISOString() });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data?.name]);

  async function control(action: string, extra?: Record<string, unknown>) {
    const res = await fetch(`/api/tournaments/${id}/control`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ adminToken, action, ...extra }),
    });
    const json = await res.json();
    if (res.ok) setData(json);
    else alert(json.error);
  }

  if (loading && !data) return <div className="p-10 text-neutral-400">{t("common_loading")}</div>;
  if (error && !data)
    return <div className="p-10 text-red-400">{t("common_error")}: {error}</div>;
  if (!data) return null;

  if (!data.isAdmin) {
    return <div className="p-10 text-red-400">Token de administrador inválido.</div>;
  }

  const currentLevel = data.levels[data.currentLevelIndex];
  const nextLevel = data.levels[data.currentLevelIndex + 1];

  return (
    <div className="mx-auto max-w-5xl px-4 py-8" style={themeVars(data.themeColor)}>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <h1 className="text-2xl font-bold text-white">{data.name}</h1>
        <span className="rounded-full bg-neutral-800 px-3 py-1 text-xs font-medium text-neutral-300">
          {t(`clock_status_${data.status}` as any)}
        </span>
      </div>

      <div className="mb-6 grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-neutral-800 bg-neutral-900/50 p-3 flex items-center justify-between gap-2">
          <div className="min-w-0">
            <p className="text-xs text-neutral-500">{t("admin_share_display")}</p>
            <p className="truncate text-sm text-neutral-200">{data.displayUrl}</p>
          </div>
          <CopyButton value={data.displayUrl} label={t("admin_copy")} copiedLabel={t("admin_copied")} />
        </div>
        <div className="rounded-xl border border-amber-800/50 bg-amber-900/10 p-3 flex items-center justify-between gap-2">
          <div className="min-w-0">
            <p className="text-xs text-amber-500/80">{t("admin_share_admin")}</p>
            <p className="truncate text-sm text-neutral-200">{data.adminUrl}</p>
          </div>
          <CopyButton value={data.adminUrl} label={t("admin_copy")} copiedLabel={t("admin_copied")} />
        </div>
      </div>

      <div className="flex gap-2 border-b border-neutral-800 mb-6">
        {(["clock", "players", "prizes", "settings"] as const).map((tabKey) => (
          <button
            key={tabKey}
            onClick={() => setTab(tabKey)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              tab === tabKey
                ? "border-accent-500 text-white"
                : "border-transparent text-neutral-400 hover:text-white"
            }`}
          >
            {t(`admin_tab_${tabKey}` as any)}
          </button>
        ))}
      </div>

      {tab === "clock" && (
        <ClockTab data={data} currentLevel={currentLevel} nextLevel={nextLevel} onControl={control} />
      )}
      {tab === "players" && <PlayersTab data={data} id={id} adminToken={adminToken} setData={setData} />}
      {tab === "prizes" && <PrizesTab data={data} />}
      {tab === "settings" && <SettingsTab data={data} id={id} adminToken={adminToken} setData={setData} />}
    </div>
  );
}

function ClockTab({ data, currentLevel, nextLevel, onControl }: any) {
  const { t } = useI18n();
  const isRunning = data.status === "running";
  const isPaused = data.status === "paused";
  const canSeek = isRunning || isPaused;
  const display = useLiveCountdown(data.remainingSeconds, isRunning);
  const isLowTime = isRunning && display <= 30;
  const secondsToBreak = secondsUntilNextBreak(data.levels, data.currentLevelIndex, display);

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-neutral-800 bg-neutral-900/50 p-8 text-center">
        {data.status === "finished" ? (
          <p className="text-2xl font-bold text-accent-400">{t("clock_status_finished")}</p>
        ) : !currentLevel ? (
          <p className="text-neutral-400">{t("clock_no_levels")}</p>
        ) : (
          <>
            <p className="text-sm uppercase tracking-wide text-neutral-500 mb-2">
              {currentLevel.isBreak ? currentLevel.breakLabel : t("clock_current_level")}
            </p>
            <p className={`text-6xl font-mono font-bold ${isLowTime ? "clock-warning text-red-400" : "text-white"}`}>
              {formatClock(display)}
            </p>
            {!currentLevel.isBreak && (
              <p className="mt-4 text-2xl text-accent-400 font-semibold">
                {currentLevel.smallBlind}/{currentLevel.bigBlind}
                {currentLevel.ante ? ` (${t("clock_ante")} ${currentLevel.ante})` : ""}
              </p>
            )}
            {nextLevel && (
              <p className="mt-2 text-sm text-neutral-500">
                {t("clock_next_level")}:{" "}
                {nextLevel.isBreak
                  ? nextLevel.breakLabel
                  : `${nextLevel.smallBlind}/${nextLevel.bigBlind}${nextLevel.ante ? ` (${t("clock_ante")} ${nextLevel.ante})` : ""}`}
              </p>
            )}

            {canSeek && (
              <div className="mt-6">
                <TournamentTimeline
                  levels={data.levels}
                  currentLevelIndex={data.currentLevelIndex}
                  remainingSeconds={display}
                  interactive
                  onSeek={(seconds) => onControl("seek", { seekSeconds: seconds })}
                />
                <p className="mt-2 text-xs text-neutral-500">
                  {t("clock_timeline_hint")} ·{" "}
                  {currentLevel.isBreak
                    ? t("clock_on_break")
                    : secondsToBreak == null
                    ? t("clock_no_more_breaks")
                    : t("clock_next_break_in", { n: Math.max(1, Math.ceil(secondsToBreak / 60)) })}
                </p>
              </div>
            )}
          </>
        )}
      </div>

      <div className="flex flex-wrap gap-2 justify-center">
        {data.status === "draft" && (
          <button onClick={() => onControl("start")} className="rounded-xl bg-accent-600 px-5 py-2.5 font-semibold text-white hover:bg-accent-500">
            {t("clock_start")}
          </button>
        )}
        {data.status === "running" && (
          <button onClick={() => onControl("pause")} className="rounded-xl bg-amber-600 px-5 py-2.5 font-semibold text-white hover:bg-amber-500">
            {t("clock_pause")}
          </button>
        )}
        {data.status === "paused" && (
          <button onClick={() => onControl("resume")} className="rounded-xl bg-accent-600 px-5 py-2.5 font-semibold text-white hover:bg-accent-500">
            {t("clock_resume")}
          </button>
        )}
        {(data.status === "running" || data.status === "paused") && (
          <>
            <button onClick={() => onControl("prev")} className="rounded-xl border border-neutral-700 px-5 py-2.5 font-medium text-neutral-200 hover:border-neutral-500">
              {t("clock_prev")}
            </button>
            <button onClick={() => onControl("next")} className="rounded-xl border border-neutral-700 px-5 py-2.5 font-medium text-neutral-200 hover:border-neutral-500">
              {t("clock_next")}
            </button>
          </>
        )}
        {data.status !== "draft" && (
          <button
            onClick={() => {
              if (confirm("¿Reiniciar el reloj del torneo? / Reset the tournament clock?")) onControl("reset");
            }}
            className="rounded-xl border border-red-800 px-5 py-2.5 font-medium text-red-400 hover:border-red-600"
          >
            {t("clock_reset")}
          </button>
        )}
      </div>

      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="rounded-xl border border-neutral-800 bg-neutral-900/50 p-4">
          <p className="text-2xl font-bold text-white">{data.stats.activeCount}</p>
          <p className="text-xs text-neutral-500">{t("clock_players_left")}</p>
        </div>
        <div className="rounded-xl border border-neutral-800 bg-neutral-900/50 p-4">
          <p className="text-2xl font-bold text-white">{data.stats.averageStack.toLocaleString()}</p>
          <p className="text-xs text-neutral-500">{t("clock_avg_stack")}</p>
        </div>
        <div className="rounded-xl border border-neutral-800 bg-neutral-900/50 p-4">
          <p className="text-2xl font-bold text-white">{formatCurrency(data.prizePool, data.currency, "es-MX")}</p>
          <p className="text-xs text-neutral-500">{t("clock_prize_pool")}</p>
        </div>
      </div>
    </div>
  );
}

function PlayersTab({ data, id, adminToken, setData }: any) {
  const { t } = useI18n();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);

  async function addPlayer(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setBusy(true);
    const res = await fetch(`/api/tournaments/${id}/players`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ adminToken, name, email }),
    });
    const json = await res.json();
    setBusy(false);
    if (res.ok) {
      setData(json);
      setName("");
      setEmail("");
    } else alert(json.error);
  }

  async function patchPlayer(playerId: string, patch: any) {
    const res = await fetch(`/api/tournaments/${id}/players/${playerId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ adminToken, ...patch }),
    });
    const json = await res.json();
    if (res.ok) setData(json);
    else alert(json.error);
  }

  async function removePlayer(playerId: string) {
    if (!confirm("¿Quitar a este jugador? / Remove this player?")) return;
    const res = await fetch(`/api/tournaments/${id}/players/${playerId}?adminToken=${adminToken}`, {
      method: "DELETE",
    });
    const json = await res.json();
    if (res.ok) setData(json);
    else alert(json.error);
  }

  const inputClass = "w-full rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2 text-white text-sm focus:border-accent-500 focus:outline-none";

  return (
    <div className="space-y-6">
      <form onSubmit={addPlayer} className="rounded-2xl border border-neutral-800 bg-neutral-900/50 p-5">
        <h3 className="font-semibold text-white mb-3">{t("players_add_title")}</h3>
        <div className="grid gap-3 sm:grid-cols-[2fr_2fr_auto]">
          <input className={inputClass} placeholder={t("players_name")} value={name} onChange={(e) => setName(e.target.value)} />
          <input className={inputClass} placeholder={t("players_email")} value={email} onChange={(e) => setEmail(e.target.value)} />
          <button
            type="submit"
            disabled={busy || !name.trim()}
            className="rounded-lg bg-accent-600 px-4 py-2 text-sm font-semibold text-white hover:bg-accent-500 disabled:opacity-50"
          >
            {t("players_add_cta")}
          </button>
        </div>
      </form>

      {data.players.length === 0 ? (
        <p className="text-neutral-500">{t("players_none")}</p>
      ) : (
        <div className="space-y-3">
          {data.players.map((p: any) => (
            <div key={p.id} className="rounded-2xl border border-neutral-800 bg-neutral-900/50 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-white">{p.name}</span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs ${
                      p.status === "active" ? "bg-accent-900/50 text-accent-300" : "bg-neutral-800 text-neutral-400"
                    }`}
                  >
                    {p.status === "active" ? t("players_status_active") : t("players_status_eliminated")}
                  </span>
                  {p.requestedRebuy && (
                    <span className="rounded-full bg-amber-900/50 px-2 py-0.5 text-xs text-amber-300">
                      {t("players_requested_rebuy")}
                    </span>
                  )}
                  <span className="text-xs text-neutral-500">{p.joined ? t("players_joined") : t("players_not_joined")}</span>
                </div>
                <button onClick={() => removePlayer(p.id)} className="text-xs text-neutral-500 hover:text-red-400">
                  {t("players_remove")}
                </button>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 mb-3">
                <div className="flex items-center gap-2 text-sm text-neutral-300">
                  <span className="text-neutral-500">{t("players_chip_count")}:</span>
                  <input
                    type="number"
                    defaultValue={p.chipCount ?? 0}
                    onBlur={(e) => patchPlayer(p.id, { chipCount: Number(e.target.value) })}
                    className="w-28 rounded-lg border border-neutral-700 bg-neutral-900 px-2 py-1 text-white"
                  />
                </div>
                <div className="text-sm text-neutral-400">
                  {t("players_rebuys")}: {p.rebuysCount} · {t("players_addons")}: {p.addOnsCount}
                  {p.finishPosition ? ` · ${t("players_finish_position")}: ${p.finishPosition}` : ""}
                </div>
              </div>

              {p.inviteUrl && (
                <div className="mb-3 flex items-center gap-2">
                  <span className="text-xs text-neutral-500 shrink-0">{t("players_invite_link")}:</span>
                  <span className="truncate text-xs text-neutral-300">{p.inviteUrl}</span>
                  <CopyButton value={p.inviteUrl} label={t("admin_copy")} copiedLabel={t("admin_copied")} />
                </div>
              )}

              <div className="flex flex-wrap gap-2">
                {data.allowRebuy && p.status === "active" && (
                  <button
                    onClick={() => patchPlayer(p.id, { rebuy: true })}
                    className="rounded-lg border border-neutral-700 px-3 py-1.5 text-xs text-neutral-200 hover:border-accent-500"
                  >
                    {t("players_rebuy_cta")}
                  </button>
                )}
                {data.allowAddOn && p.status === "active" && (
                  <button
                    onClick={() => patchPlayer(p.id, { addOn: true })}
                    className="rounded-lg border border-neutral-700 px-3 py-1.5 text-xs text-neutral-200 hover:border-accent-500"
                  >
                    {t("players_addon_cta")}
                  </button>
                )}
                {p.status === "active" ? (
                  <button
                    onClick={() => {
                      const posStr = prompt(t("players_finish_position") + "?");
                      const finishPosition = posStr ? Number(posStr) : null;
                      patchPlayer(p.id, { eliminate: true, finishPosition });
                    }}
                    className="rounded-lg border border-red-800 px-3 py-1.5 text-xs text-red-400 hover:border-red-600"
                  >
                    {t("players_eliminate")}
                  </button>
                ) : (
                  <button
                    onClick={() => patchPlayer(p.id, { reactivate: true })}
                    className="rounded-lg border border-neutral-700 px-3 py-1.5 text-xs text-neutral-200 hover:border-accent-500"
                  >
                    {t("players_reactivate")}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function PrizesTab({ data }: any) {
  const { t } = useI18n();
  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-neutral-800 bg-neutral-900/50 p-5">
        <p className="text-sm text-neutral-400">{t("prizes_pool")}</p>
        <p className="text-3xl font-bold text-white">{formatCurrency(data.prizePool, data.currency, "es-MX")}</p>
      </div>

      {data.payouts.length === 0 ? (
        <p className="text-neutral-500">{t("prizes_none")}</p>
      ) : (
        <table className="w-full overflow-hidden rounded-2xl border border-neutral-800 text-sm">
          <thead className="bg-neutral-900 text-neutral-400">
            <tr>
              <th className="px-4 py-2 text-left">{t("prizes_place")}</th>
              <th className="px-4 py-2 text-left">{t("prizes_percentage")}</th>
              <th className="px-4 py-2 text-left">{t("prizes_amount")}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-800 bg-neutral-900/40">
            {data.payouts.map((p: any) => (
              <tr key={p.position}>
                <td className="px-4 py-2 text-white">#{p.position}</td>
                <td className="px-4 py-2 text-neutral-300">{p.percentage}%</td>
                <td className="px-4 py-2 font-medium text-accent-400">
                  {formatCurrency(p.amount, data.currency, "es-MX")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

function SettingsTab({ data, id, adminToken, setData }: any) {
  const { t } = useI18n();
  const [form, setForm] = useState({
    name: data.name,
    currency: data.currency,
    buyIn: data.buyIn,
    startingStack: data.startingStack,
    allowRebuy: data.allowRebuy,
    rebuyPrice: data.rebuyPrice ?? 0,
    rebuyStack: data.rebuyStack ?? data.startingStack,
    allowAddOn: data.allowAddOn,
    addOnPrice: data.addOnPrice ?? 0,
    addOnStack: data.addOnStack ?? data.startingStack,
    themeColor: (data.themeColor ?? "emerald") as ThemeColorId,
  });
  const [saved, setSaved] = useState(false);
  const locked = data.status !== "draft";

  async function save(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch(`/api/tournaments/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ adminToken, ...form }),
    });
    const json = await res.json();
    if (res.ok) {
      setData(json);
      setSaved(true);
      setTimeout(() => setSaved(false), 1500);
    } else alert(json.error);
  }

  const inputClass = "w-full rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2 text-white text-sm focus:border-accent-500 focus:outline-none disabled:opacity-50";
  const labelClass = "block text-xs font-medium text-neutral-400 mb-1";

  return (
    <form onSubmit={save} className="space-y-5 rounded-2xl border border-neutral-800 bg-neutral-900/50 p-6">
      <h3 className="font-semibold text-white">{t("settings_title")}</h3>
      {locked && <p className="text-xs text-amber-400">{t("settings_locked_hint")}</p>}

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={labelClass}>{t("wizard_name")}</label>
          <input className={inputClass} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </div>
        <div>
          <label className={labelClass}>{t("wizard_currency")}</label>
          <input className={inputClass} value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })} disabled={locked} />
        </div>
        <div>
          <label className={labelClass}>{t("wizard_buyIn")}</label>
          <input type="number" className={inputClass} value={form.buyIn} onChange={(e) => setForm({ ...form, buyIn: Number(e.target.value) })} />
        </div>
        <div>
          <label className={labelClass}>{t("wizard_startingStack")}</label>
          <input
            type="number"
            className={inputClass}
            value={form.startingStack}
            onChange={(e) => setForm({ ...form, startingStack: Number(e.target.value) })}
            disabled={locked}
          />
        </div>
      </div>

      <div className="rounded-xl border border-neutral-800 p-4">
        <label className="flex items-center gap-2 text-white text-sm font-medium">
          <input type="checkbox" checked={form.allowRebuy} onChange={(e) => setForm({ ...form, allowRebuy: e.target.checked })} />
          {t("wizard_allowRebuy")}
        </label>
        {form.allowRebuy && (
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <div>
              <label className={labelClass}>{t("wizard_rebuyPrice")}</label>
              <input type="number" className={inputClass} value={form.rebuyPrice} onChange={(e) => setForm({ ...form, rebuyPrice: Number(e.target.value) })} />
            </div>
            <div>
              <label className={labelClass}>{t("wizard_rebuyStack")}</label>
              <input type="number" className={inputClass} value={form.rebuyStack} onChange={(e) => setForm({ ...form, rebuyStack: Number(e.target.value) })} />
            </div>
          </div>
        )}
      </div>

      <div className="rounded-xl border border-neutral-800 p-4">
        <label className="flex items-center gap-2 text-white text-sm font-medium">
          <input type="checkbox" checked={form.allowAddOn} onChange={(e) => setForm({ ...form, allowAddOn: e.target.checked })} />
          {t("wizard_allowAddOn")}
        </label>
        {form.allowAddOn && (
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <div>
              <label className={labelClass}>{t("wizard_addOnPrice")}</label>
              <input type="number" className={inputClass} value={form.addOnPrice} onChange={(e) => setForm({ ...form, addOnPrice: Number(e.target.value) })} />
            </div>
            <div>
              <label className={labelClass}>{t("wizard_addOnStack")}</label>
              <input type="number" className={inputClass} value={form.addOnStack} onChange={(e) => setForm({ ...form, addOnStack: Number(e.target.value) })} />
            </div>
          </div>
        )}
      </div>

      <div className="rounded-xl border border-neutral-800 p-4">
        <label className={labelClass}>{t("settings_theme_color")}</label>
        <p className="mb-3 text-xs text-neutral-500">{t("settings_theme_color_hint")}</p>
        <div className="flex flex-wrap gap-3">
          {THEME_COLOR_IDS.map((colorId) => (
            <button
              key={colorId}
              type="button"
              title={THEME_COLORS[colorId].label}
              aria-label={THEME_COLORS[colorId].label}
              onClick={() => setForm({ ...form, themeColor: colorId })}
              className={`h-9 w-9 rounded-full ring-offset-2 ring-offset-neutral-900 transition-all ${
                form.themeColor === colorId ? "ring-2 ring-white scale-110" : "ring-1 ring-white/10 hover:ring-white/40"
              }`}
              style={{ backgroundColor: THEME_COLORS[colorId].swatch }}
            />
          ))}
        </div>
      </div>

      <button type="submit" className="rounded-xl bg-accent-600 px-5 py-2.5 font-semibold text-white hover:bg-accent-500">
        {saved ? t("settings_saved") : t("settings_save")}
      </button>
    </form>
  );
}
