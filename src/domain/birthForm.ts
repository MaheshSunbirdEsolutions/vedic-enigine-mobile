/**
 * Birth form: zod schema (validation rules), default values and conversion to a Kundli.
 * No React here; the form component binds this to react-hook-form.
 * Every validation message is an i18n key.
 */
import { z } from "zod";
import type { Kundli, Place } from "@/types/api";
import { GENDERS, normalizeGender } from "./birth";
import { to12h, to24h, TIME12_RE } from "./time12";

export function isValidDate(s: string): boolean {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  if (!m) return false;
  const [y, mo, d] = [+m[1], +m[2], +m[3]];
  if (y < 1800 || y > 2200 || mo < 1 || mo > 12 || d < 1) return false;
  return d <= new Date(Date.UTC(y, mo, 0)).getUTCDate();
}

const TZ_RE = /^(UTC|GMT|[A-Za-z_]+(\/[A-Za-z0-9_+-]+)+)$/;

const inRange = (min: number, max: number) => (s: string) => {
  const n = Number(s);
  return s.trim() !== "" && Number.isFinite(n) && n >= min && n <= max;
};

/** Empty → "required" message, otherwise the format message. */
const required = (empty: string, format: string, ok: (s: string) => boolean) =>
  z.string().superRefine((s, ctx) => {
    if (!s.trim()) ctx.addIssue({ code: "custom", message: empty });
    else if (!ok(s.trim())) ctx.addIssue({ code: "custom", message: format });
  });

export const birthFormSchema = z
  .object({
    name: z.string().max(120, "err_name_long"),
    gender: z.enum(GENDERS),
    date: required("err_dt", "err_date_format", isValidDate),
    time: required("err_dt", "err_time_format", (s) => TIME12_RE.test(s)),
    meridiem: z.enum(["AM", "PM"]),
    place: z.custom<Place | null>(),
    lat: z.string().refine(inRange(-90, 90), "err_lat"),
    lon: z.string().refine(inRange(-180, 180), "err_lon"),
    tz: z.string().refine((s) => TZ_RE.test(s.trim()), "err_tz"),
    ayanamsa: z.enum(["lahiri", "raman", "krishnamurti", "true_chitra"]),
    node: z.enum(["mean", "true"]),
    notes: z.string(),
    tags: z.string(),
  })
  // One summary message under the place field while the coordinates are incomplete.
  .superRefine((v, ctx) => {
    const coordsOk = inRange(-90, 90)(v.lat) && inRange(-180, 180)(v.lon) && TZ_RE.test(v.tz.trim());
    if (!coordsOk) ctx.addIssue({ code: "custom", path: ["place"], message: "err_place" });
  });

export type BirthFormValues = z.infer<typeof birthFormSchema>;

export function defaultBirthValues(k?: Partial<Kundli>): BirthFormValues {
  const hasPlace = k?.tz !== undefined && k.lat !== undefined && k.lon !== undefined;
  const t = k?.datetime_local ? to12h(k.datetime_local.slice(11, 19)) : { time: "", meridiem: "AM" as const };
  return {
    name: k?.name ?? "",
    gender: normalizeGender(k?.gender),
    date: k?.datetime_local?.slice(0, 10) ?? "",
    time: t.time,
    meridiem: t.meridiem,
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

/** Values to set when a place is picked from the search. */
export const placeFields = (p: Place) => ({ place: p, lat: String(p.lat), lon: String(p.lon), tz: p.tz });

/** Builds the kundli from values that passed the schema. */
export function toKundli(v: BirthFormValues, id?: string): Kundli {
  const time = to24h(v.time, v.meridiem)!;
  return {
    ...(id ? { id } : {}),
    name: v.name.trim() || `${v.date} ${v.time.trim()} ${v.meridiem}`,
    gender: v.gender,
    place: v.place?.name ?? "",
    datetime_local: `${v.date}T${time}`,
    tz: v.tz.trim(),
    lat: Number(v.lat),
    lon: Number(v.lon),
    settings: { ayanamsa: v.ayanamsa, node: v.node },
    notes: v.notes,
    tags: v.tags,
  };
}

/** Validates without React (used by tests and anywhere a form is checked in code). */
export function validateBirthForm(v: BirthFormValues, id?: string):
  { ok: true; kundli: Kundli } | { ok: false; errors: Partial<Record<keyof BirthFormValues, string>> } {
  const r = birthFormSchema.safeParse(v);
  if (r.success) return { ok: true, kundli: toKundli(r.data, id) };
  const errors: Partial<Record<keyof BirthFormValues, string>> = {};
  for (const i of r.error.issues) {
    const k = i.path[0] as keyof BirthFormValues;
    if (k && !errors[k]) errors[k] = i.message;
  }
  return { ok: false, errors };
}
