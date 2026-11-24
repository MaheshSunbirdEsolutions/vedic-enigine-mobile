import { useState, type ComponentRef, type Ref } from "react";
import { TextInput, View, type TextInputProps } from "react-native";
import { makeStyles, radius, spacing, useTheme } from "@/theme";
import { Icon, type IconName } from "./Icon";
import { Text } from "./Text";

export type TextFieldProps = TextInputProps & {
  label?: string;
  error?: string | null;
  /** Ionicons name shown inside the field on the left. */
  icon?: IconName;
  ref?: Ref<ComponentRef<typeof TextInput>>;
};

/** Filled input with a focus ring. Errors appear under the field and are announced. */
export function TextField({ label, error, icon, style, ref, onFocus, onBlur, ...rest }: TextFieldProps) {
  const s = useStyles();
  const t = useTheme();
  const [focused, setFocused] = useState(false);
  return (
    <View style={s.wrap}>
      {label ? <Text variant="label" style={s.label}>{label}</Text> : null}
      <View style={[s.box, rest.multiline && s.multiBox, focused && s.focused, !!error && s.errorBox]}>
        {icon ? <View style={s.icon}><Icon name={icon} size={18} color={focused ? t.colors.accent : t.colors.muted} /></View> : null}
        <TextInput
          ref={ref}
          placeholderTextColor={t.colors.muted}
          selectionColor={t.colors.accent}
          cursorColor={t.colors.accent}
          keyboardAppearance={t.dark ? "dark" : "light"}
          accessibilityLabel={rest.accessibilityLabel ?? label}
          aria-invalid={!!error}
          {...rest}
          onFocus={(e) => { setFocused(true); onFocus?.(e); }}
          onBlur={(e) => { setFocused(false); onBlur?.(e); }}
          style={[s.input, rest.multiline && s.multi, style]}
        />
      </View>
      {error ? <Text variant="small" style={s.error} accessibilityLiveRegion="polite">{error}</Text> : null}
    </View>
  );
}

const useStyles = makeStyles((t) => ({
  wrap: { marginBottom: spacing.md },
  label: { marginBottom: 6 },
  box: {
    flexDirection: "row", alignItems: "center", backgroundColor: t.colors.fill, borderRadius: radius.md,
    borderWidth: 1.5, borderColor: "transparent", minHeight: 50,
  },
  multiBox: { alignItems: "flex-start" },
  focused: { borderColor: t.colors.accent, backgroundColor: t.colors.card },
  errorBox: { borderColor: t.colors.bad },
  icon: { paddingLeft: spacing.md },
  input: {
    flex: 1, paddingHorizontal: spacing.md, paddingVertical: 12, fontSize: 15, color: t.colors.ink,
    fontFamily: t.fonts.regular, outlineStyle: "none" as never,
  },
  multi: { minHeight: 88, textAlignVertical: "top" },
  error: { color: t.colors.bad, marginTop: 6 },
}));
