/** Route params for an unsaved kundli (same fields as the web app's /kundli/view query). */
import type { Ayanamsa, Gender, Kundli, NodeType } from "@/types/api";

export type KundliParams = Record<"name" | "dt" | "tz" | "lat" | "lon" | "place" | "ay" | "node" | "gender", string>;

export const kundliToParams = (k: Kundli): KundliParams => ({
  name: k.name || "", dt: k.datetime_local, tz: k.tz, lat: String(k.lat), lon: String(k.lon), place: k.place || "",
  ay: k.settings?.ayanamsa || "lahiri", node: k.settings?.node || "mean", gender: k.gender || "",
});

const AY: Ayanamsa[] = ["lahiri", "raman", "krishnamurti", "true_chitra"];
const GENDERS: Gender[] = ["male", "female", "other", ""];

/** Returns null when required fields are missing or malformed. */
export function kundliFromParams(p: Partial<Record<string, string | string[]>>): Kundli | null {
  const one = (k: string) => { const v = p[k]; return Array.isArray(v) ? v[0] : v; };
  const dt = one("dt"), tz = one("tz"), lat = Number(one("lat")), lon = Number(one("lon"));
  if (!dt || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?$/.test(dt) || !tz || !Number.isFinite(lat) || !Number.isFinite(lon)) return null;
  if (one("lat") === undefined || one("lon") === undefined) return null;
  const ay = one("ay") as Ayanamsa, node = one("node") as NodeType, g = (one("gender") ?? "") as Gender;
  return {
    name: one("name") ?? "", datetime_local: dt.length === 16 ? `${dt}:00` : dt, tz, lat, lon, place: one("place") ?? "",
    gender: GENDERS.includes(g) ? g : "",
    settings: { ayanamsa: AY.includes(ay) ? ay : "lahiri", node: node === "true" ? "true" : "mean" },
  };
}
