import type { Palette } from "./palettes";
import { darkPalette, lightPalette } from "./palettes";

export type ColorMode = "light" | "dark";
/** What the user picked in Settings. "system" follows the device. */
export type ColorPreference = "system" | ColorMode;
export type Tone = "good" | "bad" | "mixed" | "neutral" | "accent";

export type Theme = {
  mode: ColorMode;
  dark: boolean;
  colors: Palette;
  /** Foreground/background pair per tone (chips, badges, coloured edges). */
  tones: Record<Tone, { fg: string; bg: string }>;
  shadow: {
    shadowColor: string; shadowOpacity: number; shadowRadius: number;
    shadowOffset: { width: number; height: number }; elevation: number;
  };
};

function build(mode: ColorMode, c: Palette): Theme {
  return {
    mode,
    dark: mode === "dark",
    colors: c,
    tones: {
      good: { fg: c.good, bg: c.goodSoft },
      bad: { fg: c.bad, bg: c.badSoft },
      mixed: { fg: c.mixed, bg: c.mixedSoft },
      neutral: { fg: c.muted, bg: c.neutralSoft },
      accent: { fg: c.accent, bg: c.accentSoft },
    },
    shadow: mode === "dark"
      ? { shadowColor: "#000", shadowOpacity: 0, shadowRadius: 0, shadowOffset: { width: 0, height: 0 }, elevation: 0 }
      : { shadowColor: "#3c2814", shadowOpacity: 0.08, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 2 },
  };
}

/** Built once, so identity is stable (styles are cached per theme object). */
export const lightTheme = build("light", lightPalette);
export const darkTheme = build("dark", darkPalette);

export const resolveMode = (pref: ColorPreference, system: string | null | undefined): ColorMode =>
  pref === "system" ? (system === "dark" ? "dark" : "light") : pref;

export const themeFor = (mode: ColorMode) => (mode === "dark" ? darkTheme : lightTheme);
