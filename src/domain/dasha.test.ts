import dasha from "@/__fixtures__/dasha.json";
import type { Dasha } from "@/types/api";
import { currentKeys, flattenDasha, isCurrent, toggleKey } from "./dasha";

const d = dasha as Dasha;
const now = new Date("2026-11-24T10:00:00+05:30");

describe("dasha", () => {
  it("knows whether a period is running", () => {
    expect(isCurrent({ start: "2020-01-01", end: "2030-01-01" }, now)).toBe(true);
    expect(isCurrent({ start: "2027-01-01", end: "2030-01-01" }, now)).toBe(false);
    expect(isCurrent({ start: "2020-01-01", end: null }, now)).toBe(true);
  });

  it("opens the running MD and AD (Jupiter / Saturn for the fixture)", () => {
    const keys = currentKeys(d.mahadashas, now);
    expect(keys.size).toBe(2);
    const rows = flattenDasha(d.mahadashas, keys, now);
    const cur = rows.filter((r) => r.current);
    expect(cur.map((r) => r.lords.at(-1))).toEqual(["Jupiter", "Saturn", "Ketu"]);
    expect(d.current).toEqual(["Jupiter", "Saturn", "Ketu"]);
  });

  it("shows only mahadashas when nothing is expanded, and expands on toggle", () => {
    const collapsed = flattenDasha(d.mahadashas, new Set(), now);
    expect(collapsed).toHaveLength(d.mahadashas.length);
    expect(collapsed.every((r) => r.level === 1)).toBe(true);
    const one = flattenDasha(d.mahadashas, toggleKey(new Set(), "0"), now);
    expect(one).toHaveLength(d.mahadashas.length + d.mahadashas[0].sub!.length);
    expect(toggleKey(new Set(["0"]), "0").size).toBe(0);
  });
});
