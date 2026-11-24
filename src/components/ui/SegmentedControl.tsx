import { Pressable, ScrollView, View } from "react-native";
import { makeStyles, radius, spacing } from "@/theme";
import { Text } from "./Text";

export type Segment<T extends string> = { value: T; label: string };

/**
 * Row of options; one is selected. `scroll` makes it a horizontal strip
 * (used for the kundli tabs and report picker).
 */
export function SegmentedControl<T extends string>({ segments, value, onChange, scroll, testID }: {
  segments: Segment<T>[]; value: T; onChange: (v: T) => void; scroll?: boolean; testID?: string;
}) {
  const s = useStyles();
  const items = segments.map((seg) => {
    const on = seg.value === value;
    return (
      <Pressable key={seg.value} testID={testID ? `${testID}-${seg.value}` : undefined} onPress={() => onChange(seg.value)}
        accessibilityRole="tab" accessibilityState={{ selected: on }}
        style={[s.item, on && s.on, !scroll && s.flex]}>
        <Text style={[s.label, on && s.labelOn]} numberOfLines={1}>{seg.label}</Text>
      </Pressable>
    );
  });
  return scroll
    ? <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.row} style={s.scroll}>{items}</ScrollView>
    : <View style={s.row}>{items}</View>;
}

const useStyles = makeStyles((t) => ({
  scroll: { flexGrow: 0 },
  row: { flexDirection: "row", gap: 6, paddingVertical: 2, marginBottom: spacing.md },
  item: { backgroundColor: t.colors.buttonLight, borderRadius: radius.sm, paddingVertical: 8, paddingHorizontal: spacing.md, alignItems: "center" },
  flex: { flex: 1 },
  on: { backgroundColor: t.colors.accent },
  label: { fontSize: 14, fontWeight: "500" },
  labelOn: { color: t.colors.onAccent, fontWeight: "600" },
}));
