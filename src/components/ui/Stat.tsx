import type { ReactNode } from "react";
import { View } from "react-native";
import { makeStyles, radius, spacing, useTheme } from "@/theme";
import { Text } from "./Text";

/** Label + value tile. */
export function Stat({ label, value, children }: { label: string; value?: ReactNode; children?: ReactNode }) {
  const s = useStyles();
  const t = useTheme();
  return (
    <View style={[s.stat, t.shadow]}>
      <Text variant="label" numberOfLines={1}>{label}</Text>
      {value !== undefined ? <Text variant="subheading" style={s.value}>{value}</Text> : null}
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
    backgroundColor: t.colors.card, borderRadius: radius.md, paddingVertical: spacing.md, paddingHorizontal: spacing.md,
    minWidth: 140, flexGrow: 1, flexBasis: "45%", gap: 2,
    borderWidth: t.dark ? 1 : 0.5, borderColor: t.dark ? t.colors.line : t.colors.lineSoft,
  },
  value: { marginTop: 2 },
}));
