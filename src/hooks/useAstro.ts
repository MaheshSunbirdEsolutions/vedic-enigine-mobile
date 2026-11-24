/** Calculation queries. Each takes birth data and returns a React Query result. */
import { useMutation, useQuery } from "@tanstack/react-query";
import { engineApi, queryKeys, type ReportId } from "@/api";
import { birthOf, nowIn, todayIn } from "@/domain/birth";
import type { Birth, Chart, Dasha, Lang, PanchangRequest, SadeSati } from "@/types/api";

/**
 * While a query for the same kundli in the other language loads, keep showing the previous
 * language's result (no skeleton flash on a language switch). `langIndex` is where the language
 * sits in the query key; every other part must match.
 */
export function keepAcrossLanguage<T>(prev: T | undefined, prevQuery: { queryKey: readonly unknown[] } | undefined, key: readonly unknown[], langIndex: number): T | undefined {
  if (prev === undefined || !prevQuery) return undefined;
  const a = prevQuery.queryKey;
  return a.length === key.length && a.every((v, i) => i === langIndex || v === key[i]) ? prev : undefined;
}

export type ChartBundle = { chart: Chart; dasha: Dasha; sade: SadeSati };

/** Chart, dasha (3 levels, "now" in the birth zone) and Sade Sati, fetched together. */
export function useChartBundle(k: Birth) {
  const b = birthOf(k);
  return useQuery({
    queryKey: queryKeys.chartBundle(b),
    queryFn: async ({ signal }): Promise<ChartBundle> => {
      const [chart, dasha, sade] = await Promise.all([
        engineApi.astro.chart(b, { signal }),
        engineApi.astro.dasha(b, nowIn(b.tz), { signal }),
        engineApi.astro.sadeSati(b, { signal }),
      ]);
      return { chart, dasha, sade };
    },
  });
}

export function useInterpretation(k: Birth, lang: Lang, enabled = true) {
  const b = birthOf(k);
  const queryKey = queryKeys.interpretation(b, lang);
  return useQuery({
    queryKey,
    queryFn: ({ signal }) => engineApi.astro.interpret(b, lang, { signal }),
    placeholderData: (prev, prevQuery) => keepAcrossLanguage(prev, prevQuery, queryKey, 1),
    enabled,
  });
}

/** The plain-language summary report, as of today in the birth zone. */
export function useSimpleReport(k: Birth, lang: Lang, enabled = true) {
  const b = birthOf(k);
  const day = todayIn(b.tz);
  const queryKey = queryKeys.simpleReport(b, lang, day);
  return useQuery({
    queryKey,
    queryFn: ({ signal }) => engineApi.reports.simple({ ...b, lang, at: nowIn(b.tz) }, { signal }),
    placeholderData: (prev, prevQuery) => keepAcrossLanguage(prev, prevQuery, queryKey, 2),
    enabled,
  });
}

/** Panchang runs only once a place is chosen (`req` is null until then). */
export function usePanchang(req: PanchangRequest | null) {
  return useQuery({
    queryKey: req ? queryKeys.panchang(req.day, req.lat, req.lon, req.tz) : ["panchang", "idle"],
    queryFn: ({ signal }) => engineApi.astro.panchang(req!, { signal }),
    enabled: !!req,
  });
}

/** Matching is an explicit user action, so it is a mutation. */
export function useMatch() {
  return useMutation({
    mutationFn: ({ groom, bride }: { groom: Birth; bride: Birth }) => engineApi.astro.match(birthOf(groom), birthOf(bride)),
  });
}

/**
 * One detailed report (POST /report/<id>) for a year, as of now in the birth zone.
 * Switching language keeps the previous text on screen until the new one arrives.
 */
export function useReport<T = unknown>(id: ReportId, k: Birth, lang: Lang, year: number, enabled = true) {
  const b = birthOf(k);
  const day = todayIn(b.tz);
  const queryKey = queryKeys.report(id, b, lang, year, day);
  return useQuery({
    queryKey,
    queryFn: ({ signal }) => engineApi.reports.raw<T>(id, { ...b, lang, year, at: nowIn(b.tz) }, { signal }),
    placeholderData: (prev, prevQuery) => keepAcrossLanguage(prev, prevQuery, queryKey, 2),
    staleTime: 30 * 60_000,
    enabled,
  });
}

/** Which scanned book pages exist on the engine (used for "view page" links). */
export function useBookStatus() {
  return useQuery({ queryKey: queryKeys.bookStatus, queryFn: ({ signal }) => engineApi.reports.bookStatus({ signal }), staleTime: Infinity, retry: false });
}
