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
  setLang: (lang: Lang) => void;
  setChartStyle: (s: ChartStyle) => void;
  setColorScheme: (c: ColorPreference) => void;
  setEngineUrlOverride: (url: string | null) => void;
};

export const usePreferences = create<PreferencesState>()(
  persist(
    (set) => ({
      lang: "en",
      chartStyle: "north",
      colorScheme: "system",
      engineUrlOverride: null,
      setLang: (lang) => set({ lang }),
      setChartStyle: (chartStyle) => set({ chartStyle }),
      setColorScheme: (colorScheme) => set({ colorScheme }),
      setEngineUrlOverride: (engineUrlOverride) => set({ engineUrlOverride }),
    }),
    {
      name: "jyotish-preferences",
      version: 2,
      // v1 had no colorScheme; missing keys fall back to the defaults above.
      migrate: (persisted) => ({ colorScheme: "system", ...(persisted as object) }) as PreferencesState,
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (s) => ({ lang: s.lang, chartStyle: s.chartStyle, colorScheme: s.colorScheme, engineUrlOverride: s.engineUrlOverride }),
    },
  ),
);

/** The engine base URL in effect right now (override from Settings, else env). */
export const getEngineUrl = (): string => usePreferences.getState().engineUrlOverride || env.engineUrl;

/** True once saved preferences are loaded from storage (used to hold the splash screen). */
const subscribeHydration = (cb: () => void) => usePreferences.persist.onFinishHydration(cb);
const isHydrated = () => usePreferences.persist.hasHydrated();
export const usePreferencesHydrated = (): boolean => useSyncExternalStore(subscribeHydration, isHydrated, () => false);
