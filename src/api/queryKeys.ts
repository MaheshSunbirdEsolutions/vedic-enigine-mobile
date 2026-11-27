/**
 * React Query keys in one place, so invalidation is consistent.
 * Birth-dependent keys use `birthKey` so an edited kundli refetches its charts.
 */
import type { Birth, Lang } from "@/types/api";

export const birthKey = (b: Birth) =>
  [b.datetime_local, b.tz, b.lat, b.lon, b.settings?.ayanamsa ?? "lahiri", b.settings?.node ?? "mean"] as const;

export const queryKeys = {
  kundlis: {
    all: ["kundlis"] as const,
    list: (q: string) => ["kundlis", "list", q] as const,
    detail: (id: string) => ["kundlis", "detail", id] as const,
  },
  chartBundle: (b: Birth) => ["chart-bundle", ...birthKey(b)] as const,
  interpretation: (b: Birth, lang: Lang) => ["interpret", lang, ...birthKey(b)] as const,
  simpleReport: (b: Birth, lang: Lang, day: string) => ["report", "simple", lang, day, ...birthKey(b)] as const,
  dailyReport: (b: Birth, lang: Lang, day: string) => ["report", "daily", lang, day, ...birthKey(b)] as const,
  /** Detailed reports; the language sits at index 2 (see keepAcrossLanguage). */
  report: (id: string, b: Birth, lang: Lang, year: number, day: string) => ["report", id, lang, year, day, ...birthKey(b)] as const,
  bookStatus: ["books-status"] as const,
  panchang: (day: string, lat: number, lon: number, tz: string) => ["panchang", day, lat, lon, tz] as const,
  dailyHoroscope: (day: string, lat: number, lon: number, tz: string, lang: Lang) =>
    ["horoscope", "daily", lang, day, lat, lon, tz] as const,
  emailStatus: ["email-status"] as const,
  match: (g: Birth, b: Birth) => ["match", ...birthKey(g), ...birthKey(b)] as const,
  places: (q: string) => ["places", q] as const,
  i18n: (lang: Lang) => ["i18n", lang] as const,
  askStatus: ["ask-status"] as const,
  health: (url: string) => ["health", url] as const,
  me: ["me"] as const,
};
