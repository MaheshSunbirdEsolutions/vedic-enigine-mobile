/** Empty and error states, shared by every screen. */
import { View } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";
import { errorMessageKey, isApiError } from "@/api/errors";
import { useI18n } from "@/i18n/I18nProvider";
import { makeStyles, radius, spacing, useTheme } from "@/theme";
import { Button } from "./Button";
import { Icon } from "./Icon";
import { LogoMark } from "./LogoMark";
import { Text } from "./Text";

export function EmptyState({ title, message, action, testID = "empty-state" }: {
  title?: string; message: string; action?: { label: string; onPress: () => void; icon?: Parameters<typeof Button>[0]["icon"] }; testID?: string;
}) {
  const s = useStyles();
  const t = useTheme();
  return (
    <Animated.View entering={FadeIn.duration(260)} testID={testID} style={s.empty}>
      <View style={s.badge}><LogoMark size={44} ring={t.colors.accentSoft} /></View>
      {title ? <Text variant="heading" style={s.center}>{title}</Text> : null}
      <Text variant="muted" style={[s.center, s.message]}>{message}</Text>
      {action ? <Button label={action.label} icon={action.icon} onPress={action.onPress} style={s.action} /> : null}
    </Animated.View>
  );
}

export function ErrorState({ error, onRetry, testID = "error-state" }: { error: unknown; onRetry?: () => void; testID?: string }) {
  const s = useStyles();
  const t = useTheme();
  const { t: tr } = useI18n();
  const detail = isApiError(error) && error.kind === "http" ? error.detail : undefined;
  return (
    <Animated.View entering={FadeIn.duration(200)} testID={testID} style={s.error} accessibilityRole="alert">
      <View style={s.errorRow}>
        <Icon name="cloud-offline-outline" size={20} color={t.colors.bad} />
        <View style={s.flex}>
          <Text weight="medium" style={s.errorText}>{tr(errorMessageKey(error))}</Text>
          {detail ? <Text variant="small" style={s.detail}>{detail}</Text> : null}
        </View>
      </View>
      {onRetry ? <Button testID={`${testID}-retry`} label={tr("retry")} icon="refresh" variant="secondary" size="sm" onPress={onRetry} style={s.retry} /> : null}
    </Animated.View>
  );
}

/** Inline error line under a form or button (no retry). */
export function InlineError({ message }: { message?: string | null }) {
  const s = useStyles();
  const t = useTheme();
  if (!message) return null;
  return (
    <Animated.View entering={FadeIn.duration(160)} style={s.inline} accessibilityRole="alert">
      <Icon name="alert-circle-outline" size={16} color={t.colors.bad} />
      <Text variant="small" style={[s.errorText, s.flex]}>{message}</Text>
    </Animated.View>
  );
}

const useStyles = makeStyles((t) => ({
  empty: { alignItems: "center", paddingVertical: spacing.xxxl, paddingHorizontal: spacing.xl, gap: spacing.sm },
  badge: { width: 84, height: 84, borderRadius: 42, backgroundColor: t.colors.accentSoft, alignItems: "center", justifyContent: "center", marginBottom: spacing.sm },
  center: { textAlign: "center" },
  message: { maxWidth: 320 },
  action: { marginTop: spacing.md, alignSelf: "center" },
  error: { backgroundColor: t.colors.badSoft, borderRadius: radius.md, padding: spacing.md, marginVertical: spacing.sm, gap: spacing.sm },
  errorRow: { flexDirection: "row", gap: spacing.sm, alignItems: "flex-start" },
  flex: { flex: 1 },
  errorText: { color: t.colors.bad },
  detail: { color: t.colors.bad, marginTop: 2, opacity: 0.85 },
  retry: { alignSelf: "flex-start", backgroundColor: t.colors.card },
  inline: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: t.colors.badSoft, borderRadius: radius.sm, paddingVertical: 8, paddingHorizontal: 10, marginTop: spacing.sm },
}));
