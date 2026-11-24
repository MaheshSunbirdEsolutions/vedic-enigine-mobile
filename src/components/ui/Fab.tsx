import { LinearGradient } from "expo-linear-gradient";
import Animated, { FadeInDown } from "react-native-reanimated";
import { makeStyles, radius, spacing, useTheme } from "@/theme";
import { Icon, type IconName } from "./Icon";
import { PressableScale } from "./PressableScale";
import { Text } from "./Text";

/** Extended floating action button, bottom-right of a screen. */
export function Fab({ icon, label, onPress, testID }: { icon: IconName; label: string; onPress: () => void; testID?: string }) {
  const s = useStyles();
  const t = useTheme();
  return (
    <Animated.View entering={FadeInDown.delay(120).springify().damping(16)} style={[s.wrap, t.shadowRaised]}>
      <PressableScale testID={testID} accessibilityRole="button" accessibilityLabel={label} onPress={onPress} scaleTo={0.94} style={s.press}>
        <LinearGradient colors={t.gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.fab}>
          <Icon name={icon} size={20} color={t.colors.onAccent} />
          <Text weight="semibold" numberOfLines={1} style={s.label}>{label}</Text>
        </LinearGradient>
      </PressableScale>
    </Animated.View>
  );
}

const useStyles = makeStyles((t) => ({
  wrap: { position: "absolute", right: spacing.lg, bottom: spacing.xl, borderRadius: radius.pill, maxWidth: "90%" },
  press: { borderRadius: radius.pill, overflow: "hidden" },
  fab: { flexDirection: "row", alignItems: "center", gap: spacing.sm, paddingVertical: 13, paddingHorizontal: spacing.xl, borderRadius: radius.pill, flexShrink: 0 },
  // Never wrap or clip: Devanagari ("नई कुंडली") needs the taller line and no shrinking.
  label: { color: t.colors.onAccent, fontSize: 15, lineHeight: Math.round(21 * t.fonts.lineScale), flexShrink: 0, includeFontPadding: false },
}));
