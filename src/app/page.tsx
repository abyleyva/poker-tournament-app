"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useI18n } from "@/lib/i18n";
import { listLocalTournaments, removeLocalTournament, type LocalTournamentRef } from "@/lib/local-tournaments";

export default function HomePage() {
  const { t } = useI18n();
  const [tournaments, setTournaments] = useState<LocalTournamentRef[]>([]);

  useEffect(() => {
    setTournaments(listLocalTournaments());
  }, []);

  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <div className="text-center mb-10">
        <h1 className="text-3xl sm:text-4xl font-bold text-white">{t("appName")}</h1>
        <p className="mt-2 text-neutral-400">{t("tagline")}</p>
        <Link
          href="/tournaments/new"
          className="mt-6 inline-block rounded-xl bg-emerald-600 px-6 py-3 font-semibold text-white hover:bg-emerald-500 transition-colors"
        >
          {t("home_create_cta")}
        </Link>
      </div>

      <div className="rounded-2xl border border-neutral-800 bg-neutral-900/50 p-6">
        <h2 className="text-xl font-semibold text-white">{t("home_title")}</h2>
        <p className="mt-1 text-sm text-neutral-400">{t("home_subtitle")}</p>

        {tournaments.length === 0 ? (
          <p className="mt-6 text-neutral-500">{t("home_empty")}</p>
        ) : (
          <ul className="mt-6 divide-y divide-neutral-800">
            {tournaments.map((tour) => (
              <li key={tour.id} className="flex flex-wrap items-center justify-between gap-3 py-4">
                <div>
                  <p className="font-medium text-white">{tour.name}</p>
                  <p className="text-xs text-neutral-500">
                    {new Date(tour.createdAt).toLocaleString()}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Link
                    href={`/tournaments/${tour.id}/admin?admin=${tour.adminToken}`}
                    className="rounded-lg bg-emerald-600/90 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-500 transition-colors"
                  >
                    {t("home_open_admin")}
                  </Link>
                  <Link
                    href={`/tournaments/${tour.id}/display`}
                    className="rounded-lg border border-neutral-700 px-3 py-1.5 text-sm text-neutral-200 hover:border-neutral-500 transition-colors"
                  >
                    {t("home_open_display")}
                  </Link>
                  <button
                    type="button"
                    onClick={() => {
                      removeLocalTournament(tour.id);
                      setTournaments(listLocalTournaments());
                    }}
                    className="rounded-lg px-3 py-1.5 text-sm text-neutral-500 hover:text-red-400 transition-colors"
                  >
                    {t("home_forget")}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
