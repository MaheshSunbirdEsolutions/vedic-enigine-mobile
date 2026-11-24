import { StyleSheet, View, type ViewProps } from "react-native";
import type { Tone } from "@/domain/tone";
import { colors, radius, shadow, spacing, toneColors } from "@/theme";
import { Text } from "./Text";

/** White panel with the web's border + shadow. `tone` adds a coloured left edge (findings). */
export function Card({ style, title, tone, children, ...rest }: ViewProps & { title?: string; tone?: Tone }) {
  return (
    <View {...rest} style={[styles.card, tone && { borderLeftWidth: 4, borderLeftColor: tone === "neutral" ? colors.accent : toneColors[tone].fg }, style]}>
      {title ? <Text variant="subheading" style={styles.title}>{title}</Text> : null}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card, borderColor: colors.line, borderWidth: 1, borderRadius: radius.lg,
    padding: spacing.lg, marginBottom: spacing.md, ...shadow,
  },
  title: { marginBottom: spacing.sm },
});
