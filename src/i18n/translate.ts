/** Pure lookup functions, so translation rules are testable without React. */
import type { I18nBundle, Lang } from "@/types/api";
import { ABBR_EN, FALLBACK, MOBILE } from "./strings";

export type Translator = {
  lang: Lang;
  /** UI string by key. */
  t: (key: string) => string;
  /** Jyotish term (planet, sign, nakshatra…). English is the canonical value. */
  T: (term?: string | null) => string;
  /** Chart abbreviation of a planet. */
  abbr: (planet: string) => string;
};

export function createTranslator(lang: Lang, bundle?: I18nBundle | null): Translator {
  const ui = bundle?.ui ?? {};
  const terms = bundle?.terms ?? {};
  const ab = bundle?.abbr ?? {};
  return {
    lang,
    t: (k) => MOBILE[lang][k] ?? ui[k] ?? FALLBACK[lang][k] ?? MOBILE.en[k] ?? FALLBACK.en[k] ?? k,
    T: (v) => (v == null ? "" : lang === "en" ? v : terms[v] ?? v),
    abbr: (p) => (lang === "en" ? ABBR_EN[p] ?? p.slice(0, 2) : ab[p] ?? ABBR_EN[p] ?? p.slice(0, 2)),
  };
}
