import { Pressable, StyleSheet } from "react-native";
import type { Tone } from "@/domain/tone";
import { radius, toneColors } from "@/theme";
import { Text } from "./Text";

/** Small pill label. Pressable when `onPress` is given (e.g. example questions). */
export function Chip({ label, tone = "accent", onPress, testID }: { label: string; tone?: Tone; onPress?: () => void; testID?: string }) {
  const c = toneColors[tone];
  return (
    <Pressable testID={testID} disabled={!onPress} onPress={onPress} accessibilityRole={onPress ? "button" : "text"}
      style={[styles.chip, { backgroundColor: c.bg }]}>
      <Text style={[styles.text, { color: c.fg }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: radius.pill, marginRight: 6, marginBottom: 6, alignSelf: "flex-start" },
  text: { fontSize: 12.5, fontWeight: "600", lineHeight: 18 },
});
