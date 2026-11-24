/** Turning an engine chart into what the kundli drawings need. */
import type { Chart } from "@/types/api";

export const SIGNS = [
  "Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo",
  "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces",
] as const;

export const PLANET_ORDER = ["Sun", "Moon", "Mars", "Mercury", "Jupiter", "Venus", "Saturn", "Rahu", "Ketu"];

export const signIndex = (sign: string) => SIGNS.indexOf(sign as (typeof SIGNS)[number]);

/** Planet → 0-based sign, for a divisional chart. */
export function placementsFor(c: Chart, varga: "D1" | "D9"): { lagna: number; planets: Record<string, number> } {
  if (varga === "D1") {
    return {
      lagna: c.lagna.sign_index - 1,
      planets: Object.fromEntries(Object.entries(c.planets).map(([p, v]) => [p, v.sign_index - 1])),
    };
  }
  const v = c.vargas.D9;
  return {
    lagna: signIndex(v.lagna),
    planets: Object.fromEntries(Object.entries(v.planets).map(([p, s]) => [p, signIndex(s)])),
  };
}

/** Rahu and Ketu are always retrograde, so they are not marked. */
export const retrogrades = (c: Chart): Record<string, boolean> =>
  Object.fromEntries(Object.entries(c.planets).map(([p, v]) => [p, v.retrograde && p !== "Rahu" && p !== "Ketu"]));

/** Labels to draw in each sign (0..11). */
export function labelsBySign(
  planets: Record<string, number>,
  abbr: (p: string) => string,
  retro: Record<string, boolean> = {},
  retroMark = "ᴿ",
): string[][] {
  const by: string[][] = Array.from({ length: 12 }, () => []);
  for (const p of PLANET_ORDER.filter((x) => x in planets).concat(Object.keys(planets).filter((x) => !PLANET_ORDER.includes(x)))) {
    const s = planets[p];
    if (s >= 0 && s < 12) by[s].push(abbr(p) + (retro[p] ? retroMark : ""));
  }
  return by;
}

/** Sign shown in house i (0-based) of a North Indian chart. */
export const northHouseSign = (lagna: number, house: number) => (lagna + house) % 12;
