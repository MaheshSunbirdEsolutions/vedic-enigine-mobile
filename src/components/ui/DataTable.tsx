import { View } from "react-native";
import { makeStyles } from "@/theme";
import { Text } from "./Text";

export type Column<T> = { key: string; label: string; flex?: number; render: (row: T) => React.ReactNode };

/** Compact table for small datasets (planets, houses, kootas). Wraps instead of scrolling sideways. */
export function DataTable<T>({ columns, rows, rowKey, highlight }: {
  columns: Column<T>[]; rows: T[]; rowKey: (r: T, i: number) => string; highlight?: (r: T) => boolean;
}) {
  const styles = useStyles();
  return (
    <View style={styles.table}>
      <View style={[styles.row, styles.head]}>
        {columns.map((c) => <Text key={c.key} variant="small" style={[styles.cell, { flex: c.flex ?? 1 }]}>{c.label}</Text>)}
      </View>
      {rows.map((r, i) => (
        <View key={rowKey(r, i)} style={[styles.row, highlight?.(r) && styles.hl]}>
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
  table: { borderTopWidth: 1, borderColor: t.colors.line },
  head: { borderBottomColor: t.colors.line },
  row: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: t.colors.lineSoft, paddingVertical: 7 },
  hl: { backgroundColor: t.colors.accentSoft },
  cell: { paddingHorizontal: 4, justifyContent: "center" },
  text: { fontSize: 14 },
}));
