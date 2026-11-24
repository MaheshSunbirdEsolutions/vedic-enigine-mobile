/**
 * Date/time display. Engine dates are already local to the chart's zone, so we format the
 * Y-M-D / H:M text directly instead of going through the device time zone.
 */
import type { Lang } from "@/types/api";

const MONTHS: Record<Lang, string[]> = {
  en: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
  hi: ["जन॰", "फ़र॰", "मार्च", "अप्रैल", "मई", "जून", "जुल॰", "अग॰", "सित॰", "अक्टू॰", "नव॰", "दिस॰"],
};

/** "2026-11-24…" → "24 Nov 2026". Returns the input unchanged if it is not a date. */
export function formatDate(iso: string | null | undefined, lang: Lang = "en"): string {
  if (!iso) return "—";
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  if (!m) return iso;
  return `${m[3]} ${MONTHS[lang][+m[2] - 1]} ${m[1]}`;
}

/** "2026-11-24T06:57+05:30" → "06:57"; adds the date when it differs from `refDay`. */
export function formatTime(iso: string | null | undefined, refDay?: string, lang: Lang = "en"): string {
  if (!iso) return "—";
  const hm = iso.slice(11, 16);
  return refDay && iso.slice(0, 10) !== refDay ? `${hm} (${formatDate(iso, lang)})` : hm;
}

export const formatDateTime = (dt: string) => dt.replace("T", " ").slice(0, 16);

/** Engine keys such as "graha_maitri" → "Graha maitri". */
export const humanize = (k: string) => k.replace(/_/g, " ").replace(/^./, (c) => c.toUpperCase());
