import type { Weekday } from "../types/professional";

const WEEKDAY_BY_INDEX: Weekday[] = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];

export function todayISO(): string {
  return toISO(new Date());
}

export function toISO(date: Date): string {
  const y = date.getFullYear();
  const m = (date.getMonth() + 1).toString().padStart(2, "0");
  const d = date.getDate().toString().padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** Evita bug de fuso horário do `new Date("2026-08-25")` (interpreta como UTC). */
export function fromISO(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function addDays(iso: string, days: number): string {
  const date = fromISO(iso);
  date.setDate(date.getDate() + days);
  return toISO(date);
}

export function weekdayOf(iso: string): Weekday {
  return WEEKDAY_BY_INDEX[fromISO(iso).getDay()];
}

const WEEKDAY_NAMES = [
  "domingo",
  "lunes",
  "martes",
  "miércoles",
  "jueves",
  "viernes",
  "sábado",
];

export function formatLongDate(iso: string): string {
  const date = fromISO(iso);
  const weekday = WEEKDAY_NAMES[date.getDay()];
  const day = date.getDate();
  const month = date.toLocaleDateString("es-PY", { month: "long" });
  const year = date.getFullYear();
  return `${weekday}, ${day} de ${month} de ${year}`;
}
