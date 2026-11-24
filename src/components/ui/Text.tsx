import { Text as RNText, type TextProps } from "react-native";
import { makeStyles, typeScale, type FontWeightName, type Theme } from "@/theme";

export type TextVariant = "hero" | "title" | "heading" | "subheading" | "body" | "muted" | "small" | "label";

/**
 * The only text component screens use. Font family, size, line height and colour come from the
 * theme, so the type follows the language (Latin or Devanagari) and light/dark mode.
 * Use `weight` instead of fontWeight (custom fonts need a family per weight).
 */
export function Text({ variant = "body", weight, style, ...rest }: TextProps & { variant?: TextVariant; weight?: FontWeightName }) {
  const s = useStyles();
  return <RNText {...rest} style={[s[variant], weight && s[`w_${weight}`], style]} />;
}

const v = (t: Theme, key: keyof typeof typeScale, family: string, color = t.colors.ink) => ({
  fontFamily: family,
  fontSize: typeScale[key].size,
  lineHeight: Math.round(typeScale[key].line * t.fonts.lineScale),
  color,
});

const useStyles = makeStyles((t) => ({
  hero: { ...v(t, "hero", t.fonts.display), letterSpacing: t.script === "latin" ? -0.4 : 0 },
  title: { ...v(t, "title", t.fonts.display), letterSpacing: t.script === "latin" ? -0.2 : 0 },
  heading: v(t, "heading", t.fonts.display),
  subheading: v(t, "subheading", t.fonts.semibold),
  body: v(t, "body", t.fonts.regular),
  muted: v(t, "muted", t.fonts.regular, t.colors.muted),
  small: v(t, "small", t.fonts.medium, t.colors.muted),
  label: { ...v(t, "label", t.fonts.semibold, t.colors.muted), letterSpacing: t.script === "latin" ? 0.4 : 0 },
  w_regular: { fontFamily: t.fonts.regular },
  w_medium: { fontFamily: t.fonts.medium },
  w_semibold: { fontFamily: t.fonts.semibold },
  w_bold: { fontFamily: t.fonts.bold },
}));
