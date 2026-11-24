/** Calculation queries. Each takes birth data and returns a React Query result. */
import { useMutation, useQuery } from "@tanstack/react-query";
import { engineApi, queryKeys } from "@/api";
import { birthOf, nowIn, todayIn } from "@/domain/birth";
import type { Birth, Chart, Dasha, Lang, PanchangRequest, SadeSati } from "@/types/api";

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
  return useQuery({
    queryKey: queryKeys.interpretation(b, lang),
    queryFn: ({ signal }) => engineApi.astro.interpret(b, lang, { signal }),
    enabled,
  });
}

/** The plain-language summary report, as of today in the birth zone. */
export function useSimpleReport(k: Birth, lang: Lang, enabled = true) {
  const b = birthOf(k);
  const day = todayIn(b.tz);
  return useQuery({
    queryKey: queryKeys.simpleReport(b, lang, day),
    queryFn: ({ signal }) => engineApi.reports.simple({ ...b, lang, at: nowIn(b.tz) }, { signal }),
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
