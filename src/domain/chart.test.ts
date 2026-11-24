import chart from "@/__fixtures__/chart.json";
import type { Chart } from "@/types/api";
import { labelsBySign, northHouseSign, placementsFor, retrogrades, signIndex } from "./chart";
import { labelPositions } from "./chartGeometry";

const c = chart as unknown as Chart;
const abbr = (p: string) => p.slice(0, 2);

describe("chart helpers", () => {
  it("maps D1 and D9 placements to 0-based signs", () => {
    const d1 = placementsFor(c, "D1");
    expect(d1.lagna).toBe(c.lagna.sign_index - 1);
    expect(d1.planets.Sun).toBe(c.planets.Sun.sign_index - 1);
    const d9 = placementsFor(c, "D9");
    expect(d9.lagna).toBe(signIndex(c.vargas.D9.lagna));
    expect(Object.keys(d9.planets)).toHaveLength(9);
  });

  it("places every planet exactly once and marks retrogrades (not nodes)", () => {
    const retro = retrogrades(c);
    expect(retro.Rahu).toBe(false);
    expect(retro.Ketu).toBe(false);
    const by = labelsBySign(placementsFor(c, "D1").planets, abbr, { ...retro, Saturn: true }, "R");
    expect(by).toHaveLength(12);
    expect(by.flat()).toHaveLength(9);
    expect(by.flat()).toContain("SaR");
  });

  it("rotates North Indian signs from the lagna", () => {
    expect(northHouseSign(4, 0)).toBe(4);
    expect(northHouseSign(10, 3)).toBe(1);
  });

  it("stacks labels in two columns beyond three planets", () => {
    expect(labelPositions([100, 100], 1)).toEqual([[100, 100]]);
    const four = labelPositions([100, 100], 4);
    expect(new Set(four.map((p) => p[0]))).toEqual(new Set([82, 118]));
  });
});
