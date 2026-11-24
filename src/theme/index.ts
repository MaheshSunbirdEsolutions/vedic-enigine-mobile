import { colors } from "./colors";
import type { Tone } from "@/domain/tone";

export { colors };

export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 28 } as const;
export const radius = { sm: 8, md: 10, lg: 12, pill: 999 } as const;

export const font = {
  size: { xs: 11, sm: 12.5, md: 15, lg: 17, xl: 20, xxl: 36 },
  weight: { regular: "400", medium: "500", semibold: "600", bold: "700" },
} as const;

/** Card shadow, matching --shadow on the web. */
export const shadow = {
  shadowColor: "#3c2814",
  shadowOpacity: 0.08,
  shadowRadius: 6,
  shadowOffset: { width: 0, height: 2 },
  elevation: 2,
} as const;

/** Foreground / background pair for a tone (chips, borders, badges). */
export const toneColors: Record<Tone, { fg: string; bg: string }> = {
  good: { fg: colors.good, bg: colors.goodSoft },
  bad: { fg: colors.bad, bg: colors.badSoft },
  mixed: { fg: colors.mixed, bg: colors.mixedSoft },
  neutral: { fg: colors.muted, bg: colors.neutralSoft },
  accent: { fg: colors.accent, bg: colors.accentSoft },
};
