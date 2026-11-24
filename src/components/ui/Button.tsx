import { ActivityIndicator, Pressable, type StyleProp, type ViewStyle } from "react-native";
import { makeStyles, radius, spacing, useTheme, type Theme } from "@/theme";
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

const variantColors = (t: Theme, v: Variant) => ({
  primary: { bg: t.colors.accent, fg: t.colors.onAccent },
  light: { bg: t.colors.buttonLight, fg: t.colors.ink },
  danger: { bg: t.colors.badSoft, fg: t.colors.bad },
  ghost: { bg: "transparent", fg: t.colors.accent },
})[v];

export function Button({ label, onPress, variant = "primary", disabled, loading, style, testID }: ButtonProps) {
  const s = useStyles();
  const v = variantColors(useTheme(), variant);
  const inactive = disabled || loading;
  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityState={{ disabled: !!inactive, busy: !!loading }}
      onPress={onPress}
      disabled={inactive}
      style={({ pressed }) => [s.base, { backgroundColor: v.bg }, pressed && s.pressed, inactive && s.disabled, style]}
    >
      {loading ? <ActivityIndicator color={v.fg} size="small" /> : <Text style={[s.label, { color: v.fg }]}>{label}</Text>}
    </Pressable>
  );
}

const useStyles = makeStyles(() => ({
  base: { minHeight: 44, paddingHorizontal: spacing.lg, borderRadius: radius.sm, alignItems: "center", justifyContent: "center" },
  label: { fontWeight: "600" },
  pressed: { opacity: 0.85 },
  disabled: { opacity: 0.5 },
}));
