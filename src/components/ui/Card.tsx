import { View, type ViewProps } from "react-native";
import type { Tone } from "@/domain/tone";
import { makeStyles, radius, spacing, useTheme } from "@/theme";
import { Text } from "./Text";

/** Panel with the web's border + shadow. `tone` adds a coloured left edge (findings). */
export function Card({ style, title, tone, children, ...rest }: ViewProps & { title?: string; tone?: Tone }) {
  const s = useStyles();
  const t = useTheme();
  const edge = tone ? { borderLeftWidth: 4, borderLeftColor: tone === "neutral" ? t.colors.accent : t.tones[tone].fg } : null;
  return (
    <View {...rest} style={[s.card, edge, style]}>
      {title ? <Text variant="subheading" style={s.title}>{title}</Text> : null}
      {children}
    </View>
  );
}

const useStyles = makeStyles((t) => ({
  card: {
    backgroundColor: t.colors.card, borderColor: t.colors.line, borderWidth: 1, borderRadius: radius.lg,
    padding: spacing.lg, marginBottom: spacing.md, ...t.shadow,
  },
  title: { marginBottom: spacing.sm },
}));
