import { View, type ViewProps } from "react-native";
import type { Tone } from "@/domain/tone";
import { makeStyles, radius, spacing, useTheme } from "@/theme";
import { Icon, type IconName } from "./Icon";
import { Text } from "./Text";

/** Surface with soft shadow (light) or hairline border (dark). `tone` adds a coloured accent bar. */
export function Card({ style, title, icon, tone, children, ...rest }: ViewProps & { title?: string; icon?: IconName; tone?: Tone }) {
  const s = useStyles();
  const t = useTheme();
  const bar = tone ? (tone === "neutral" ? t.colors.accent : t.tones[tone].fg) : null;
  return (
    <View {...rest} style={[s.card, t.shadow, style]}>
      {bar ? <View style={[s.bar, { backgroundColor: bar }]} /> : null}
      {title ? (
        <View style={s.titleRow}>
          {icon ? <View style={s.iconBadge}><Icon name={icon} size={16} color={t.colors.accent} /></View> : null}
          <Text variant="subheading" style={s.flex}>{title}</Text>
        </View>
      ) : null}
      {children}
    </View>
  );
}

const useStyles = makeStyles((t) => ({
  card: {
    backgroundColor: t.colors.card, borderRadius: radius.lg, padding: spacing.lg, marginBottom: spacing.md,
    borderWidth: t.dark ? 1 : 0.5, borderColor: t.dark ? t.colors.line : t.colors.lineSoft, overflow: "hidden",
  },
  bar: { position: "absolute", left: 0, top: 0, bottom: 0, width: 4 },
  titleRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm, marginBottom: spacing.md },
  iconBadge: { width: 30, height: 30, borderRadius: radius.sm, backgroundColor: t.colors.accentSoft, alignItems: "center", justifyContent: "center" },
  flex: { flex: 1 },
}));
