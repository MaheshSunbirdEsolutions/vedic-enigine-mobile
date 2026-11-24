/**
 * App preferences (client state), persisted to AsyncStorage.
 * Server data (kundlis, charts, reports) lives in React Query, not here.
 */
import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { env } from "@/config/env";
import type { Lang } from "@/types/api";

export type ChartStyle = "north" | "south";

export type PreferencesState = {
  lang: Lang;
  chartStyle: ChartStyle;
  /** Set in Settings to point a build at another engine without rebuilding. */
  engineUrlOverride: string | null;
  setLang: (lang: Lang) => void;
  setChartStyle: (s: ChartStyle) => void;
  setEngineUrlOverride: (url: string | null) => void;
};

export const usePreferences = create<PreferencesState>()(
  persist(
    (set) => ({
      lang: "en",
      chartStyle: "north",
      engineUrlOverride: null,
      setLang: (lang) => set({ lang }),
      setChartStyle: (chartStyle) => set({ chartStyle }),
      setEngineUrlOverride: (engineUrlOverride) => set({ engineUrlOverride }),
    }),
    {
      name: "jyotish-preferences",
      version: 1,
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (s) => ({ lang: s.lang, chartStyle: s.chartStyle, engineUrlOverride: s.engineUrlOverride }),
    },
  ),
);

/** The engine base URL in effect right now (override from Settings, else env). */
export const getEngineUrl = (): string => usePreferences.getState().engineUrlOverride || env.engineUrl;
