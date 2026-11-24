import en from "@/__fixtures__/i18n_en.json";
import hi from "@/__fixtures__/i18n_hi.json";
import type { I18nBundle } from "@/types/api";
import { FALLBACK, MOBILE } from "./strings";
import { createTranslator } from "./translate";

describe("translator", () => {
  it("prefers mobile wording, then the engine bundle, then fallbacks, then the key", () => {
    const t = createTranslator("en", en as I18nBundle).t;
    expect(t("engine_down")).toMatch(/Settings/); // mobile override, not the web's "start-engine.bat"
    expect(t("tab_chart")).toBe("Chart");
    expect(t("no_such_key")).toBe("no_such_key");
    expect(createTranslator("hi", null).t("nav_home")).toBe("कुंडलियाँ"); // engine down → fallback
    expect(createTranslator("hi", null).t("retry")).toBe("फिर कोशिश करें");
  });

  it("translates terms and abbreviations only in Hindi", () => {
    const e = createTranslator("en", en as I18nBundle), h = createTranslator("hi", hi as I18nBundle);
    expect(e.T("Saturn")).toBe("Saturn");
    expect(h.T("Saturn")).not.toBe("Saturn");
    expect(e.abbr("Saturn")).toBe("Sa");
    expect(h.abbr("Saturn")).toBe((hi as I18nBundle).abbr.Saturn);
    expect(h.T(null)).toBe("");
  });

  it("has every mobile key in both languages", () => {
    expect(Object.keys(MOBILE.hi).sort()).toEqual(Object.keys(MOBILE.en).sort());
    expect(Object.keys(FALLBACK.hi).sort()).toEqual(Object.keys(FALLBACK.en).sort());
  });
});
