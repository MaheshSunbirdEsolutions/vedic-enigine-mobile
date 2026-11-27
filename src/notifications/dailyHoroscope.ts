import { createElement, useCallback, useEffect, useRef, useState } from "react";
import { AppState, Linking, Platform } from "react-native";
import {
  AndroidImportance,
  cancelScheduledNotificationAsync,
  clearLastNotificationResponse,
  DEFAULT_ACTION_IDENTIFIER,
  getExactAlarmPermissionsAsync,
  getNextTriggerDateAsync,
  getPermissionsAsync,
  requestExactAlarmPermissionsAsync,
  requestPermissionsAsync,
  SchedulableTriggerInputTypes,
  scheduleNotificationAsync,
  setNotificationChannelAsync,
  setNotificationHandler,
  useLastNotificationResponse,
  type DailyTriggerInput,
} from "expo-notifications";
import { useRouter } from "expo-router";
import { useAppAuth } from "@/auth/useAppAuth";
import { to12h } from "@/domain/time12";
import { usePreferences } from "@/state/preferences";

export const HOROSCOPE_NOTIFICATION_ID = "daily-horoscope-reminder";
export const HOROSCOPE_CHANNEL_ID = "daily-horoscope";
export const HOROSCOPE_ROUTE = "/(tabs)/horoscope" as const;

export type ScheduleReminderResult =
  | { ok: true; nextTriggerAt: number | null }
  | { ok: false; reason: "web" | "denied" };

export type ReminderContent = {
  hour: number;
  minute: number;
  title: string;
  body: string;
  channelName: string;
};

/** Formats 24-hour (hour, minute) as 12-hour "hh:mm AM/PM" matching the rest of the app. */
export function formatReminderTime(hour: number, minute: number): string {
  const hh = String(hour).padStart(2, "0");
  const mm = String(minute).padStart(2, "0");
  const { time, meridiem } = to12h(`${hh}:${mm}:00`);
  return `${time} ${meridiem}`;
}

/** Sets foreground notification presentation behavior for iOS and Android. */
export function configureNotificationHandler(): void {
  if (Platform.OS === "web") return;
  setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
}

async function ensureAndroidChannel(channelName: string): Promise<void> {
  if (Platform.OS !== "android") return;
  // Android 13+ requires creating a channel before requesting notification permissions.
  await setNotificationChannelAsync(HOROSCOPE_CHANNEL_ID, {
    name: channelName,
    importance: AndroidImportance.HIGH,
  });
}

function buildDailyTrigger(hour: number, minute: number): DailyTriggerInput {
  return {
    type: SchedulableTriggerInputTypes.DAILY,
    hour,
    minute,
    channelId: HOROSCOPE_CHANNEL_ID,
    // Use AlarmManager.setAlarmClock() on Android when permitted so OEM battery managers
    // do not defer or drop scheduled notifications after the app is swiped away.
    delivery: "alarmClock",
  };
}

/** True when `timestampMs` falls on the same local calendar day as `nowMs`. */
export function isSameLocalDay(timestampMs: number, nowMs = Date.now()): boolean {
  const a = new Date(timestampMs);
  const b = new Date(nowMs);
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

async function scheduleReminder({ hour, minute, title, body, channelName }: ReminderContent): Promise<number | null> {
  await ensureAndroidChannel(channelName);
  const trigger = buildDailyTrigger(hour, minute);
  await cancelScheduledNotificationAsync(HOROSCOPE_NOTIFICATION_ID).catch(() => {});
  await scheduleNotificationAsync({
    identifier: HOROSCOPE_NOTIFICATION_ID,
    content: {
      title,
      body,
      sound: "default",
      data: { route: HOROSCOPE_ROUTE },
    },
    trigger,
  });
  return getNextTriggerDateAsync(trigger).catch(() => null);
}

export type NotificationPermissionState = "checking" | "granted" | "denied" | "undetermined" | "web";
export type ExactAlarmState = "checking" | "granted" | "denied" | "not_applicable";

export type NotificationPermissionSnapshot = {
  state: NotificationPermissionState;
  canAskAgain: boolean;
  exactAlarm: ExactAlarmState;
};

function mapPermissionStatus(
  status: string,
  canAskAgain?: boolean,
): Pick<NotificationPermissionSnapshot, "state" | "canAskAgain"> {
  if (status === "granted") {
    return { state: "granted", canAskAgain: true };
  }
  if (status === "denied") {
    return { state: "denied", canAskAgain: canAskAgain ?? false };
  }
  return { state: "undetermined", canAskAgain: canAskAgain ?? true };
}

/** Checks whether exact alarm scheduling is allowed on Android 12+ (always allowed elsewhere). */
export async function getExactAlarmState(): Promise<ExactAlarmState> {
  if (Platform.OS !== "android") return "not_applicable";
  try {
    const res = await getExactAlarmPermissionsAsync();
    return res.granted ? "granted" : "denied";
  } catch {
    return "denied";
  }
}

/** Prompts Android 14+ system settings for "Alarms & reminders" when declared in app config. */
export async function requestExactAlarmPermission(): Promise<ExactAlarmState> {
  if (Platform.OS !== "android") return "not_applicable";
  try {
    const res = await requestExactAlarmPermissionsAsync();
    return res.granted ? "granted" : "denied";
  } catch {
    return "denied";
  }
}

/** Reads the current OS notification permission status without triggering a system prompt. */
export async function getNotificationPermissionState(): Promise<NotificationPermissionSnapshot> {
  if (Platform.OS === "web") {
    return { state: "web", canAskAgain: false, exactAlarm: "not_applicable" };
  }
  try {
    const [res, exactAlarm] = await Promise.all([getPermissionsAsync(), getExactAlarmState()]);
    return { ...mapPermissionStatus(res.status, res.canAskAgain), exactAlarm };
  } catch {
    return { state: "denied", canAskAgain: false, exactAlarm: "denied" };
  }
}

/** Ensures the Android channel exists and requests notification permission if not yet granted. */
export async function requestNotificationPermission(
  channelName: string,
): Promise<NotificationPermissionSnapshot> {
  if (Platform.OS === "web") {
    return { state: "web", canAskAgain: false, exactAlarm: "not_applicable" };
  }
  await ensureAndroidChannel(channelName);
  const existing = await getPermissionsAsync();
  const base =
    existing.status === "granted"
      ? { state: "granted" as const, canAskAgain: true }
      : (() => null)();
  if (base) {
    return { ...base, exactAlarm: await getExactAlarmState() };
  }
  const next = await requestPermissionsAsync();
  return { ...mapPermissionStatus(next.status, next.canAskAgain), exactAlarm: await getExactAlarmState() };
}

/** Opens the OS application settings screen so the user can re-enable notifications. */
export async function openNotificationSettings(): Promise<void> {
  await Linking.openSettings();
}

/** Tracks live notification permission status and updates when returning from OS settings. */
export function useNotificationPermission(channelName: string) {
  const [snapshot, setSnapshot] = useState<NotificationPermissionSnapshot>(() =>
    Platform.OS === "web"
      ? { state: "web", canAskAgain: false, exactAlarm: "not_applicable" }
      : {
          state: "checking",
          canAskAgain: true,
          exactAlarm: Platform.OS === "android" ? "checking" : "not_applicable",
        },
  );

  const refresh = useCallback(async () => {
    const next = await getNotificationPermissionState();
    setSnapshot(next);
    return next;
  }, []);

  useEffect(() => {
    let active = true;
    const sync = async () => {
      const next = await getNotificationPermissionState();
      if (active) setSnapshot(next);
    };
    void sync();
    const sub = AppState.addEventListener("change", (appState) => {
      if (appState === "active") void sync();
    });
    return () => {
      active = false;
      sub.remove();
    };
  }, []);

  const request = useCallback(async () => {
    const next = await requestNotificationPermission(channelName);
    setSnapshot(next);
    return next;
  }, [channelName]);

  const requestExactAlarm = useCallback(async () => {
    const exactAlarm = await requestExactAlarmPermission();
    setSnapshot((prev) => ({ ...prev, exactAlarm }));
    return exactAlarm;
  }, []);

  return { ...snapshot, refresh, request, requestExactAlarm };
}

/** Checks notification permission once at app startup and prompts if not yet asked. */
export function useStartupNotificationPermissionCheck(ready: boolean, channelName: string): void {
  const checkedRef = useRef(false);

  useEffect(() => {
    if (!ready || checkedRef.current || Platform.OS === "web") return;
    checkedRef.current = true;

    void (async () => {
      const current = await getNotificationPermissionState();
      if (current.state === "undetermined" && !usePreferences.getState().notificationPermissionAsked) {
        usePreferences.getState().setNotificationPermissionAsked(true);
        await requestNotificationPermission(channelName);
      }
    })();
  }, [ready, channelName]);
}

/**
 * Ensures notification permissions (with Android 13+ channel-first order) and schedules
 * a single daily local reminder pointing to the Horoscope screen.
 */
export async function scheduleDailyHoroscopeNotification(
  params: ReminderContent,
): Promise<ScheduleReminderResult> {
  if (Platform.OS === "web") {
    return { ok: false, reason: "web" };
  }

  const perm = await requestNotificationPermission(params.channelName);
  if (perm.state !== "granted") {
    return { ok: false, reason: "denied" };
  }

  const nextTriggerAt = await scheduleReminder(params);
  return { ok: true, nextTriggerAt };
}

/** Schedules a one-off local horoscope notification 5 seconds from now for quick verification. */
export async function scheduleTestHoroscopeNotification(
  params: Pick<ReminderContent, "title" | "body" | "channelName">,
): Promise<ScheduleReminderResult> {
  if (Platform.OS === "web") {
    return { ok: false, reason: "web" };
  }

  const perm = await requestNotificationPermission(params.channelName);
  if (perm.state !== "granted") {
    return { ok: false, reason: "denied" };
  }

  await ensureAndroidChannel(params.channelName);
  const fireAt = Date.now() + 5000;
  await scheduleNotificationAsync({
    identifier: `${HOROSCOPE_NOTIFICATION_ID}-test`,
    content: {
      title: params.title,
      body: params.body,
      sound: "default",
      data: { route: HOROSCOPE_ROUTE },
    },
    trigger: {
      type: SchedulableTriggerInputTypes.DATE,
      date: fireAt,
      channelId: HOROSCOPE_CHANNEL_ID,
      delivery: "alarmClock",
    },
  });
  return { ok: true, nextTriggerAt: fireAt };
}

/** Refreshes the scheduled notification copy/time silently when permissions are already granted. */
export async function rescheduleDailyHoroscopeIfGranted(params: ReminderContent): Promise<void> {
  if (Platform.OS === "web") return;
  const { status } = await getPermissionsAsync();
  if (status !== "granted") return;
  await scheduleReminder(params);
}

/** Cancels any pending daily horoscope local reminder. */
export async function cancelDailyHoroscopeNotification(): Promise<void> {
  if (Platform.OS === "web") return;
  await cancelScheduledNotificationAsync(HOROSCOPE_NOTIFICATION_ID).catch(() => {});
}

function NativeHoroscopeNotificationObserver({ ready, offline }: { ready: boolean; offline: boolean }) {
  const router = useRouter();
  const lastResponse = useLastNotificationResponse();
  const handledKeyRef = useRef<string | null>(null);
  const { isConfigured, isLoaded, isSignedIn } = useAppAuth();

  useEffect(() => {
    if (!ready || offline) return;
    if (isConfigured && !isLoaded) return;
    if (!lastResponse) return;
    if (lastResponse.actionIdentifier !== DEFAULT_ACTION_IDENTIFIER) return;

    const reqId = lastResponse.notification.request.identifier;
    const responseKey = `${reqId}:${lastResponse.notification.date}`;
    if (handledKeyRef.current === responseKey) return;

    const data = lastResponse.notification.request.content.data as { route?: unknown } | undefined;
    if (data?.route !== HOROSCOPE_ROUTE) return;

    handledKeyRef.current = responseKey;
    try {
      clearLastNotificationResponse();
    } catch {
      // Ignore if native emitter is unavailable.
    }

    if (isConfigured && !isSignedIn) {
      router.push({
        pathname: "/(auth)/sign-in",
        params: { redirectTo: HOROSCOPE_ROUTE },
      });
      return;
    }

    router.navigate(HOROSCOPE_ROUTE);
  }, [ready, offline, isConfigured, isLoaded, isSignedIn, lastResponse, router]);

  return null;
}

/**
 * Listens for taps on the Daily Horoscope notification (including cold-start launches)
 * and navigates to Sign In (with `redirectTo`) if unauthenticated, else directly to Horoscope.
 */
export function HoroscopeNotificationObserver({ ready, offline }: { ready: boolean; offline: boolean }) {
  if (Platform.OS === "web") return null;
  return createElement(NativeHoroscopeNotificationObserver, { ready, offline });
}
