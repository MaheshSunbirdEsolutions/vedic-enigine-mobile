/**
 * Colour palettes. Light is 1:1 with the web app (vedic-engine web/app/globals.css :root);
 * dark is the same warm family, tuned for contrast on dark surfaces (WCAG AA for text).
 * Change a light colour here and in globals.css together.
 */
export type Palette = {
  bg: string; card: string; ink: string; muted: string; line: string; lineSoft: string;
  accent: string; accentSoft: string; onAccent: string;
  good: string; goodSoft: string; bad: string; badSoft: string; mixed: string; mixedSoft: string;
  neutralSoft: string; buttonLight: string; panel: string;
  chartBg: string; chartLine: string; chartLabel: string;
  shimmerBase: string; toastBg: string; toastText: string; overlay: string;
};

export const lightPalette: Palette = {
  bg: "#faf7f2", card: "#ffffff", ink: "#2b2420", muted: "#7a6f66", line: "#e8e0d6", lineSoft: "#f1ebe4",
  accent: "#c2571a", accentSoft: "#fbeadf", onAccent: "#ffffff",
  good: "#2f7d4f", goodSoft: "#e3f2e8", bad: "#b23b3b", badSoft: "#f8e3e3", mixed: "#9a6b00", mixedSoft: "#fbf0d6",
  neutralSoft: "#f0ece6", buttonLight: "#f4eee7", panel: "#fbf7f1",
  chartBg: "#fffdf9", chartLine: "#c9b9a6", chartLabel: "#b39a82",
  shimmerBase: "#efe7dd", toastBg: "#2b2420", toastText: "#ffffff", overlay: "rgba(43,36,32,0.4)",
};

export const darkPalette: Palette = {
  bg: "#15110e", card: "#211b16", ink: "#f2eae1", muted: "#a99b8d", line: "#3a3029", lineSoft: "#2c241e",
  accent: "#e8823f", accentSoft: "#3b2416", onAccent: "#1a110a",
  good: "#6cc792", goodSoft: "#1c3326", bad: "#ef8080", badSoft: "#3d2020", mixed: "#e2b44c", mixedSoft: "#382c14",
  neutralSoft: "#2c251f", buttonLight: "#2c251f", panel: "#1b1612",
  chartBg: "#1b1612", chartLine: "#5c4c3e", chartLabel: "#a08a74",
  shimmerBase: "#2e2620", toastBg: "#f2eae1", toastText: "#15110e", overlay: "rgba(0,0,0,0.55)",
};
