/**
 * Every report renders a real engine response (fixtures from POST /report/<id>), and the
 * Reports tab offers all 12 categories with the same labels as the web app.
 */
import { fireEvent, screen, waitFor } from "@testing-library/react-native";
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

jest.mock("@/api", () => ({
  ...jest.requireActual("@/api"),
  engineApi: {
    astro: { chart: jest.fn(), dasha: jest.fn(), sadeSati: jest.fn() },
    reports: { simple: jest.fn(), raw: jest.fn(), bookStatus: jest.fn() },
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

  it("offers all 12 reports with the web app's labels", async () => {
    await renderWithProviders(<ReportsTab kundli={K} />);
    expect(REPORTS).toHaveLength(12);
    for (const r of REPORTS) expect(screen.getByTestId(`report-${r.key}`)).toBeTruthy();
    expect(screen.queryByText(/web app/i)).toBeNull();
  });

  it("loads the chosen report and its year", async () => {
    await renderWithProviders(<ReportsTab kundli={K} />);
    await fireEvent.press(screen.getByTestId("report-yearpred"));
    await waitFor(() => expect(screen.getByText(yearly.summary)).toBeTruthy());
    await fireEvent.press(screen.getByTestId("year-next"));
    await waitFor(() => expect(mockApi.reports.raw).toHaveBeenLastCalledWith("yearly", expect.objectContaining({ year: new Date().getFullYear() + 1 }), expect.anything()));
  });
});
