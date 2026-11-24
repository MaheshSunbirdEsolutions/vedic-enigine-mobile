import { StyleSheet, TextInput, View, type TextInputProps } from "react-native";
import { colors, radius, spacing } from "@/theme";
import { Text } from "./Text";

export type TextFieldProps = TextInputProps & { label?: string; error?: string | null };

export function TextField({ label, error, style, ...rest }: TextFieldProps) {
  return (
    <View style={styles.wrap}>
      {label ? <Text variant="label">{label}</Text> : null}
      <TextInput
        placeholderTextColor={colors.muted}
        accessibilityLabel={rest.accessibilityLabel ?? label}
        {...rest}
        style={[styles.input, error ? styles.inputError : null, rest.multiline && styles.multi, style]}
      />
      {error ? <Text variant="small" style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: spacing.md },
  input: {
    borderWidth: 1, borderColor: colors.line, borderRadius: radius.sm, backgroundColor: colors.card,
    paddingHorizontal: spacing.md, paddingVertical: 10, fontSize: 15, color: colors.ink,
  },
  inputError: { borderColor: colors.bad },
  multi: { minHeight: 72, textAlignVertical: "top" },
  error: { color: colors.bad, marginTop: 4 },
});
