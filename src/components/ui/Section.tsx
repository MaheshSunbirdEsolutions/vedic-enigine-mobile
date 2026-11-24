import type { ReactNode } from "react";
import { StyleSheet, View } from "react-native";
import { spacing } from "@/theme";
import { Text } from "./Text";

/** Heading + content block inside a tab or report. */
export function Section({ title, right, children }: { title: string; right?: ReactNode; children: ReactNode }) {
  return (
    <View style={styles.wrap}>
      <View style={styles.head}><Text variant="heading" style={styles.title}>{title}</Text>{right}</View>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginTop: spacing.md, marginBottom: spacing.sm },
  head: { flexDirection: "row", alignItems: "center", marginBottom: spacing.sm },
  title: { flex: 1 },
});
