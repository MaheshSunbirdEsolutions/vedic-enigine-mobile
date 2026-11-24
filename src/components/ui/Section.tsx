import type { ReactNode } from "react";
import { View } from "react-native";
import { makeStyles, spacing } from "@/theme";
import { Text } from "./Text";

/** Heading + content block inside a tab or report. */
export function Section({ title, right, children }: { title: string; right?: ReactNode; children: ReactNode }) {
  const s = useStyles();
  return (
    <View style={s.wrap}>
      <View style={s.head}><Text variant="heading" style={s.title}>{title}</Text>{right}</View>
      {children}
    </View>
  );
}

const useStyles = makeStyles(() => ({
  wrap: { marginTop: spacing.lg, marginBottom: spacing.sm },
  head: { flexDirection: "row", alignItems: "center", marginBottom: spacing.md },
  title: { flex: 1 },
}));
