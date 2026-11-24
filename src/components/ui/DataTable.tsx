import { View } from "react-native";
import { makeStyles, radius, spacing, useTheme } from "@/theme";
import { Text } from "./Text";

export type Column<T> = { key: string; label: string; flex?: number; render: (row: T) => React.ReactNode };

/** Compact table for small datasets (planets, houses, kootas). Wraps instead of scrolling sideways. */
export function DataTable<T>({ columns, rows, rowKey, highlight }: {
  columns: Column<T>[]; rows: T[]; rowKey: (r: T, i: number) => string; highlight?: (r: T) => boolean;
}) {
  const styles = useStyles();
  const t = useTheme();
  return (
    <View style={[styles.table, t.shadow]}>
      <View style={[styles.row, styles.head]}>
        {columns.map((c) => <Text key={c.key} variant="label" style={[styles.cell, { flex: c.flex ?? 1 }]}>{c.label}</Text>)}
      </View>
      {rows.map((r, i) => (
        <View key={rowKey(r, i)} style={[styles.row, i === rows.length - 1 && styles.last, highlight?.(r) && styles.hl]}>
          {columns.map((c) => {
            const v = c.render(r);
            return (
              <View key={c.key} style={[styles.cell, { flex: c.flex ?? 1 }]}>
                {typeof v === "string" || typeof v === "number" ? <Text style={styles.text}>{v}</Text> : v}
              </View>
            );
          })}
        </View>
      ))}
    </View>
  );
}

const useStyles = makeStyles((t) => ({
  table: {
    backgroundColor: t.colors.card, borderRadius: radius.lg, overflow: "hidden",
    borderWidth: t.dark ? 1 : 0.5, borderColor: t.dark ? t.colors.line : t.colors.lineSoft,
  },
  head: { backgroundColor: t.colors.fill, paddingVertical: 9 },
  row: { flexDirection: "row", borderBottomWidth: 0.5, borderBottomColor: t.colors.line, paddingVertical: 10, paddingHorizontal: spacing.sm },
  last: { borderBottomWidth: 0 },
  hl: { backgroundColor: t.colors.accentSoft },
  cell: { paddingHorizontal: 4, justifyContent: "center" },
  text: { fontSize: 14, lineHeight: Math.round(20 * t.fonts.lineScale) },
}));
