/**
 * Response and request shapes of the Vedic Engine API (vedic_engine/api.py).
 * Only the fields the app reads are typed; the engine may send more.
 */

export type Lang = "en" | "hi";
export type Ayanamsa = "lahiri" | "raman" | "krishnamurti" | "true_chitra";
export type NodeType = "mean" | "true";

export type ChartSettings = { ayanamsa: Ayanamsa; node: NodeType };

/** Birth moment + place: local civil time and an IANA time zone. */
export type Birth = {
  datetime_local: string; // "YYYY-MM-DDTHH:MM:SS"
  tz: string;
  lat: number;
  lon: number;
  settings?: ChartSettings;
};

export type Gender = "male" | "female" | "other";

export type Kundli = Birth & {
  id?: string;
  name: string;
  gender?: Gender;
  place?: string;
  notes?: string;
  tags?: string;
  created_at?: string;
  updated_at?: string;
};

export type Place = { name: string; country: string; lat: number; lon: number; tz: string; population?: number };

// ---------- chart ----------
export type NakshatraPos = { index?: number; name: string; pada: number; lord: string };

export type PlanetPos = {
  longitude: number;
  sign: string;
  sign_index: number; // 1..12
  degree_in_sign: string;
  nakshatra: NakshatraPos;
  house: number;
  vargas: Record<string, string>;
  retrograde: boolean;
  dignity: string;
};

export type LagnaPos = Omit<PlanetPos, "retrograde" | "dignity" | "house"> & { house?: number };

export type HouseRow = { house: number; sign: string; lord: string; planets: string[] };

export type Chart = {
  ayanamsa: { name: string; dms: string; value?: number };
  lagna: LagnaPos;
  planets: Record<string, PlanetPos>;
  houses: HouseRow[];
  vargas: Record<string, { lagna: string; planets: Record<string, string> }>;
  doshas: { manglik: { present: boolean }; kaal_sarp: { present: boolean } };
};

// ---------- dasha ----------
export type DashaPeriod = { lord: string; start: string; end: string; sub?: DashaPeriod[] };
export type Dasha = {
  birth_dasha: { lord: string; balance_years: number };
  current: string[];
  mahadashas: DashaPeriod[];
};

// ---------- sade sati ----------
export type SadeSati = {
  moon_sign: string;
  now: { saturn_sign: string; sade_sati: boolean; phase: string | null; dhaiya: string | null };
  periods: { start: string; end: string | null; phases: { sign: string; phase: string; from: string }[] }[];
};

// ---------- interpretation ----------
export type Nature = "benefic" | "challenging" | "mixed" | string;
export type Finding = {
  id: string;
  name: string;
  category: "yoga" | "dosha" | "placement" | string;
  nature: Nature;
  text: string;
  source: string;
  status?: string;
  planets: string[];
};
export type Interpretation = { findings: Finding[]; remedy_tags: string[] };

// ---------- panchang ----------
export type Panchang = {
  date: string;
  tz: string;
  sunrise: string;
  sunset: string;
  vara: string;
  tithi: { number: number; name: string; paksha: string; ends: string };
  nakshatra: { name: string; ends: string };
  yoga: { name: string; ends: string };
  karana: { name: string; ends: string };
  rahu_kaal: { start: string; end: string };
  note?: string;
};
export type PanchangRequest = { day: string; tz: string; lat: number; lon: number };

// ---------- matching ----------
export type Koota = { score: number; max: number; groom?: string; bride?: string; simplified?: boolean };
export type MatchResult = {
  total: number;
  max: number;
  kootas: Record<string, Koota>;
  doshas: { nadi_dosha: boolean; bhakoot_dosha: boolean };
  manglik: { groom: boolean; bride: boolean };
  note?: string;
};

// ---------- reports ----------
export type Rating = "excellent" | "good" | "mixed" | "challenging" | "difficult" | string;
export type SimpleSection = {
  id: string;
  title: string;
  paras?: string[];
  months?: { label: string; rating: Rating; rating_label: string }[];
  items?: { area: string; priority: string; priority_label: string; planet: string; text: string }[];
  plans?: { planet: string; day: string; why: string; steps: string[] }[];
};
export type SimpleReport = {
  as_of: string;
  rating: Rating;
  rating_label: string;
  sections: SimpleSection[];
  closing: string;
};
export type ReportRequest = Birth & { lang: Lang; year?: number; day?: string; at?: string };

// ---------- horoscope & daily report ----------
export type DailyHoroscopeRequest = { day?: string; tz?: string; lat?: number; lon?: number; lang: Lang };

export type DailyTransit = {
  planet: string;
  sign: string;
  nakshatra: string;
  house_from_moon: number;
  house_from_lagna?: number;
  good: boolean;
  bindus?: number | null;
  score: number;
  text: string;
};

export type DailyArea = {
  area: string;
  title: string;
  score: number;
  rating: Rating;
  rating_label: string;
  text?: string;
  reasons: string[];
};

export type DailyTip = {
  planet: string;
  colour: string;
  mantra: string;
  practice: string;
  daana: string;
};

export type DailyPanchangSummary = {
  vara: string;
  vara_lord: string;
  tithi: Panchang["tithi"];
  nakshatra: Panchang["nakshatra"];
  yoga: Panchang["yoga"];
  karana: Panchang["karana"];
  sunrise: string;
  sunset: string;
  rahu_kaal: Panchang["rahu_kaal"];
};

export type DailyRashiWeekItem = {
  date: string;
  weekday: string;
  moon_sign: string;
  nakshatra: string;
  moon_house: number;
  chandrashtama: boolean;
  score: number;
  rating: Rating;
  rating_label: string;
};

export type DailyRashiSign = {
  sign: string;
  sign_index: number;
  lord: string;
  score: number;
  rating: Rating;
  rating_label: string;
  moon_house: number;
  moon_good: boolean;
  chandrashtama: boolean;
  ghat_nakshatra: boolean;
  ghat_nakshatra_name: string;
  saturn_phase?: string | null;
  summary: string;
  overview: string;
  highlights: string[];
  areas: DailyArea[];
  guidance: { favour: string[]; avoid: string[] };
  transits: DailyTransit[];
  week: DailyRashiWeekItem[];
  colour: string;
  lucky_numbers: number[];
  deity: string;
  daana: string;
  tip: string;
  mantra: string;
  favorable_transits: string[];
  care_transits: string[];
  health_watch?: { parts: string; watch: string } | null;
};

export type DailyHoroscopeResponse = {
  date: string;
  tz: string;
  panchang: DailyPanchangSummary;
  moon_sign: string;
  yogas: string[];
  cautions: string[];
  signs: DailyRashiSign[];
  disclaimer: string;
};

export type DailyReportWeekItem = {
  date: string;
  weekday: string;
  vara: string;
  nakshatra: string;
  moon_sign: string;
  house_from_moon: number;
  chandrashtama: boolean;
  tara: string;
  tara_good: boolean | null;
  score: number;
  rating: Rating;
  rating_label: string;
};

export type DailyReport = {
  date: string;
  tz: string;
  score: number;
  rating: Rating;
  rating_label: string;
  summary: string;
  panchang: DailyPanchangSummary;
  chandrabala: {
    moon_sign: string;
    house_from_moon: number;
    house_from_lagna: number;
    favourable: boolean;
    chandrashtama: boolean;
    status: string;
    label: string;
    bindus: number;
    sav: number;
    note: string;
  };
  tarabala?: { index: number; name: string; good: boolean | null; meaning: string } | null;
  yogas: string[];
  cautions: string[];
  dasha_now: string[];
  dasha_reading?: { rating_label: string; [k: string]: unknown } | null;
  sade_sati?: Record<string, unknown>;
  areas: DailyArea[];
  transits: DailyTransit[];
  guidance: { favour: string[]; avoid: string[] };
  daily_tip?: DailyTip | null;
  week: DailyReportWeekItem[];
  method: string;
  disclaimer: string;
};

// ---------- email share ----------
export type EmailStatus = {
  configured: boolean;
  host: string;
  port: number;
  security: string;
  from_email: string;
};

export type EmailHoroscopeRequest = {
  to_email?: string;
  kind: "rashi" | "kundli";
  sign?: string;
  kundli_id?: string;
  name?: string;
  datetime_local?: string;
  tz: string;
  lat: number;
  lon: number;
  settings?: ChartSettings;
  lang: Lang;
  day?: string;
  preview_only?: boolean;
};

export type EmailPreviewResponse = {
  subject: string;
  text: string;
  html: string;
  date: string;
};

export type EmailSendResponse = {
  sent: boolean;
  to: string[];
  subject: string;
  date: string;
  status: EmailStatus;
};

// ---------- ask ----------
export type AskSection = { kind?: string; title: string; paras: string[]; verdict?: string };
export type AskRemedy = { planet: string; approach: string; steps: string[] };
export type AskRef = { book: string; title: string; page_label: string; why?: string; snippet?: string; image?: string };
export type AskResponse = {
  question: string;
  mode: "offline" | "ai";
  ai_text?: string;
  ai_error?: string;
  model?: string;
  sections: AskSection[];
  remedies: AskRemedy[];
  refs: AskRef[];
  note: string;
};
export type AskStatus = { ai: boolean; model: string; key_hint: string | null };
export type AskRequest = Birth & { lang: Lang; at: string; question: string; use_ai: boolean };

// ---------- i18n ----------
export type I18nBundle = { lang: Lang; ui: Record<string, string>; terms: Record<string, string>; abbr: Record<string, string> };
