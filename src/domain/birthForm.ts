/**
 * Birth form state and validation, kept out of the UI so it can be unit-tested.
 * Error values are i18n keys.
 */
import type { Ayanamsa, Gender, Kundli, NodeType, Place } from "@/types/api";

export type BirthFormValues = {
  name: string;
  gender: Gender;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM or HH:MM:SS
  place: Place | null;
  lat: string;
  lon: string;
  tz: string;
  ayanamsa: Ayanamsa;
  node: NodeType;
  notes: string;
  tags: string;
};

export type BirthFormErrors = Partial<Record<"date" | "time" | "place" | "lat" | "lon" | "tz", string>>;

export type BirthFormResult = { ok: true; kundli: Kundli } | { ok: false; errors: BirthFormErrors };

export function initialFormValues(k?: Partial<Kundli>): BirthFormValues {
  const hasPlace = k?.tz !== undefined && k.lat !== undefined && k.lon !== undefined;
  return {
    name: k?.name ?? "",
    gender: k?.gender ?? "",
    date: k?.datetime_local?.slice(0, 10) ?? "",
    time: k?.datetime_local?.slice(11, 19) ?? "",
    place: hasPlace ? { name: k!.place ?? "", country: "", lat: k!.lat!, lon: k!.lon!, tz: k!.tz! } : null,
    lat: k?.lat?.toString() ?? "",
    lon: k?.lon?.toString() ?? "",
    tz: k?.tz ?? "",
    ayanamsa: k?.settings?.ayanamsa ?? "lahiri",
    node: k?.settings?.node ?? "mean",
    notes: k?.notes ?? "",
    tags: k?.tags ?? "",
  };
}

/** Picking a place fills the coordinates and zone. */
export const applyPlace = (v: BirthFormValues, p: Place): BirthFormValues => ({
  ...v, place: p, lat: String(p.lat), lon: String(p.lon), tz: p.tz,
});

export function isValidDate(s: string): boolean {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  if (!m) return false;
  const [y, mo, d] = [+m[1], +m[2], +m[3]];
  if (y < 1800 || y > 2200 || mo < 1 || mo > 12 || d < 1) return false;
  const dim = new Date(Date.UTC(y, mo, 0)).getUTCDate();
  return d <= dim;
}

/** Returns "HH:MM:SS" or null. */
export function normalizeTime(s: string): string | null {
  const m = /^(\d{1,2}):(\d{2})(?::(\d{2}))?$/.exec(s.trim());
  if (!m) return null;
  const [h, mi, se] = [+m[1], +m[2], m[3] ? +m[3] : 0];
  if (h > 23 || mi > 59 || se > 59) return null;
  const p = (n: number) => String(n).padStart(2, "0");
  return `${p(h)}:${p(mi)}:${p(se)}`;
}

const TZ_RE = /^(UTC|GMT|[A-Za-z_]+(\/[A-Za-z0-9_+-]+)+)$/;

export function validateBirthForm(v: BirthFormValues, id?: string): BirthFormResult {
  const errors: BirthFormErrors = {};
  if (!isValidDate(v.date)) errors.date = v.date.trim() ? "err_date_format" : "err_dt";
  const time = normalizeTime(v.time);
  if (!time) errors.time = v.time.trim() ? "err_time_format" : "err_dt";
  const lat = Number(v.lat), lon = Number(v.lon), tz = v.tz.trim();
  if (v.lat.trim() === "" || !Number.isFinite(lat) || lat < -90 || lat > 90) errors.lat = "err_lat";
  if (v.lon.trim() === "" || !Number.isFinite(lon) || lon < -180 || lon > 180) errors.lon = "err_lon";
  if (!TZ_RE.test(tz)) errors.tz = "err_tz";
  // One summary message under the place field; the advanced fields get their own short hints.
  if (errors.lat || errors.lon || errors.tz) errors.place = "err_place";
  if (Object.keys(errors).length) return { ok: false, errors };

  return {
    ok: true,
    kundli: {
      ...(id ? { id } : {}),
      name: v.name.trim() || `${v.date} ${time!.slice(0, 5)}`,
      gender: v.gender,
      place: v.place?.name ?? "",
      datetime_local: `${v.date}T${time}`,
      tz,
      lat,
      lon,
      settings: { ayanamsa: v.ayanamsa, node: v.node },
      notes: v.notes,
      tags: v.tags,
    },
  };
}
