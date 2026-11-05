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

// ---- Add-on Break flag -------------------------------------------------
// One break per tournament can be marked as the "Add-on Break": rebuys close
// when it starts and the add-on is sold during it. Marking one unmarks any
// other. After the tournament starts, saved rows are frozen, so a new break
// can only be marked if no saved break already is.

type AddOnRow = OrderableRow & { breakLabel: string; isAddOnBreak: boolean };

const DEFAULT_BREAK_LABELS = ["", "Descanso", "Break"];

export function canToggleAddOnBreak(rows: AddOnRow[], key: string, locked = false): boolean {
  const row = rows.find((r) => r.key === key);
  if (!row || !row.isBreak) return false;
  if (!locked) return true;
  if (row.existing) return false;
  // Locked: a saved Add-on Break can't be changed, so no other can be marked.
  return !rows.some((r) => r.existing && r.isAddOnBreak);
}

export function setAddOnBreak<T extends AddOnRow>(
  rows: T[],
  key: string,
  checked: boolean,
  locked: boolean,
  addOnLabel: string,
  defaultLabel: string
): T[] {
  if (!canToggleAddOnBreak(rows, key, locked)) return rows;
  // A break named after the add-on goes back to the plain default name once it
  // stops being the Add-on Break (a name the organizer typed is left alone).
  const unmark = <R extends AddOnRow>(r: R): R => ({
    ...r,
    isAddOnBreak: false,
    breakLabel: r.breakLabel.trim() === addOnLabel ? defaultLabel : r.breakLabel,
  });
  return rows.map((r) => {
    if (r.key === key) {
      if (!checked) return unmark(r);
      // Give the break a recognizable name unless the organizer already chose one.
      const label = DEFAULT_BREAK_LABELS.includes(r.breakLabel.trim()) ? addOnLabel : r.breakLabel;
      return { ...r, isAddOnBreak: true, breakLabel: label };
    }
    // Only one Add-on Break: unmark the others (never touching saved rows).
    if (checked && r.isAddOnBreak && !(locked && r.existing)) return unmark(r);
    return r;
  });
}
