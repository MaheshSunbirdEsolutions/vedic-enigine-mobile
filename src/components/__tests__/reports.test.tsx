/**
 * Every report renders a real engine response (fixtures from POST /report/<id>), and the
 * Reports tab offers all 12 categories with the same labels as the web app.
 */
import { fireEvent, screen, waitFor } from "@testing-library/react-native";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import full from "@/__fixtures__/reports/full.json";
import issues from "@/__fixtures__/reports/issues.json";
import issuesHi from "@/__fixtures__/reports/issues.hi.json";
import lalkitab from "@/__fixtures__/reports/lal-kitab.json";
import lifeAreas from "@/__fixtures__/reports/life-areas.json";
import lifelong from "@/__fixtures__/reports/lifelong.json";
import nakshatra from "@/__fixtures__/reports/nakshatra.json";
import tirtha from "@/__fixtures__/reports/tirtha.json";
import varshphal from "@/__fixtures__/reports/varshphal.json";
import yearly from "@/__fixtures__/reports/yearly.json";
import bhrigu from "@/__fixtures__/reports/bhrigu.json";
import chart from "@/__fixtures__/chart.json";
import dasha from "@/__fixtures__/dasha.json";
import sade from "@/__fixtures__/sade.json";
import simple from "@/__fixtures__/simple.json";
import en from "@/__fixtures__/i18n_en.json";
import {
  BhriguReport, DoshaReport, FullReport, IssuesReport, LalKitabReport, LifeAreasReport, LifelongReport,
  NakshatraReport, TirthaReport, VarshphalReport, YearlyReport,
} from "@/components/reports/ReportViews";
import { REPORTS, ReportsTab } from "@/components/tabs/ReportsTab";
import { renderWithProviders } from "@/test/render";

const books = { lalkitab: 251, bhrigu: 531 };

jest.mock("expo-print", () => ({
  printAsync: jest.fn().mockResolvedValue(undefined),
  printToFileAsync: jest.fn().mockResolvedValue({ uri: "file:///tmp/report.pdf" }),
}));

jest.mock("expo-sharing", () => ({
  isAvailableAsync: jest.fn().mockResolvedValue(true),
  shareAsync: jest.fn().mockResolvedValue(undefined),
}));

jest.mock("@/api", () => ({
  ...jest.requireActual("@/api"),
  engineApi: {
    astro: { chart: jest.fn(), dasha: jest.fn(), sadeSati: jest.fn() },
    reports: { simple: jest.fn(), daily: jest.fn(), raw: jest.fn(), bookStatus: jest.fn() },
    email: { status: jest.fn(), previewHoroscope: jest.fn(), sendHoroscope: jest.fn() },
  },
}));
const mockApi = jest.requireMock("@/api").engineApi;

describe("report views render real engine data", () => {
  const cases: [string, () => React.ReactElement, string][] = [
    ["life-long", () => <LifelongReport r={lifelong} />, lifelong.story.chapters[0].title],
    ["year-wise", () => <YearlyReport r={yearly} onYear={() => {}} />, yearly.summary],
    ["current issues", () => <IssuesReport r={issues} />, `1. ${issues.issues[0].area_name}`],
    ["dosha analysis", () => <DoshaReport r={full} />, full.afflictions[0].text],
    ["full kundli", () => <FullReport r={full} />, full.placements[0].text],
    ["life areas", () => <LifeAreasReport r={lifeAreas} />, lifeAreas.areas[0].title],
    ["varshphal", () => <VarshphalReport r={varshphal} books={books} />, en.ui.tp],
    ["lal kitab", () => <LalKitabReport r={lalkitab} books={books} />, en.ui.lk_note],
    ["nakshatra", () => <NakshatraReport r={nakshatra} />, en.ui.taras],
    ["temples & tantra", () => <TirthaReport r={tirtha} />, tirtha.suggested[0].name],
    ["bhrigu", () => <BhriguReport r={bhrigu} books={books} />, bhrigu.source],
  ];
  it.each(cases)("%s", async (_name, ui, expected) => {
    await renderWithProviders(ui());
    expect(screen.getAllByText(expected, { exact: false }).length).toBeGreaterThan(0);
  });

  it("renders the Hindi payload in Hindi", async () => {
    await renderWithProviders(<IssuesReport r={issuesHi} />, { lang: "hi" });
    expect(screen.getAllByText(issuesHi.issues[0].area_name, { exact: false }).length).toBeGreaterThan(0);
  });

  it("collapsible sections open on tap", async () => {
    await renderWithProviders(<LifelongReport r={lifelong} />);
    expect(screen.getByTestId("life-story-grid")).toBeTruthy();
    for (const c of lifelong.story.chapters) {
      expect(screen.getAllByText(c.lord, { exact: false }).length).toBeGreaterThan(0);
    }
    expect(screen.queryByText(lifelong.overview.text)).toBeNull();
    await fireEvent.press(screen.getByText(en.ui.detailed_analysis));
    expect(screen.getByText(lifelong.overview.text)).toBeTruthy();
  });
});

describe("Reports tab", () => {
  const K = { id: "k1", name: "Mahesh", datetime_local: "1980-12-27T22:46:00", tz: "Asia/Kolkata", lat: 31.71, lon: 76.93, place: "Mandi" };
  beforeEach(() => {
    mockApi.astro.chart.mockResolvedValue(chart);
    mockApi.astro.dasha.mockResolvedValue(dasha);
    mockApi.astro.sadeSati.mockResolvedValue(sade);
    mockApi.reports.simple.mockResolvedValue(simple);
    mockApi.reports.bookStatus.mockResolvedValue(books);
    mockApi.reports.raw.mockImplementation((id: string) => Promise.resolve({ lifelong, yearly }[id as "lifelong" | "yearly"]));
  });

  it("offers all 13 reports without Expand all", async () => {
    await renderWithProviders(<ReportsTab kundli={K} />);
    expect(REPORTS).toHaveLength(13);
    for (const r of REPORTS) expect(screen.getByTestId(`report-${r.key}`)).toBeTruthy();
    expect(screen.queryByTestId("expand-all")).toBeNull();
    expect(screen.queryByText(/web app/i)).toBeNull();
  });

  it("shows Print and Download PDF only after each sub-tab finishes loading and exports unique content", async () => {
    let resolveYearly!: (v: unknown) => void;
    mockApi.reports.raw.mockImplementation((id: string) =>
      id === "yearly" ? new Promise((r) => { resolveYearly = r; }) : Promise.resolve(lifelong),
    );
    await renderWithProviders(<ReportsTab kundli={K} />);
    expect(await screen.findByTestId("report-print-simple")).toBeTruthy();
    expect(screen.getByTestId("report-download-simple")).toBeTruthy();

    await fireEvent.press(screen.getByTestId("report-yearpred"));
    expect(screen.queryByTestId("report-print-yearpred")).toBeNull();
    expect(screen.queryByTestId("report-download-yearpred")).toBeNull();

    resolveYearly(yearly);
    expect(await screen.findByTestId("report-print-yearpred")).toBeTruthy();
    expect(screen.getByTestId("report-download-yearpred")).toBeTruthy();

    await fireEvent.press(screen.getByTestId("report-print-yearpred"));
    await waitFor(() => expect(Print.printAsync).toHaveBeenCalledWith({ html: expect.stringContaining("2026: overall a challenging year.") }));

    await fireEvent.press(screen.getByTestId("report-download-yearpred"));
    await waitFor(() => expect(Print.printToFileAsync).toHaveBeenCalledWith({ html: expect.stringContaining("2026: overall a challenging year.") }));
    await waitFor(() => expect(Sharing.shareAsync).toHaveBeenCalledWith("file:///tmp/report.pdf", expect.objectContaining({ mimeType: "application/pdf" })));
  });

  it("loads the chosen report and its year", async () => {
    await renderWithProviders(<ReportsTab kundli={K} />);
    await fireEvent.press(screen.getByTestId("report-yearpred"));
    await waitFor(() => expect(screen.getByText(yearly.summary)).toBeTruthy());
    await fireEvent.press(screen.getByTestId("year-next"));
    await waitFor(() => expect(mockApi.reports.raw).toHaveBeenLastCalledWith("yearly", expect.objectContaining({ year: new Date().getFullYear() + 1 }), expect.anything()));
  });

  it("loads the daily horoscope report sub-tab", async () => {
    mockApi.reports.daily.mockResolvedValue({
      date: "2026-11-27",
      tz: "Asia/Kolkata",
      score: 1.2,
      rating: "good",
      rating_label: "Good",
      summary: "Personalized daily report summary",
      panchang: {
        vara: "Friday",
        vara_lord: "Venus",
        tithi: { number: 3, name: "Tritiya", paksha: "Shukla", ends: "2026-11-27T18:00:00+05:30" },
        nakshatra: { name: "Mrigashira", ends: "2026-11-27T15:10:00+05:30" },
        yoga: { name: "Shubha", ends: "2026-11-27T20:00:00+05:30" },
        karana: { name: "Taitila", ends: "2026-11-27T12:00:00+05:30" },
        sunrise: "2026-11-27T06:53:00+05:30",
        sunset: "2026-11-27T17:24:00+05:30",
        rahu_kaal: { start: "2026-11-27T10:30:00+05:30", end: "2026-11-27T12:00:00+05:30" },
      },
      chandrabala: { moon_sign: "Gemini", house_from_moon: 3, house_from_lagna: 11, favourable: true, chandrashtama: false, status: "good", label: "Favourable", bindus: 5, sav: 30, note: "Good" },
      tarabala: null,
      yogas: [],
      cautions: [],
      dasha_now: ["Jupiter", "Saturn", "Ketu"],
      areas: [],
      transits: [],
      guidance: { favour: ["Work steadily"], avoid: ["Rahu Kaal"] },
      daily_tip: null,
      week: [],
      method: "Chandrabala",
      disclaimer: "General tendencies.",
    });
    await renderWithProviders(<ReportsTab kundli={K} />);
    await fireEvent.press(screen.getByTestId("report-daily"));
    expect(await screen.findByText("Personalized daily report summary")).toBeTruthy();
    expect(screen.getByTestId("report-daily-date")).toBeTruthy();
  });
});
