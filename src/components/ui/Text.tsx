import { Text as RNText, StyleSheet, type TextProps } from "react-native";
import { colors, font } from "@/theme";

type Variant = "title" | "heading" | "subheading" | "body" | "muted" | "small" | "label";

/** The only text component screens use, so typography stays consistent. */
export function Text({ variant = "body", style, ...rest }: TextProps & { variant?: Variant }) {
  return <RNText {...rest} style={[styles.base, styles[variant], style]} />;
}

const styles = StyleSheet.create({
  base: { color: colors.ink, fontSize: font.size.md, lineHeight: 22 },
  title: { fontSize: font.size.xl, fontWeight: font.weight.bold, lineHeight: 26 },
  heading: { fontSize: font.size.lg, fontWeight: font.weight.semibold, lineHeight: 24 },
  subheading: { fontSize: font.size.md, fontWeight: font.weight.semibold },
  body: {},
  muted: { color: colors.muted, fontSize: 14, lineHeight: 20 },
  small: { color: colors.muted, fontSize: font.size.sm, lineHeight: 18 },
  label: { color: colors.muted, fontSize: font.size.sm, fontWeight: font.weight.semibold, marginBottom: 4 },
});
