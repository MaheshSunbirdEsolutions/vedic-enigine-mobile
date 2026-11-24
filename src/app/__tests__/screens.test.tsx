/**
 * Screen-level tests: real hooks and React Query, with the engine API mocked.
 * They check the four states every data screen must handle: loading, empty, error, data.
 */
import { act, fireEvent, screen, waitFor } from "@testing-library/react-native";
import ask from "@/__fixtures__/ask.json";
import askStatus from "@/__fixtures__/askstatus.json";
import chart from "@/__fixtures__/chart.json";
import dasha from "@/__fixtures__/dasha.json";
import sade from "@/__fixtures__/sade.json";
import { ApiError } from "@/api/errors";
import { KundliView } from "@/components/kundli/KundliView";
import { renderWithProviders } from "@/test/render";
import KundlisScreen from "../(tabs)/index";

const mockPush = jest.fn(), mockReplace = jest.fn(), mockBack = jest.fn();
jest.mock("expo-router", () => ({ useRouter: () => ({ push: mockPush, replace: mockReplace, back: mockBack }) }));

jest.mock("@/api", () => ({
  ...jest.requireActual("@/api"),
  engineApi: {
    kundlis: { list: jest.fn(), get: jest.fn(), create: jest.fn(), update: jest.fn(), remove: jest.fn() },
    astro: { chart: jest.fn(), dasha: jest.fn(), sadeSati: jest.fn(), interpret: jest.fn() },
    reports: { simple: jest.fn() },
    ask: { status: jest.fn(), ask: jest.fn() },
    meta: { places: jest.fn() },
  },
}));
const mockApi = jest.requireMock("@/api").engineApi;

const K = { id: "k1", name: "Mahesh", datetime_local: "1980-12-27T22:46:00", tz: "Asia/Kolkata", lat: 31.71, lon: 76.93, place: "Mandi" };

beforeEach(() => jest.clearAllMocks());

describe("Kundlis list screen", () => {
  it("shows the skeleton, then the saved kundlis", async () => {
    let resolve!: (v: unknown) => void;
    mockApi.kundlis.list.mockReturnValue(new Promise((r) => { resolve = r; }));
    await renderWithProviders(<KundlisScreen />);
    expect(screen.getByTestId("skeleton-list")).toBeTruthy();
    await act(async () => resolve([K]));
    expect(await screen.findByText("Mahesh")).toBeTruthy();
    await fireEvent.press(screen.getByTestId("kundli-k1"));
    expect(mockPush).toHaveBeenCalledWith({ pathname: "/kundli/[id]", params: { id: "k1" } });
  });

  it("shows the empty state with a call to action", async () => {
    mockApi.kundlis.list.mockResolvedValue([]);
    await renderWithProviders(<KundlisScreen />);
    expect(await screen.findByTestId("empty-state")).toBeTruthy();
  });

  it("shows the error state and retries", async () => {
    mockApi.kundlis.list.mockRejectedValueOnce(new ApiError({ kind: "network", path: "/kundlis" })).mockResolvedValueOnce([K]);
    await renderWithProviders(<KundlisScreen />);
    await fireEvent.press(await screen.findByTestId("error-state-retry"));
    expect(await screen.findByText("Mahesh")).toBeTruthy();
  });

  it("searches as you type (debounced)", async () => {
    mockApi.kundlis.list.mockResolvedValue([K]);
    await renderWithProviders(<KundlisScreen />);
    await screen.findByText("Mahesh");
    await fireEvent.changeText(screen.getByTestId("kundli-search"), "zzz");
    await waitFor(() => expect(mockApi.kundlis.list).toHaveBeenCalledWith("zzz", expect.anything()));
  });
});

describe("Kundli view", () => {
  beforeEach(() => {
    mockApi.astro.chart.mockResolvedValue(chart);
    mockApi.astro.dasha.mockResolvedValue(dasha);
    mockApi.astro.sadeSati.mockResolvedValue(sade);
  });

  it("loads the chart bundle and switches tabs", async () => {
    await renderWithProviders(<KundliView initial={K} />);
    expect(screen.getByTestId("skeleton-chart")).toBeTruthy();
    expect(await screen.findByTestId("chart-tab")).toBeTruthy();
    await fireEvent.press(screen.getByTestId("kundli-tab-dasha"));
    expect(screen.getByTestId("dasha-tab")).toBeTruthy();
    await fireEvent.press(screen.getByTestId("kundli-tab-sade"));
    expect(screen.getByTestId("sade-tab")).toBeTruthy();
    expect(mockApi.astro.chart).toHaveBeenCalledTimes(1); // one fetch serves three tabs
  });

  it("shows an error with retry when the engine fails", async () => {
    mockApi.astro.chart.mockRejectedValueOnce(new ApiError({ kind: "http", status: 500, path: "/chart", detail: "boom" }));
    await renderWithProviders(<KundliView initial={K} />);
    expect(await screen.findByText("boom")).toBeTruthy();
    await fireEvent.press(screen.getByTestId("error-state-retry"));
    expect(await screen.findByTestId("chart-tab")).toBeTruthy();
  });

  it("saves an unsaved kundli and moves to its saved route", async () => {
    const unsaved = { ...K, id: undefined };
    mockApi.kundlis.create.mockResolvedValue({ ...K, id: "new1" });
    await renderWithProviders(<KundliView initial={unsaved} />);
    expect(screen.getByText("Not saved yet")).toBeTruthy();
    await fireEvent.press(screen.getByTestId("save-kundli"));
    await waitFor(() => expect(mockReplace).toHaveBeenCalledWith({ pathname: "/kundli/[id]", params: { id: "new1" } }));
    expect(mockApi.kundlis.create).toHaveBeenCalledWith(expect.objectContaining({ name: "Mahesh" }));
  });

  it("shows a save error inline", async () => {
    mockApi.kundlis.update.mockRejectedValue(new ApiError({ kind: "http", status: 422, path: "/kundlis/k1" }));
    await renderWithProviders(<KundliView initial={K} />);
    await fireEvent.press(screen.getByTestId("save-kundli"));
    expect(await screen.findByText(/Some details were not accepted/)).toBeTruthy();
  });

  it("asks a question and keeps the answer in the history", async () => {
    mockApi.ask.status.mockResolvedValue(askStatus);
    mockApi.ask.ask.mockResolvedValue(ask);
    await renderWithProviders(<KundliView initial={K} />);
    await fireEvent.press(screen.getByTestId("kundli-tab-ask"));
    await fireEvent.changeText(screen.getByTestId("ask-input"), "When will I get a promotion?");
    await fireEvent.press(screen.getByTestId("ask-send"));
    expect(await screen.findByText(ask.sections[0].title)).toBeTruthy();
    expect(mockApi.ask.ask).toHaveBeenCalledWith(expect.objectContaining({ question: "When will I get a promotion?", use_ai: false }));
  });
});
