import type { HttpClient } from "../client";
import type { Birth, Chart, Dasha, Interpretation, Lang, MatchResult, Panchang, PanchangRequest, SadeSati } from "@/types/api";

type Opt = { signal?: AbortSignal };

/** Calculations: chart, dasha, sade sati, interpretation, panchang, matching. */
export const astroEndpoints = (c: HttpClient) => ({
  chart: (b: Birth, o: Opt = {}) => c.request<Chart>("/chart", { body: b, signal: o.signal }),
  dasha: (b: Birth, at: string, o: Opt = {}) =>
    c.request<Dasha>("/dasha", { body: { ...b, levels: 3, at }, signal: o.signal }),
  sadeSati: (b: Birth, o: Opt = {}) => c.request<SadeSati>("/sade-sati", { body: b, signal: o.signal }),
  interpret: (b: Birth, lang: Lang, o: Opt = {}) =>
    c.request<Interpretation>("/interpret", { body: { ...b, lang }, signal: o.signal }),
  panchang: (p: PanchangRequest, o: Opt = {}) => c.request<Panchang>("/panchang", { body: p, signal: o.signal }),
  match: (groom: Birth, bride: Birth, o: Opt = {}) =>
    c.request<MatchResult>("/match", { body: { groom, bride }, signal: o.signal }),
});
