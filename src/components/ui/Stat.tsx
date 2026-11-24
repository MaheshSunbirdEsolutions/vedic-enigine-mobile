import type { ReactNode } from "react";
import { StyleSheet, View } from "react-native";
import { colors, radius, spacing } from "@/theme";
import { Text } from "./Text";

/** Label + value tile (the web's `.stat`). */
export function Stat({ label, value, children }: { label: string; value?: ReactNode; children?: ReactNode }) {
  return (
    <View style={styles.stat}>
      <Text variant="small">{label}</Text>
      {value !== undefined ? <Text variant="subheading">{value}</Text> : null}
      {children}
    </View>
  );
}

export function StatRow({ children }: { children: ReactNode }) {
  return <View style={styles.row}>{children}</View>;
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, marginBottom: spacing.md },
  stat: {
    backgroundColor: colors.card, borderWidth: 1, borderColor: colors.line, borderRadius: radius.md,
    paddingVertical: spacing.sm, paddingHorizontal: spacing.md, minWidth: 140, flexGrow: 1,
  },
});
