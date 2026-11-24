import type { ReactNode } from "react";
import { View } from "react-native";
import { makeStyles, radius, spacing } from "@/theme";
import { Text } from "./Text";

/** Label + value tile (the web's `.stat`). */
export function Stat({ label, value, children }: { label: string; value?: ReactNode; children?: ReactNode }) {
  const s = useStyles();
  return (
    <View style={s.stat}>
      <Text variant="small">{label}</Text>
      {value !== undefined ? <Text variant="subheading">{value}</Text> : null}
      {children}
    </View>
  );
}

export function StatRow({ children }: { children: ReactNode }) {
  return <View style={useStyles().row}>{children}</View>;
}

const useStyles = makeStyles((t) => ({
  row: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, marginBottom: spacing.md },
  stat: {
    backgroundColor: t.colors.card, borderWidth: 1, borderColor: t.colors.line, borderRadius: radius.md,
    paddingVertical: spacing.sm, paddingHorizontal: spacing.md, minWidth: 140, flexGrow: 1,
  },
}));
