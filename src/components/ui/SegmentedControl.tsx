import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { colors, radius, spacing } from "@/theme";
import { Text } from "./Text";

export type Segment<T extends string> = { value: T; label: string };

/**
 * Row of options; one is selected. `scroll` makes it a horizontal strip
 * (used for the kundli tabs and report picker).
 */
export function SegmentedControl<T extends string>({ segments, value, onChange, scroll, testID }: {
  segments: Segment<T>[]; value: T; onChange: (v: T) => void; scroll?: boolean; testID?: string;
}) {
  const items = segments.map((s) => {
    const on = s.value === value;
    return (
      <Pressable key={s.value} testID={testID ? `${testID}-${s.value}` : undefined} onPress={() => onChange(s.value)}
        accessibilityRole="tab" accessibilityState={{ selected: on }}
        style={[styles.item, on && styles.on, !scroll && styles.flex]}>
        <Text style={[styles.label, on && styles.labelOn]} numberOfLines={1}>{s.label}</Text>
      </Pressable>
    );
  });
  return scroll
    ? <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row} style={styles.scroll}>{items}</ScrollView>
    : <View style={styles.row}>{items}</View>;
}

const styles = StyleSheet.create({
  scroll: { flexGrow: 0 },
  row: { flexDirection: "row", gap: 6, paddingVertical: 2, marginBottom: spacing.md },
  item: { backgroundColor: colors.buttonLight, borderRadius: radius.sm, paddingVertical: 8, paddingHorizontal: spacing.md, alignItems: "center" },
  flex: { flex: 1 },
  on: { backgroundColor: colors.accent },
  label: { fontSize: 14, fontWeight: "500" },
  labelOn: { color: colors.white, fontWeight: "600" },
});
