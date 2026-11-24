import { ActivityIndicator, Pressable, StyleSheet, type StyleProp, type ViewStyle } from "react-native";
import { colors, radius, spacing } from "@/theme";
import { Text } from "./Text";

type Variant = "primary" | "light" | "danger" | "ghost";

export type ButtonProps = {
  label: string;
  onPress: () => void;
  variant?: Variant;
  disabled?: boolean;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
  testID?: string;
};

export function Button({ label, onPress, variant = "primary", disabled, loading, style, testID }: ButtonProps) {
  const v = VARIANTS[variant];
  const inactive = disabled || loading;
  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityState={{ disabled: !!inactive, busy: !!loading }}
      onPress={onPress}
      disabled={inactive}
      style={({ pressed }) => [styles.base, { backgroundColor: v.bg }, pressed && styles.pressed, inactive && styles.disabled, style]}
    >
      {loading ? <ActivityIndicator color={v.fg} size="small" /> : <Text style={[styles.label, { color: v.fg }]}>{label}</Text>}
    </Pressable>
  );
}

const VARIANTS: Record<Variant, { bg: string; fg: string }> = {
  primary: { bg: colors.accent, fg: colors.white },
  light: { bg: colors.buttonLight, fg: colors.ink },
  danger: { bg: colors.badSoft, fg: colors.bad },
  ghost: { bg: "transparent", fg: colors.accent },
};

const styles = StyleSheet.create({
  base: { minHeight: 44, paddingHorizontal: spacing.lg, borderRadius: radius.sm, alignItems: "center", justifyContent: "center" },
  label: { fontWeight: "600" },
  pressed: { opacity: 0.85 },
  disabled: { opacity: 0.5 },
});
