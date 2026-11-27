/**
 * App preferences (client state), persisted to AsyncStorage.
 * Server data (kundlis, charts, reports) lives in React Query, not here.
 */
import { useSyncExternalStore } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { env } from "@/config/env";
import type { ColorPreference } from "@/theme";
import type { Lang } from "@/types/api";

export type ChartStyle = "north" | "south";

export type PreferencesState = {
  lang: Lang;
  chartStyle: ChartStyle;
  /** "system" (default) follows the device's light/dark setting. */
  colorScheme: ColorPreference;
  /** Set in Settings to point a build at another engine without rebuilding. */
  engineUrlOverride: string | null;
  dailyHoroscopeEnabled: boolean;
  dailyHoroscopeHour: number;
  dailyHoroscopeMinute: number;
  notificationPermissionAsked: boolean;
  setLang: (lang: Lang) => void;
  setChartStyle: (s: ChartStyle) => void;
  setColorScheme: (c: ColorPreference) => void;
  setEngineUrlOverride: (url: string | null) => void;
  setDailyHoroscopeEnabled: (enabled: boolean) => void;
  setDailyHoroscopeTime: (hour: number, minute: number) => void;
  setNotificationPermissionAsked: (asked: boolean) => void;
};

export const usePreferences = create<PreferencesState>()(
  persist(
    (set) => ({
      lang: "en",
      chartStyle: "north",
      colorScheme: "system",
      engineUrlOverride: null,
      dailyHoroscopeEnabled: false,
      dailyHoroscopeHour: 8,
      dailyHoroscopeMinute: 0,
      notificationPermissionAsked: false,
      setLang: (lang) => set({ lang }),
      setChartStyle: (chartStyle) => set({ chartStyle }),
      setColorScheme: (colorScheme) => set({ colorScheme }),
      setEngineUrlOverride: (engineUrlOverride) => set({ engineUrlOverride }),
      setDailyHoroscopeEnabled: (dailyHoroscopeEnabled) => set({ dailyHoroscopeEnabled }),
      setDailyHoroscopeTime: (dailyHoroscopeHour, dailyHoroscopeMinute) =>
        set({ dailyHoroscopeHour, dailyHoroscopeMinute }),
      setNotificationPermissionAsked: (notificationPermissionAsked) =>
        set({ notificationPermissionAsked }),
    }),
    {
      name: "jyotish-preferences",
      version: 4,
      // Missing keys from older persisted versions fall back to defaults above.
      migrate: (persisted) => ({
        colorScheme: "system",
        dailyHoroscopeEnabled: false,
        dailyHoroscopeHour: 8,
        dailyHoroscopeMinute: 0,
        notificationPermissionAsked: false,
        ...(persisted as object),
      }) as PreferencesState,
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (s) => ({
        lang: s.lang,
        chartStyle: s.chartStyle,
        colorScheme: s.colorScheme,
        engineUrlOverride: s.engineUrlOverride,
        dailyHoroscopeEnabled: s.dailyHoroscopeEnabled,
        dailyHoroscopeHour: s.dailyHoroscopeHour,
        dailyHoroscopeMinute: s.dailyHoroscopeMinute,
        notificationPermissionAsked: s.notificationPermissionAsked,
      }),
    },
  ),
);

/** The engine base URL in effect right now (override from Settings, else env). */
export const getEngineUrl = (): string => usePreferences.getState().engineUrlOverride || env.engineUrl;

/** True once saved preferences are loaded from storage (used to hold the splash screen). */
const subscribeHydration = (cb: () => void) => usePreferences.persist.onFinishHydration(cb);
const isHydrated = () => usePreferences.persist.hasHydrated();
export const usePreferencesHydrated = (): boolean => useSyncExternalStore(subscribeHydration, isHydrated, () => false);
