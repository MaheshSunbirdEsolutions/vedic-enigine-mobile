/**
 * Font sets. Custom fonts in React Native need one family name per weight (fontWeight does not
 * pick a weight of a custom font on Android), so components use these names, never fontWeight.
 *
 * Latin: Fraunces (display, a warm serif that suits Jyotish) + Plus Jakarta Sans (UI and body).
 * Devanagari: Mukta for everything; Hindi needs taller lines so matras are not clipped.
 * The names match the keys exported by the @expo-google-fonts packages (loaded in app/_layout).
 */
export type Script = "latin" | "devanagari";

export type FontSet = {
  display: string;
  regular: string;
  medium: string;
  semibold: string;
  bold: string;
  /** Multiplier for line heights (Devanagari needs more room above and below). */
  lineScale: number;
};

export const fontSets: Record<Script, FontSet> = {
  latin: {
    display: "Fraunces_600SemiBold",
    regular: "PlusJakartaSans_400Regular",
    medium: "PlusJakartaSans_500Medium",
    semibold: "PlusJakartaSans_600SemiBold",
    bold: "PlusJakartaSans_700Bold",
    lineScale: 1,
  },
  devanagari: {
    display: "Mukta_700Bold",
    regular: "Mukta_400Regular",
    medium: "Mukta_500Medium",
    semibold: "Mukta_600SemiBold",
    bold: "Mukta_700Bold",
    lineScale: 1.12,
  },
};

export type FontWeightName = "regular" | "medium" | "semibold" | "bold";
