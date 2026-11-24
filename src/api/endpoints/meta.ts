import type { HttpClient } from "../client";
import type { I18nBundle, Lang, Place } from "@/types/api";

type Opt = { signal?: AbortSignal };

/** Place search, translations and health check. */
export const metaEndpoints = (c: HttpClient) => ({
  places: (q: string, o: Opt = {}) => c.request<Place[]>("/places", { query: { q, limit: 10 }, signal: o.signal }),
  i18n: (lang: Lang, o: Opt = {}) => c.request<I18nBundle>(`/i18n/${lang}`, { signal: o.signal }),
  health: (o: Opt & { timeoutMs?: number } = {}) =>
    c.request<{ ok: boolean }>("/health", { signal: o.signal, timeoutMs: o.timeoutMs ?? 5000 }),
});
