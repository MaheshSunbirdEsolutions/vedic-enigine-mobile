/** Empty and error states, shared by every screen. */
import { StyleSheet, View } from "react-native";
import { errorMessageKey, isApiError } from "@/api/errors";
import { useI18n } from "@/i18n/I18nProvider";
import { colors, radius, spacing } from "@/theme";
import { Button } from "./Button";
import { Text } from "./Text";

export function EmptyState({ title, message, action, testID = "empty-state" }: {
  title?: string; message: string; action?: { label: string; onPress: () => void }; testID?: string;
}) {
  return (
    <View testID={testID} style={styles.empty}>
      <Text style={styles.om}>ॐ</Text>
      {title ? <Text variant="subheading" style={styles.center}>{title}</Text> : null}
      <Text variant="muted" style={styles.center}>{message}</Text>
      {action ? <Button label={action.label} onPress={action.onPress} style={styles.action} /> : null}
    </View>
  );
}

export function ErrorState({ error, onRetry, testID = "error-state" }: { error: unknown; onRetry?: () => void; testID?: string }) {
  const { t } = useI18n();
  const detail = isApiError(error) && error.kind === "http" ? error.detail : undefined;
  return (
    <View testID={testID} style={styles.error} accessibilityRole="alert">
      <Text style={styles.errorText}>{t(errorMessageKey(error))}</Text>
      {detail ? <Text variant="small" style={styles.detail}>{detail}</Text> : null}
      {onRetry ? <Button testID={`${testID}-retry`} label={t("retry")} variant="danger" onPress={onRetry} style={styles.retry} /> : null}
    </View>
  );
}

/** Inline error line under a form or button (no retry). */
export function InlineError({ message }: { message?: string | null }) {
  if (!message) return null;
  return <View style={styles.inline} accessibilityRole="alert"><Text style={styles.errorText}>{message}</Text></View>;
}

const styles = StyleSheet.create({
  empty: { alignItems: "center", paddingVertical: 40, paddingHorizontal: spacing.lg, gap: spacing.sm },
  om: { fontSize: 28, color: colors.accent },
  center: { textAlign: "center" },
  action: { marginTop: spacing.md, alignSelf: "center" },
  error: { backgroundColor: colors.badSoft, borderRadius: radius.sm, padding: spacing.md, marginVertical: spacing.sm },
  errorText: { color: colors.bad, fontSize: 14 },
  detail: { color: colors.bad, marginTop: 4 },
  retry: { marginTop: spacing.sm, alignSelf: "flex-start", backgroundColor: colors.card },
  inline: { backgroundColor: colors.badSoft, borderRadius: radius.sm, padding: 10, marginTop: spacing.sm },
});
