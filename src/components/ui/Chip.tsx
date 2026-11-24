import type { Tone } from "@/domain/tone";
import { makeStyles, radius, useTheme } from "@/theme";
import { PressableScale } from "./PressableScale";
import { Text } from "./Text";

/** Small pill label. Pressable when `onPress` is given (e.g. example questions). */
export function Chip({ label, tone = "accent", onPress, testID }: { label: string; tone?: Tone; onPress?: () => void; testID?: string }) {
  const s = useStyles();
  const c = useTheme().tones[tone];
  return (
    <PressableScale testID={testID} disabled={!onPress} onPress={onPress} accessibilityRole={onPress ? "button" : "text"}
      haptic={onPress ? "selection" : false} style={[s.chip, { backgroundColor: c.bg }]}>
      <Text weight="semibold" style={[s.text, { color: c.fg }]}>{label}</Text>
    </PressableScale>
  );
}

const useStyles = makeStyles((t) => ({
  chip: { paddingHorizontal: 11, paddingVertical: 4, borderRadius: radius.pill, marginRight: 6, marginBottom: 6, alignSelf: "flex-start" },
  text: { fontSize: 12.5, lineHeight: Math.round(18 * t.fonts.lineScale) },
}));
