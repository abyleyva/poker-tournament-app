// Reordering of breaks within a list of level rows, shared by the
// new-tournament wizard and the admin "Levels" tab.
//
// Only breaks can be moved: blind levels keep their escalating order, and a
// break can be slid up or down past the levels around it to relocate it.
//
// Once a tournament has started (`locked`), rows that already exist on the
// server are frozen and new rows can only live after them (the server
// enforces the same rule), so a freshly added break can move around among the
// other new rows but never above a saved row, and saved breaks can't move.

type OrderableRow = { key: string; isBreak: boolean; existing?: boolean };

/** Index the break would swap with, or null if it can't move that way. */
function moveTarget(rows: OrderableRow[], key: string, direction: -1 | 1, locked: boolean): number | null {
  const idx = rows.findIndex((r) => r.key === key);
  if (idx === -1) return null;
  const row = rows[idx];
  if (!row.isBreak) return null;
  if (locked && row.existing) return null;
  const target = idx + direction;
  if (target < 0 || target >= rows.length) return null;
  if (locked && rows[target].existing) return null;
  return target;
}

export function canMoveBreak(rows: OrderableRow[], key: string, direction: -1 | 1, locked = false): boolean {
  return moveTarget(rows, key, direction, locked) !== null;
}

export function moveBreak<T extends OrderableRow>(rows: T[], key: string, direction: -1 | 1, locked = false): T[] {
  const target = moveTarget(rows, key, direction, locked);
  if (target === null) return rows;
  const idx = rows.findIndex((r) => r.key === key);
  const next = [...rows];
  [next[idx], next[target]] = [next[target], next[idx]];
  return next;
}
