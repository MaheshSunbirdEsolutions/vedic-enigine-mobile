import { ActivityIndicator, View, type StyleProp, type ViewStyle } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { makeStyles, radius, spacing, useTheme, type Theme } from "@/theme";
import { Icon, type IconName } from "./Icon";
import { PressableScale } from "./PressableScale";
import { Text } from "./Text";

type Variant = "primary" | "secondary" | "danger" | "ghost";

export type ButtonProps = {
  label: string;
  onPress: () => void;
  variant?: Variant;
  size?: "md" | "sm";
  icon?: IconName;
  disabled?: boolean;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
  testID?: string;
};

const fgFor = (t: Theme, v: Variant) => ({ primary: t.colors.onAccent, secondary: t.colors.ink, danger: t.colors.bad, ghost: t.colors.accent })[v];

export function Button({ label, onPress, variant = "primary", size = "md", icon, disabled, loading, style, testID }: ButtonProps) {
  const s = useStyles();
  const t = useTheme();
  const fg = fgFor(t, variant);
  const inactive = disabled || loading;
  const content = (
    <View style={[s.inner, size === "sm" && s.innerSm]}>
      {loading ? <ActivityIndicator color={fg} size="small" /> : (
        <>
          {icon ? <Icon name={icon} size={size === "sm" ? 16 : 18} color={fg} /> : null}
          <Text weight="semibold" style={[s.label, size === "sm" && s.labelSm, { color: fg }]} numberOfLines={1}>{label}</Text>
        </>
      )}
    </View>
  );
  return (
    <PressableScale
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: !!inactive, busy: !!loading }}
      onPress={onPress}
      disabled={inactive}
      haptic={variant === "ghost" ? "selection" : "light"}
      style={[s.base, s[variant], variant === "primary" && !inactive && t.shadow, inactive && s.disabled, style]}
    >
      {variant === "primary" ? (
        <LinearGradient colors={t.gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[s.gradient, size === "sm" && s.gradientSm]}>{content}</LinearGradient>
      ) : content}
    </PressableScale>
  );
}

const useStyles = makeStyles((t) => ({
  base: { borderRadius: radius.md, overflow: "hidden" },
  primary: { backgroundColor: t.colors.accent },
  secondary: { backgroundColor: t.colors.fill },
  danger: { backgroundColor: t.colors.badSoft },
  ghost: { backgroundColor: "transparent" },
  gradient: { borderRadius: radius.md },
  gradientSm: { borderRadius: radius.sm },
  inner: { minHeight: 48, paddingHorizontal: spacing.lg, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: spacing.sm },
  innerSm: { minHeight: 36, paddingHorizontal: spacing.md, gap: 6 },
  label: { fontSize: 15, lineHeight: Math.round(20 * t.fonts.lineScale) },
  labelSm: { fontSize: 13.5 },
  disabled: { opacity: 0.45 },
}));
