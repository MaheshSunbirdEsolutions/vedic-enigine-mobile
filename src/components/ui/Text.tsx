import { Text as RNText, type TextProps } from "react-native";
import { font, makeStyles } from "@/theme";

type Variant = "title" | "heading" | "subheading" | "body" | "muted" | "small" | "label";

/** The only text component screens use, so typography and colour stay consistent. */
export function Text({ variant = "body", style, ...rest }: TextProps & { variant?: Variant }) {
  const s = useStyles();
  return <RNText {...rest} style={[s.base, s[variant], style]} />;
}

const useStyles = makeStyles((t) => ({
  base: { color: t.colors.ink, fontSize: font.size.md, lineHeight: 22 },
  title: { fontSize: font.size.xl, fontWeight: font.weight.bold, lineHeight: 26 },
  heading: { fontSize: font.size.lg, fontWeight: font.weight.semibold, lineHeight: 24 },
  subheading: { fontSize: font.size.md, fontWeight: font.weight.semibold },
  body: {},
  muted: { color: t.colors.muted, fontSize: 14, lineHeight: 20 },
  small: { color: t.colors.muted, fontSize: font.size.sm, lineHeight: 18 },
  label: { color: t.colors.muted, fontSize: font.size.sm, fontWeight: font.weight.semibold, marginBottom: 4 },
}));
