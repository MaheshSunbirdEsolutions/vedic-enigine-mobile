/**
 * Colour scheme, taken 1:1 from the web app (vedic-engine: web/app/globals.css :root variables)
 * so both apps look like one product. Change a colour here and in globals.css together.
 */
export const colors = {
  bg: "#faf7f2",
  card: "#ffffff",
  ink: "#2b2420",
  muted: "#7a6f66",
  line: "#e8e0d6",
  lineSoft: "#f1ebe4",
  accent: "#c2571a",
  accentSoft: "#fbeadf",
  good: "#2f7d4f",
  goodSoft: "#e3f2e8",
  bad: "#b23b3b",
  badSoft: "#f8e3e3",
  mixed: "#9a6b00",
  mixedSoft: "#fbf0d6",
  neutralSoft: "#f0ece6",
  buttonLight: "#f4eee7",
  panel: "#fbf7f1",
  chartBg: "#fffdf9",
  chartLine: "#c9b9a6",
  chartLabel: "#b39a82",
  shimmerBase: "#efe7dd",
  shimmerHighlight: "#f7f1ea",
  white: "#ffffff",
} as const;

export type ColorName = keyof typeof colors;
