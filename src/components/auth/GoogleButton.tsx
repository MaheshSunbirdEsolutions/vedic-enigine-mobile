import { View } from "react-native";
import { useSSO } from "@clerk/expo/experimental";
import { makeRedirectUri } from "expo-auth-session";
import * as WebBrowser from "expo-web-browser";
import { formatClerkError } from "@/auth/clerkError";
import { Button, Text } from "@/components/ui";
import { useI18n } from "@/i18n/I18nProvider";
import { makeStyles, spacing } from "@/theme";

WebBrowser.maybeCompleteAuthSession();

export type GoogleButtonProps = {
  disabled?: boolean;
  loading?: boolean;
  onStart: () => void;
  onSuccess: () => Promise<void>;
  onError: (msg: string) => void;
  onSettled: () => void;
};

/** Shared Google OAuth / SSO button + "or" divider for Sign In and Sign Up. */
export function GoogleButton({ disabled, loading, onStart, onSuccess, onError, onSettled }: GoogleButtonProps) {
  const s = useStyles();
  const { t } = useI18n();
  const { startSSOFlow } = useSSO();

  const onPress = async () => {
    onStart();
    try {
      const redirectUrl = makeRedirectUri({ path: "oauth-native-callback" });
      const { createdSessionId } = await startSSOFlow({ strategy: "oauth_google", redirectUrl });
      if (createdSessionId) {
        await onSuccess();
      }
    } catch (err) {
      onError(formatClerkError(err, t("auth_failed")));
    } finally {
      onSettled();
    }
  };

  return (
    <View>
      <Button
        testID="sso-google"
        variant="secondary"
        icon="logo-google"
        label={t("auth_continue_google")}
        loading={loading}
        disabled={disabled}
        onPress={() => void onPress()}
      />
      <View style={s.divider}>
        <View style={s.line} />
        <Text variant="small" style={s.orText}>{t("auth_or")}</Text>
        <View style={s.line} />
      </View>
    </View>
  );
}

const useStyles = makeStyles((t) => ({
  divider: { flexDirection: "row", alignItems: "center", gap: spacing.sm, marginVertical: spacing.md },
  line: { flex: 1, height: 1, backgroundColor: t.colors.line },
  orText: { color: t.colors.muted },
}));
