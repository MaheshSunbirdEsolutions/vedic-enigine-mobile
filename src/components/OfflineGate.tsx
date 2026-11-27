import { useEffect } from "react";
import { BackHandler, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Button, Icon, InlineError, Text } from "@/components/ui";
import { useI18n } from "@/i18n/I18nProvider";
import { makeStyles, spacing, useTheme } from "@/theme";

export type OfflineGateProps = {
  checking: boolean;
  stillOffline: boolean;
  onRefresh: () => void;
};

/**
 * Full-screen blocking view displayed over the entire app when no internet connection
 * is detected. Prevents navigation (including Android back press) until refreshed online.
 */
export function OfflineGate({ checking, stillOffline, onRefresh }: OfflineGateProps) {
  const s = useStyles();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { t } = useI18n();

  useEffect(() => {
    const sub = BackHandler.addEventListener("hardwareBackPress", () => true);
    return () => sub.remove();
  }, []);

  return (
    <View
      testID="offline-gate"
      accessibilityViewIsModal
      style={[
        s.container,
        {
          paddingTop: Math.max(insets.top, spacing.xl),
          paddingBottom: Math.max(insets.bottom, spacing.xl),
        },
      ]}
    >
      <View style={s.content}>
        <View style={s.badge}>
          <Icon name="cloud-offline-outline" size={38} color={theme.colors.bad} />
        </View>
        <Text variant="title" style={s.center}>{t("net_offline_title")}</Text>
        <Text variant="muted" style={[s.center, s.body]}>{t("net_offline_body")}</Text>
        {stillOffline ? (
          <View style={s.feedback}>
            <InlineError message={t("net_still_offline")} />
          </View>
        ) : null}
        <Button
          testID="offline-refresh"
          icon="refresh"
          label={t("net_refresh")}
          loading={checking}
          onPress={onRefresh}
          style={s.button}
        />
      </View>
    </View>
  );
}

const useStyles = makeStyles((t) => ({
  container: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    zIndex: 999,
    backgroundColor: t.colors.bg,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: spacing.xl,
  },
  content: {
    width: "100%",
    maxWidth: 340,
    alignItems: "center",
    gap: spacing.sm,
  },
  badge: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: t.colors.badSoft,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.sm,
  },
  center: { textAlign: "center" },
  body: { maxWidth: 300 },
  feedback: { width: "100%" },
  button: { marginTop: spacing.md, minWidth: 168 },
}));
