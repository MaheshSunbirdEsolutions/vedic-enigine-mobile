/**
 * Horoscope screen tests: 12-Rashi view, Rashi detail navigation, Kundli mode,
 * 7-day day switching, error/retry, and SMTP email share preview/send.
 */
import { fireEvent, screen, waitFor } from "@testing-library/react-native";
import { ApiError } from "@/api/errors";
import { renderWithProviders } from "@/test/render";
import HoroscopeScreen from "../(tabs)/horoscope";

const mockPush = jest.fn();
jest.mock("expo-router", () => ({ useRouter: () => ({ push: mockPush }) }));

jest.mock("@/api", () => ({
  ...jest.requireActual("@/api"),
  engineApi: {
    kundlis: { list: jest.fn() },
    astro: { dailyHoroscope: jest.fn() },
    reports: { daily: jest.fn() },
    email: { status: jest.fn(), previewHoroscope: jest.fn(), sendHoroscope: jest.fn() },
    meta: { places: jest.fn() },
  },
}));
const mockApi = jest.requireMock("@/api").engineApi;

const K = {
  id: "k1",
  name: "Mahesh",
  datetime_local: "1980-12-27T22:46:00",
  tz: "Asia/Kolkata",
  lat: 31.71,
  lon: 76.93,
  place: "Mandi",
};

const rashiPayload = {
  date: "2026-11-27",
  tz: "Asia/Kolkata",
  moon_sign: "Gemini",
  yogas: ["Sarvartha-siddhi yoga"],
  cautions: [],
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
  signs: [
    {
      sign: "Aries",
      sign_index: 1,
      lord: "Mars",
      score: 1.4,
      rating: "good",
      rating_label: "Good",
      moon_house: 3,
      moon_good: true,
      chandrashtama: false,
      ghat_nakshatra: false,
      ghat_nakshatra_name: "Magha",
      saturn_phase: null,
      summary: "Moon in 3rd – courage and initiative.",
      overview: "For Aries, today's Moon transits your 3rd house in Gemini.",
      highlights: ["Work & finance: supportive momentum."],
      areas: [
        {
          area: "career",
          title: "Career & Work",
          score: 0.8,
          rating: "good",
          rating_label: "Good",
          text: "Favourable energy here today.",
          reasons: ["Moon transits 3rd house (supportive)"],
        },
      ],
      guidance: { favour: ["Favourable Chandrabala supports meetings."], avoid: ["Avoid starts during Rahu Kaal."] },
      transits: [
        {
          planet: "Moon",
          sign: "Gemini",
          nakshatra: "Mrigashira",
          house_from_moon: 3,
          good: true,
          score: 1.1,
          text: "Moon in Gemini – 3rd from Aries [favourable]",
        },
      ],
      week: [
        { date: "2026-11-27", weekday: "Fri", moon_sign: "Gemini", nakshatra: "Mrigashira", moon_house: 3, chandrashtama: false, score: 1.4, rating: "good", rating_label: "Good" },
        { date: "2026-11-28", weekday: "Sat", moon_sign: "Cancer", nakshatra: "Ardra", moon_house: 4, chandrashtama: false, score: 0.1, rating: "mixed", rating_label: "Mixed" },
      ],
      colour: "red / coral",
      lucky_numbers: [1, 3, 9],
      deity: "Kartikeya (Narasimha)",
      daana: "Red lentils",
      tip: "Stay proactive. Lucky colour: red / coral.",
      mantra: "Om Kram Krim Kraum Sah Bhaumaya Namah",
      favorable_transits: ["Moon"],
      care_transits: [],
      health_watch: { parts: "Shoulders & arms", watch: "Mild strain" },
    },
  ],
  disclaimer: "Rashi-based predictions use the Moon sign gochara.",
};

const dailyReportPayload = {
  date: "2026-11-27",
  tz: "Asia/Kolkata",
  score: 1.2,
  rating: "good",
  rating_label: "Good",
  summary: "Personalized daily outlook for Mahesh.",
  panchang: rashiPayload.panchang,
  chandrabala: {
    moon_sign: "Gemini",
    house_from_moon: 3,
    house_from_lagna: 11,
    favourable: true,
    chandrashtama: false,
    status: "good",
    label: "Favourable",
    bindus: 5,
    sav: 30,
    note: "Moon in 3rd.",
  },
  tarabala: { index: 6, name: "Sadhaka", good: true, meaning: "Achievement" },
  yogas: ["Sarvartha-siddhi yoga"],
  cautions: [],
  dasha_now: ["Jupiter", "Saturn", "Ketu"],
  dasha_reading: { rating_label: "Mixed" },
  areas: [{ area: "career", title: "Career & Work", score: 0.7, rating: "good", rating_label: "Good", reasons: ["Supportive transit"] }],
  transits: [
    {
      planet: "Moon",
      sign: "Gemini",
      nakshatra: "Mrigashira",
      house_from_moon: 3,
      house_from_lagna: 11,
      good: true,
      bindus: 5,
      score: 1.1,
      text: "Moon in Gemini (3rd from Moon)",
    },
  ],
  guidance: { favour: ["Good Chandrabala"], avoid: ["Avoid Rahu Kaal"] },
  daily_tip: { planet: "Venus", colour: "cream / pastel", mantra: "Om Shum Shukraya Namah", practice: "Donate white sweets", daana: "Rice" },
  week: [
    { date: "2026-11-27", weekday: "Fri", vara: "Friday", nakshatra: "Mrigashira", moon_sign: "Gemini", house_from_moon: 3, chandrashtama: false, tara: "Sadhaka", tara_good: true, score: 1.2, rating: "good", rating_label: "Good" },
  ],
  method: "Chandrabala + Tarabala",
  disclaimer: "Daily readings show general tendencies.",
};

beforeEach(() => {
  jest.clearAllMocks();
  mockApi.kundlis.list.mockResolvedValue([K]);
  mockApi.astro.dailyHoroscope.mockResolvedValue(rashiPayload);
  mockApi.reports.daily.mockResolvedValue(dailyReportPayload);
  mockApi.email.status.mockResolvedValue({ configured: true, host: "smtp.example.com", port: 587, security: "starttls", from_email: "bot@example.com" });
  mockApi.email.previewHoroscope.mockResolvedValue({ subject: "Aries — Daily Horoscope", text: "Preview text body", html: "<p>Preview</p>", date: "2026-11-27" });
  mockApi.email.sendHoroscope.mockResolvedValue({ sent: true, to: ["user@example.com"], subject: "Aries — Daily Horoscope", date: "2026-11-27", status: { configured: true, host: "smtp.example.com", port: 587, security: "starttls", from_email: "bot@example.com" } });
});

describe("Horoscope screen", () => {
  it("loads 12-Rashi daily horoscope, opens RashiDetail, and switches back", async () => {
    await renderWithProviders(<HoroscopeScreen />);
    expect(await screen.findByText(rashiPayload.signs[0].overview)).toBeTruthy();

    await fireEvent.press(screen.getByTestId("rashi-card-Aries"));
    expect(await screen.findByTestId("rashi-detail-Aries")).toBeTruthy();
    expect(screen.getByText(/Kartikeya/)).toBeTruthy();

    await fireEvent.press(screen.getByTestId("rashi-back-btn"));
    expect(screen.queryByTestId("rashi-detail-Aries")).toBeNull();
  });

  it("switches to By Kundli mode and renders DailyView", async () => {
    await renderWithProviders(<HoroscopeScreen />);
    await screen.findByTestId("rashi-results");

    await fireEvent.press(screen.getByTestId("horoscope-mode-kundli"));
    expect(await screen.findByText(dailyReportPayload.summary)).toBeTruthy();
    expect(screen.getAllByText("Sadhaka").length).toBeGreaterThan(0);
    expect(mockApi.reports.daily).toHaveBeenCalled();
  });

  it("retries when daily horoscope fails", async () => {
    mockApi.astro.dailyHoroscope
      .mockRejectedValueOnce(new ApiError({ kind: "network", path: "/horoscope/daily" }))
      .mockResolvedValueOnce(rashiPayload);
    await renderWithProviders(<HoroscopeScreen />);
    await fireEvent.press(await screen.findByTestId("error-state-retry"));
    expect(await screen.findByText(rashiPayload.signs[0].overview)).toBeTruthy();
  });

  it("previews and sends daily horoscope via email", async () => {
    await renderWithProviders(<HoroscopeScreen />);
    await screen.findByTestId("rashi-results");

    await fireEvent.press(screen.getByTestId("email-share-toggle"));
    expect(await screen.findByText(/SMTP ready/)).toBeTruthy();

    await fireEvent.press(screen.getByTestId("email-send-btn"));
    expect(await screen.findByText(/Enter at least one recipient email address/)).toBeTruthy();

    await fireEvent.press(screen.getByTestId("email-preview-btn"));
    expect(await screen.findByText("Preview text body")).toBeTruthy();

    await fireEvent.changeText(screen.getByTestId("email-to-input"), "user@example.com");
    await fireEvent.press(screen.getByTestId("email-send-btn"));
    await waitFor(() => expect(mockApi.email.sendHoroscope).toHaveBeenCalledWith(expect.objectContaining({
      to_email: "user@example.com",
      kind: "rashi",
      sign: "Aries",
    })));
    expect(await screen.findByText(/Sent via SMTP to user@example.com/)).toBeTruthy();
  });
});
