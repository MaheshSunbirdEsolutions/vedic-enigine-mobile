import { Linking, Platform } from "react-native";
import * as Notifications from "expo-notifications";
import { act, fireEvent, screen, waitFor } from "@testing-library/react-native";
import SettingsScreen from "@/app/(tabs)/settings";
import * as appAuth from "@/auth/useAppAuth";
import { usePreferences } from "@/state/preferences";
import { renderWithProviders } from "@/test/render";
import {
  cancelDailyHoroscopeNotification,
  formatReminderTime,
  HOROSCOPE_CHANNEL_ID,
  HOROSCOPE_NOTIFICATION_ID,
  HOROSCOPE_ROUTE,
  HoroscopeNotificationObserver,
  isSameLocalDay,
  scheduleDailyHoroscopeNotification,
  useStartupNotificationPermissionCheck,
} from "../dailyHoroscope";

const mockPush = jest.fn();
const mockNavigate = jest.fn();
jest.mock("expo-router", () => ({
  useRouter: () => ({ push: mockPush, navigate: mockNavigate }),
}));

const originalOS = Platform.OS;

beforeEach(() => {
  jest.clearAllMocks();
  Platform.OS = "android";
  (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValue({
    status: "granted",
    granted: true,
    canAskAgain: true,
  });
  (Notifications.requestPermissionsAsync as jest.Mock).mockResolvedValue({
    status: "granted",
    granted: true,
    canAskAgain: true,
  });
  (Notifications.getExactAlarmPermissionsAsync as jest.Mock).mockResolvedValue({
    status: "granted",
    granted: true,
    canAskAgain: true,
  });
  (Notifications.requestExactAlarmPermissionsAsync as jest.Mock).mockResolvedValue({
    status: "granted",
    granted: true,
    canAskAgain: true,
  });
});

afterAll(() => {
  Platform.OS = originalOS;
});

function makeResponse(route: string, id = HOROSCOPE_NOTIFICATION_ID) {
  return {
    actionIdentifier: Notifications.DEFAULT_ACTION_IDENTIFIER,
    notification: {
      date: 1732700000000,
      request: {
        identifier: id,
        content: { title: "Today", body: "Tap", data: { route } },
        trigger: null,
      },
    },
  };
}

describe("dailyHoroscope scheduling", () => {
  it("formats 12-hour reminder times cleanly", () => {
    expect(formatReminderTime(8, 0)).toBe("08:00 AM");
    expect(formatReminderTime(21, 5)).toBe("09:05 PM");
    expect(formatReminderTime(0, 15)).toBe("12:15 AM");
  });

  it("creates Android channel before requesting permissions and schedules a daily trigger", async () => {
    const callOrder: string[] = [];
    (Notifications.setNotificationChannelAsync as jest.Mock).mockImplementationOnce(async () => {
      callOrder.push("channel");
      return null;
    });
    (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValueOnce({ status: "undetermined" });
    (Notifications.requestPermissionsAsync as jest.Mock).mockImplementationOnce(async () => {
      callOrder.push("permission");
      return { status: "granted" };
    });

    const res = await scheduleDailyHoroscopeNotification({
      hour: 7,
      minute: 30,
      title: "Today's Horoscope",
      body: "Tap to view",
      channelName: "Daily horoscope reminder",
    });

    expect(res).toEqual({ ok: true, nextTriggerAt: expect.any(Number) });
    expect(callOrder).toEqual(["channel", "permission"]);
    expect(Notifications.cancelScheduledNotificationAsync).toHaveBeenCalledWith(HOROSCOPE_NOTIFICATION_ID);
    expect(Notifications.scheduleNotificationAsync).toHaveBeenCalledWith(
      expect.objectContaining({
        identifier: HOROSCOPE_NOTIFICATION_ID,
        content: expect.objectContaining({
          title: "Today's Horoscope",
          body: "Tap to view",
          data: { route: HOROSCOPE_ROUTE },
        }),
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DAILY,
          hour: 7,
          minute: 30,
          channelId: HOROSCOPE_CHANNEL_ID,
          delivery: "alarmClock",
        },
      }),
    );
  });

  it("returns denied when permission is refused without scheduling", async () => {
    (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValueOnce({ status: "denied" });
    (Notifications.requestPermissionsAsync as jest.Mock).mockResolvedValueOnce({ status: "denied" });

    const res = await scheduleDailyHoroscopeNotification({
      hour: 8,
      minute: 0,
      title: "T",
      body: "B",
      channelName: "C",
    });

    expect(res).toEqual({ ok: false, reason: "denied" });
    expect(Notifications.scheduleNotificationAsync).not.toHaveBeenCalled();
  });

  it("cancels the scheduled horoscope reminder", async () => {
    await cancelDailyHoroscopeNotification();
    expect(Notifications.cancelScheduledNotificationAsync).toHaveBeenCalledWith(HOROSCOPE_NOTIFICATION_ID);
  });
});

describe("HoroscopeNotificationObserver", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("redirects unauthenticated users to sign-in with redirectTo set to Horoscope", async () => {
    (Notifications.useLastNotificationResponse as jest.Mock).mockReturnValue(makeResponse(HOROSCOPE_ROUTE));
    jest.spyOn(appAuth, "useAppAuth").mockReturnValue({
      isConfigured: true,
      isLoaded: true,
      isSignedIn: false,
      userId: null,
      email: null,
      fullName: null,
      getToken: jest.fn(async () => null),
      signOut: jest.fn(async () => {}),
    });

    await renderWithProviders(<HoroscopeNotificationObserver ready offline={false} />);

    await waitFor(() =>
      expect(mockPush).toHaveBeenCalledWith({
        pathname: "/(auth)/sign-in",
        params: { redirectTo: HOROSCOPE_ROUTE },
      }),
    );
    expect(mockNavigate).not.toHaveBeenCalled();
    expect(Notifications.clearLastNotificationResponse).toHaveBeenCalledTimes(1);
  });

  it("navigates authenticated users directly to the Horoscope tab", async () => {
    (Notifications.useLastNotificationResponse as jest.Mock).mockReturnValue(makeResponse(HOROSCOPE_ROUTE));
    jest.spyOn(appAuth, "useAppAuth").mockReturnValue({
      isConfigured: true,
      isLoaded: true,
      isSignedIn: true,
      userId: "u1",
      email: "a@b.com",
      fullName: "A",
      getToken: jest.fn(async () => "tok"),
      signOut: jest.fn(async () => {}),
    });

    await renderWithProviders(<HoroscopeNotificationObserver ready offline={false} />);

    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith(HOROSCOPE_ROUTE));
    expect(mockPush).not.toHaveBeenCalled();
    expect(Notifications.clearLastNotificationResponse).toHaveBeenCalledTimes(1);
  });

  it("waits until auth is loaded and network is online before redirecting", async () => {
    (Notifications.useLastNotificationResponse as jest.Mock).mockReturnValue(makeResponse(HOROSCOPE_ROUTE));
    jest.spyOn(appAuth, "useAppAuth").mockReturnValue({
      isConfigured: true,
      isLoaded: false,
      isSignedIn: false,
      userId: null,
      email: null,
      fullName: null,
      getToken: jest.fn(async () => null),
      signOut: jest.fn(async () => {}),
    });

    await renderWithProviders(<HoroscopeNotificationObserver ready offline={false} />);
    await act(async () => {});
    expect(mockPush).not.toHaveBeenCalled();
    expect(mockNavigate).not.toHaveBeenCalled();

    jest.spyOn(appAuth, "useAppAuth").mockReturnValue({
      isConfigured: true,
      isLoaded: true,
      isSignedIn: true,
      userId: "u1",
      email: "a@b.com",
      fullName: "A",
      getToken: jest.fn(async () => "tok"),
      signOut: jest.fn(async () => {}),
    });
    await renderWithProviders(<HoroscopeNotificationObserver ready offline />);
    await act(async () => {});
    expect(mockNavigate).not.toHaveBeenCalled();
  });
});

describe("useStartupNotificationPermissionCheck", () => {
  function StartupHarness({ ready }: { ready: boolean }) {
    useStartupNotificationPermissionCheck(ready, "Daily horoscope reminder");
    return null;
  }

  beforeEach(() => {
    usePreferences.getState().setNotificationPermissionAsked(false);
  });

  it("checks and requests permission once at startup when status is undetermined", async () => {
    (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValue({
      status: "undetermined",
      granted: false,
      canAskAgain: true,
    });
    (Notifications.requestPermissionsAsync as jest.Mock).mockResolvedValue({
      status: "granted",
      granted: true,
      canAskAgain: true,
    });

    await renderWithProviders(<StartupHarness ready />);
    await waitFor(() => expect(Notifications.requestPermissionsAsync).toHaveBeenCalledTimes(1));
    expect(usePreferences.getState().notificationPermissionAsked).toBe(true);

    // Subsequent startup does not re-prompt once already asked.
    jest.clearAllMocks();
    await renderWithProviders(<StartupHarness ready />);
    await act(async () => {});
    expect(Notifications.requestPermissionsAsync).not.toHaveBeenCalled();
  });
});

describe("SettingsScreen daily horoscope notification controls", () => {
  beforeEach(() => {
    usePreferences.getState().setDailyHoroscopeEnabled(false);
    usePreferences.getState().setDailyHoroscopeTime(8, 0);
  });

  it("shows permission & reminder status and enables/cancels daily horoscope notifications", async () => {
    await renderWithProviders(<SettingsScreen />, {
      auth: { isConfigured: true, isLoaded: true, isSignedIn: true, email: "a@b.com", fullName: "A" },
    });

    expect(await screen.findByText("Enabled")).toBeTruthy();
    expect(screen.getByText("Not enabled")).toBeTruthy();

    await fireEvent.press(screen.getByTestId("settings-horoscope-notif-on"));
    await waitFor(() => expect(Notifications.scheduleNotificationAsync).toHaveBeenCalledTimes(1));
    expect(Notifications.cancelScheduledNotificationAsync).toHaveBeenCalledTimes(1);
    expect(usePreferences.getState().dailyHoroscopeEnabled).toBe(true);
    expect(screen.getByText("Enabled · 08:00 AM")).toBeTruthy();

    jest.clearAllMocks();
    await fireEvent.press(screen.getByTestId("settings-horoscope-notif-off"));
    await waitFor(() =>
      expect(Notifications.cancelScheduledNotificationAsync).toHaveBeenCalledWith(HOROSCOPE_NOTIFICATION_ID),
    );
    expect(usePreferences.getState().dailyHoroscopeEnabled).toBe(false);
    expect(screen.getByText("Not enabled")).toBeTruthy();
  });

  it("shows Allow notifications CTA when undetermined and requests permission on tap", async () => {
    (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValue({
      status: "undetermined",
      granted: false,
      canAskAgain: true,
    });
    (Notifications.requestPermissionsAsync as jest.Mock).mockResolvedValue({
      status: "granted",
      granted: true,
      canAskAgain: true,
    });

    await renderWithProviders(<SettingsScreen />, {
      auth: { isConfigured: true, isLoaded: true, isSignedIn: true, email: "a@b.com", fullName: "A" },
    });

    expect(await screen.findByText("Not allowed yet")).toBeTruthy();
    await fireEvent.press(screen.getByTestId("settings-notif-allow"));
    await waitFor(() => expect(screen.getByText("Enabled")).toBeTruthy());
  });

  it("shows paused status and Open device settings button when OS permission is permanently denied", async () => {
    usePreferences.getState().setDailyHoroscopeEnabled(true);
    (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValue({
      status: "denied",
      granted: false,
      canAskAgain: false,
    });
    const settingsSpy = jest.spyOn(Linking, "openSettings").mockResolvedValue();

    await renderWithProviders(<SettingsScreen />, {
      auth: { isConfigured: true, isLoaded: true, isSignedIn: true, email: "a@b.com", fullName: "A" },
    });

    expect(await screen.findByText("Disabled")).toBeTruthy();
    expect(screen.getByText("Paused (permission disabled)")).toBeTruthy();

    await fireEvent.press(screen.getByTestId("settings-notif-open-settings"));
    expect(settingsSpy).toHaveBeenCalledTimes(1);
    settingsSpy.mockRestore();
  });

  it("shows exact-alarm prompt on Android when restricted and reschedules once granted", async () => {
    usePreferences.getState().setDailyHoroscopeEnabled(true);
    (Notifications.getExactAlarmPermissionsAsync as jest.Mock)
      .mockResolvedValueOnce({ status: "denied", granted: false, canAskAgain: true })
      .mockResolvedValue({ status: "granted", granted: true, canAskAgain: true });
    (Notifications.requestExactAlarmPermissionsAsync as jest.Mock).mockResolvedValue({
      status: "granted",
      granted: true,
      canAskAgain: true,
    });

    await renderWithProviders(<SettingsScreen />, {
      auth: { isConfigured: true, isLoaded: true, isSignedIn: true, email: "a@b.com", fullName: "A" },
    });

    expect(await screen.findByText("Restricted")).toBeTruthy();
    await fireEvent.press(screen.getByTestId("settings-notif-allow-exact"));
    await waitFor(() => expect(screen.getByText("Allowed")).toBeTruthy());
    expect(Notifications.scheduleNotificationAsync).toHaveBeenCalledTimes(1);
  });

  it("schedules a 5-second test notification from Settings and surfaces errors if scheduling rejects", async () => {
    const now = new Date(2026, 10, 27, 17, 15, 0).getTime();
    expect(isSameLocalDay(new Date(2026, 10, 27, 23, 59, 0).getTime(), now)).toBe(true);
    expect(isSameLocalDay(new Date(2026, 10, 28, 0, 1, 0).getTime(), now)).toBe(false);

    await renderWithProviders(<SettingsScreen />, {
      auth: { isConfigured: true, isLoaded: true, isSignedIn: true, email: "a@b.com", fullName: "A" },
    });

    await fireEvent.press(screen.getByTestId("settings-notif-test"));
    await waitFor(() =>
      expect(Notifications.scheduleNotificationAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          identifier: `${HOROSCOPE_NOTIFICATION_ID}-test`,
          content: expect.objectContaining({ data: { route: HOROSCOPE_ROUTE } }),
          trigger: expect.objectContaining({
            type: Notifications.SchedulableTriggerInputTypes.DATE,
            delivery: "alarmClock",
          }),
        }),
      ),
    );
    expect(await screen.findByText("Test notification will arrive in 5 seconds.")).toBeTruthy();

    (Notifications.scheduleNotificationAsync as jest.Mock).mockRejectedValueOnce(new Error("Alarm limit"));
    await fireEvent.press(screen.getByTestId("settings-horoscope-notif-on"));
    expect(await screen.findByText("Alarm limit")).toBeTruthy();
  });
});
