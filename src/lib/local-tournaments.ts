"use client";

export type LocalTournamentRef = {
  id: string;
  name: string;
  adminToken: string;
  createdAt: string;
};

const KEY = "poker-tournament-my-tournaments";

export function listLocalTournaments(): LocalTournamentRef[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as LocalTournamentRef[]) : [];
  } catch {
    return [];
  }
}

export function saveLocalTournament(ref: LocalTournamentRef) {
  if (typeof window === "undefined") return;
  const list = listLocalTournaments().filter((t) => t.id !== ref.id);
  list.unshift(ref);
  window.localStorage.setItem(KEY, JSON.stringify(list.slice(0, 50)));
}

export function removeLocalTournament(id: string) {
  if (typeof window === "undefined") return;
  const list = listLocalTournaments().filter((t) => t.id !== id);
  window.localStorage.setItem(KEY, JSON.stringify(list));
}
