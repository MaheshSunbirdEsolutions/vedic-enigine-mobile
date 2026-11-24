import type { ComponentRef, Ref } from "react";
import { TextInput, View, type TextInputProps } from "react-native";
import { makeStyles, radius, spacing, useTheme } from "@/theme";
import { Text } from "./Text";

export type TextFieldProps = TextInputProps & { label?: string; error?: string | null; ref?: Ref<ComponentRef<typeof TextInput>> };

export function TextField({ label, error, style, ref, ...rest }: TextFieldProps) {
  const s = useStyles();
  const t = useTheme();
  return (
    <View style={s.wrap}>
      {label ? <Text variant="label">{label}</Text> : null}
      <TextInput
        ref={ref}
        placeholderTextColor={t.colors.muted}
        selectionColor={t.colors.accent}
        keyboardAppearance={t.dark ? "dark" : "light"}
        accessibilityLabel={rest.accessibilityLabel ?? label}
        aria-invalid={!!error}
        {...rest}
        style={[s.input, error ? s.inputError : null, rest.multiline && s.multi, style]}
      />
      {error ? <Text variant="small" style={s.error} accessibilityLiveRegion="polite">{error}</Text> : null}
    </View>
  );
}

const useStyles = makeStyles((t) => ({
  wrap: { marginBottom: spacing.md },
  input: {
    borderWidth: 1, borderColor: t.colors.line, borderRadius: radius.sm, backgroundColor: t.colors.card,
    paddingHorizontal: spacing.md, paddingVertical: 10, fontSize: 15, color: t.colors.ink,
  },
  inputError: { borderColor: t.colors.bad },
  multi: { minHeight: 72, textAlignVertical: "top" },
  error: { color: t.colors.bad, marginTop: 4 },
}));
