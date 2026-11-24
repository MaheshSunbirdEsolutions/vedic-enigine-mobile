import { fontSets, type FontSet, type Script } from "./fonts";
import type { Palette } from "./palettes";
import { darkPalette, lightPalette } from "./palettes";

export type ColorMode = "light" | "dark";
/** What the user picked in Settings. "system" follows the device. */
export type ColorPreference = "system" | ColorMode;
export type Tone = "good" | "bad" | "mixed" | "neutral" | "accent";

type Shadow = {
  shadowColor: string; shadowOpacity: number; shadowRadius: number;
  shadowOffset: { width: number; height: number }; elevation: number;
};

export type Theme = {
  mode: ColorMode;
  dark: boolean;
  script: Script;
  colors: Palette;
  fonts: FontSet;
  /** Foreground/background pair per tone (chips, badges, coloured edges). */
  tones: Record<Tone, { fg: string; bg: string }>;
  /** Resting surfaces (cards) and raised ones (toast, active segment, FAB). */
  shadow: Shadow;
  shadowRaised: Shadow;
  gradient: [string, string];
};

const none: Shadow = { shadowColor: "#000", shadowOpacity: 0, shadowRadius: 0, shadowOffset: { width: 0, height: 0 }, elevation: 0 };

function build(mode: ColorMode, script: Script): Theme {
  const c = mode === "dark" ? darkPalette : lightPalette;
  const dark = mode === "dark";
  return {
    mode,
    dark,
    script,
    colors: c,
    fonts: fontSets[script],
    tones: {
      good: { fg: c.good, bg: c.goodSoft },
      bad: { fg: c.bad, bg: c.badSoft },
      mixed: { fg: c.mixed, bg: c.mixedSoft },
      neutral: { fg: c.muted, bg: c.neutralSoft },
      accent: { fg: c.accent, bg: c.accentSoft },
    },
    shadow: dark ? none : { shadowColor: "#5a3518", shadowOpacity: 0.07, shadowRadius: 14, shadowOffset: { width: 0, height: 4 }, elevation: 2 },
    shadowRaised: dark
      ? { shadowColor: "#000", shadowOpacity: 0.45, shadowRadius: 16, shadowOffset: { width: 0, height: 6 }, elevation: 8 }
      : { shadowColor: "#5a3518", shadowOpacity: 0.16, shadowRadius: 18, shadowOffset: { width: 0, height: 8 }, elevation: 8 },
    gradient: [c.accent, c.accentDeep],
  };
}

const cache = new Map<string, Theme>();

/** One theme object per mode + script, so identity is stable (styles are cached per theme). */
export function themeFor(mode: ColorMode, script: Script = "latin"): Theme {
  const k = `${mode}:${script}`;
  let t = cache.get(k);
  if (!t) cache.set(k, (t = build(mode, script)));
  return t;
}

export const lightTheme = themeFor("light");
export const darkTheme = themeFor("dark");

export const resolveMode = (pref: ColorPreference, system: string | null | undefined): ColorMode =>
  pref === "system" ? (system === "dark" ? "dark" : "light") : pref;
