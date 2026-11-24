/** Birth-data helpers shared by every feature. Pure functions, no React. */
import type { Birth, ChartSettings, Kundli } from "@/types/api";

export const DEFAULT_SETTINGS: ChartSettings = { ayanamsa: "lahiri", node: "mean" };

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
export const describeBirth = (k: Kundli) =>
  `${k.datetime_local.replace("T", " ").slice(0, 16)} · ${k.place || `${k.lat.toFixed(3)}, ${k.lon.toFixed(3)}`}`;
