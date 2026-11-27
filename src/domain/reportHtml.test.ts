import en from "@/__fixtures__/i18n_en.json";
import full from "@/__fixtures__/reports/full.json";
import issues from "@/__fixtures__/reports/issues.json";
import lalkitab from "@/__fixtures__/reports/lal-kitab.json";
import lifeAreas from "@/__fixtures__/reports/life-areas.json";
import lifelong from "@/__fixtures__/reports/lifelong.json";
import nakshatra from "@/__fixtures__/reports/nakshatra.json";
import tirtha from "@/__fixtures__/reports/tirtha.json";
import varshphal from "@/__fixtures__/reports/varshphal.json";
import yearly from "@/__fixtures__/reports/yearly.json";
import bhrigu from "@/__fixtures__/reports/bhrigu.json";
import simple from "@/__fixtures__/simple.json";
import { createTranslator } from "@/i18n/translate";
import type { I18nBundle, Kundli } from "@/types/api";
import { buildReportHtml, type ReportExportKey } from "./reportHtml";

const kundli: Kundli = {
  id: "k1",
  name: "Mahesh",
  datetime_local: "1980-12-27T22:46:00",
  tz: "Asia/Kolkata",
  lat: 31.71,
  lon: 76.93,
  place: "Mandi",
};

const translator = createTranslator("en", en as I18nBundle);

const dailySample = {
  date: "2026-11-27",
  rating: "good",
  rating_label: "Good",
  summary: "2026-11-27: overall a Good day.",
  panchang: {
    vara: "Friday",
    tithi: { paksha: "Shukla", name: "Tritiya" },
    nakshatra: { name: "Mrigashira", ends: "2026-11-27T14:20:00+05:30" },
    rahu_kaal: { start: "2026-11-27T10:30:00+05:30", end: "2026-11-27T12:00:00+05:30" },
  },
  chandrabala: { moon_sign: "Gemini", house_from_moon: 3, label: "Favourable", bindus: 5 },
  tarabala: { name: "Mitra", good: true, meaning: "Friendly" },
  dasha_now: ["Jupiter", "Saturn", "Ketu"],
  guidance: { favour: ["Routine work"], avoid: ["Rahu Kaal"] },
  daily_tip: { planet: "Venus", colour: "cream", practice: "Stay calm", mantra: "Om", daana: "White rice" },
  areas: [{ area: "career", title: "Career", rating: "good", rating_label: "Good", reasons: ["Supportive Moon"] }],
  transits: [{ planet: "Moon", sign: "Gemini", nakshatra: "Mrigashira", house_from_moon: 3, house_from_lagna: 11, bindus: 5, text: "Favourable" }],
  method: "Chandrabala + Tarabala",
  disclaimer: "General tendencies.",
};

describe("buildReportHtml", () => {
  const cases: [ReportExportKey, string, unknown, string][] = [
    ["simple", "Simple summary", simple, simple.sections[0].title],
    ["daily", "Daily horoscope", dailySample, dailySample.summary],
    ["lifepred", "Life-long prediction", lifelong, lifelong.story.chapters[0].title],
    ["yearpred", "Year-wise prediction", yearly, "2026: overall a challenging year."],
    ["issues", "Current issues", issues, "Health &amp; vitality"],
    ["wrong", "Dosha analysis", full, full.afflictions[0].text],
    ["full", "Full kundli", full, "<svg"],
    ["life", "Life areas", lifeAreas, "Career &amp; profession"],
    ["varsh", "Varshphal", varshphal, "<svg"],
    ["lk", "Lal Kitab", lalkitab, "<svg"],
    ["nak", "Nakshatra", nakshatra, nakshatra.janma_nakshatra],
    ["tirtha", "Temples & tantra", tirtha, tirtha.suggested[0].name],
    ["bhrigu", "Bhrigu Samhita", bhrigu, bhrigu.source],
  ];

  it.each(cases)("builds unique printable HTML for %s", (key, title, data, marker) => {
    const html = buildReportHtml({ key, title, kundli, data, translator, year: 2026 });
    expect(html).toContain("<!DOCTYPE html>");
    expect(html).toContain("Mahesh");
    expect(html).toContain(title.replace(/&/g, "&amp;"));
    expect(html).toContain(marker);
  });

  it("produces distinct content for wrong (dosha) and full sub-tabs sharing one endpoint", () => {
    const wrongHtml = buildReportHtml({ key: "wrong", title: "Dosha analysis", kundli, data: full, translator });
    const fullHtml = buildReportHtml({ key: "full", title: "Full kundli", kundli, data: full, translator });
    expect(wrongHtml).not.toEqual(fullHtml);
    expect(wrongHtml).not.toContain("<svg");
    expect(fullHtml).toContain("<svg");
  });
});
