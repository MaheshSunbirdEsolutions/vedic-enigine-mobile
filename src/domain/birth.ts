/** Birth-data helpers shared by every feature. Pure functions, no React. */
import type { Birth, ChartSettings, Gender, Kundli } from "@/types/api";
import { to12h } from "./time12";

export const DEFAULT_SETTINGS: ChartSettings = { ayanamsa: "lahiri", node: "mean" };
export const GENDERS = ["male", "female", "other"] as const;

/** Falls back to "other" when gender is missing or not one of the supported values. */
export const normalizeGender = (g?: string | null): Gender =>
  (GENDERS as readonly string[]).includes(g ?? "") ? (g as Gender) : "other";

/** The calculation input of a kundli (drops name, notes, ids…). */
export const birthOf = (k: Birth): Birth => ({
  datetime_local: k.datetime_local,
  tz: k.tz,
  lat: k.lat,
  lon: k.lon,
  settings: k.settings ?? DEFAULT_SETTINGS,
});

/** Wall-clock time in an IANA zone as "YYYY-MM-DDTHH:MM:SS". Falls back to device time for an unknown zone. */
export function nowIn(tz: string, at: Date = new Date()): string {
  try {
    const parts = new Intl.DateTimeFormat("en-CA", {
      timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit",
      hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23",
    }).formatToParts(at);
    const g = (t: string) => parts.find((p) => p.type === t)?.value ?? "00";
    return `${g("year")}-${g("month")}-${g("day")}T${g("hour")}:${g("minute")}:${g("second")}`;
  } catch {
    return localIso(at);
  }
}

/** Device-local "YYYY-MM-DDTHH:MM:SS". */
export function localIso(d: Date): string {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
}

export const todayIn = (tz: string, at?: Date) => nowIn(tz, at).slice(0, 10);

/** Short one-line description used in lists and headers. */
export function describeBirth(k: Kundli): string {
  const t = to12h(k.datetime_local.slice(11, 19));
  return `${k.datetime_local.slice(0, 10)} ${t.time} ${t.meridiem} · ${k.place || `${k.lat.toFixed(3)}, ${k.lon.toFixed(3)}`}`;
}
