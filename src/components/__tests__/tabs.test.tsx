import { fireEvent, screen } from "@testing-library/react-native";
import chart from "@/__fixtures__/chart.json";
import dasha from "@/__fixtures__/dasha.json";
import interp from "@/__fixtures__/interp.json";
import match from "@/__fixtures__/match.json";
import panchang from "@/__fixtures__/panchang.json";
import sade from "@/__fixtures__/sade.json";
import simple from "@/__fixtures__/simple.json";
import { KundliChart } from "@/components/kundli/KundliChart";
import { MatchResultView } from "@/components/match/MatchResultView";
import { PersonPicker } from "@/components/match/PersonPicker";
import { PanchangView } from "@/components/panchang/PanchangView";
import { ChartTab } from "@/components/tabs/ChartTab";
import { DashaTab } from "@/components/tabs/DashaTab";
import { InterpretationTab } from "@/components/tabs/InterpretationTab";
import { SadeSatiTab } from "@/components/tabs/SadeSatiTab";
import { SimpleReportView } from "@/components/tabs/SimpleReportView";
import { usePreferences } from "@/state/preferences";
import { renderWithProviders } from "@/test/render";
import type { Chart, Dasha, Interpretation, MatchResult, Panchang, SadeSati, SimpleReport } from "@/types/api";

const now = new Date("2026-11-24T10:00:00+05:30");

describe("kundli drawing", () => {
  const by = Array.from({ length: 12 }, (_, i) => (i === 0 ? ["Su", "Mo"] : []));
  it.each(["north", "south"] as const)("%s style draws planet labels and the ascendant", async (variant) => {
    await renderWithProviders(<KundliChart testID="k" variant={variant} lagna={0} bySign={by} ascLabel="Asc" />);
    // SVG text is not a host <Text>, so read the rendered tree instead of getByText.
    const tree = JSON.stringify(screen.toJSON());
    for (const label of ["Su", "Mo", "Asc"]) expect(tree).toContain(`"${label}"`);
  });
});

describe("tabs render real engine responses", () => {
  it("chart tab: stats, both charts, planet table; style switch is remembered", async () => {
    await renderWithProviders(<ChartTab chart={chart as unknown as Chart} />);
    expect(screen.getByTestId("chart-D1")).toBeTruthy();
    expect(screen.getByTestId("chart-D9")).toBeTruthy();
    expect(screen.getAllByText("Leo").length).toBeGreaterThan(0); // lagna sign in the fixture
    await fireEvent.press(screen.getByTestId("chart-style-south"));
    expect(usePreferences.getState().chartStyle).toBe("south");
  });

  it("dasha tab: running periods are open and highlighted; rows toggle", async () => {
    await renderWithProviders(<DashaTab dasha={dasha as Dasha} now={now} />);
    expect(screen.getByText(/Jupiter – Saturn/)).toBeTruthy(); // running AD visible
    expect(screen.getByText(/Saturn – Ketu/)).toBeTruthy(); // running PD visible
    await fireEvent.press(screen.getByTestId("dasha-0"));
    expect(screen.getAllByText(/Venus – Venus/).length).toBeTruthy();
  });

  it("interpretation tab groups findings", async () => {
    const d = interp as unknown as Interpretation;
    await renderWithProviders(<InterpretationTab data={d} />);
    expect(screen.getByText(d.findings[0].name)).toBeTruthy();
  });

  it("sade sati tab shows the current status", async () => {
    await renderWithProviders(<SadeSatiTab data={sade as SadeSati} now={now} />);
    expect(screen.getByText("Ashtama (8th)")).toBeTruthy();
  });

  it("simple report renders every section and the remedy plans", async () => {
    const r = simple as unknown as SimpleReport;
    await renderWithProviders(<SimpleReportView report={r} />);
    for (const s of r.sections) expect(screen.getByText(s.title)).toBeTruthy();
    expect(screen.getByText(r.closing)).toBeTruthy();
  });

  it("panchang view shows limbs and times", async () => {
    await renderWithProviders(<PanchangView p={panchang as Panchang} />);
    expect(screen.getByText("06:57")).toBeTruthy();
    expect(screen.getByText("Shukla Purnima (15)")).toBeTruthy();
  });

  it("match result shows the score and verdict", async () => {
    await renderWithProviders(<MatchResultView m={match as MatchResult} />);
    expect(screen.getByTestId("match-total")).toHaveTextContent(/25.5/);
    expect(screen.getByText("Acceptable", { exact: false })).toBeTruthy();
  });

  it("person picker renders clean New kundli button and opens manual birth form", async () => {
    await renderWithProviders(<PersonPicker testID="groom" title="Groom" saved={[]} value={null} onChange={jest.fn()} />);
    expect(screen.getByText("New kundli")).toBeTruthy();
    expect(screen.queryByText(/New kundli\s*…/)).toBeNull();
    await fireEvent.press(screen.getByTestId("groom-manual"));
    expect(screen.getByTestId("birth-form")).toBeTruthy();
  });

  it("works in Hindi", async () => {
    await renderWithProviders(<DashaTab dasha={dasha as Dasha} now={now} />, { lang: "hi" });
    expect(screen.queryByText(/Jupiter – Saturn/)).toBeNull();
    expect(screen.getAllByText(/गुरु|बृहस्पति/).length).toBeGreaterThan(0);
  });
});
