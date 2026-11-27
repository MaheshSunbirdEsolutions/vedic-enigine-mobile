import { View } from "react-native";
import { Button, TextField } from "@/components/ui";
import { useI18n } from "@/i18n/I18nProvider";
import { makeStyles, spacing } from "@/theme";

export type EmailVerifyStepProps = {
  code: string;
  onChangeCode: (value: string) => void;
  disabled?: boolean;
  verifying?: boolean;
  resending?: boolean;
  onVerify: () => void;
  onResend: () => void;
};

/** Shared email verification code form used by Sign In and Sign Up. */
export function EmailVerifyStep({ code, onChangeCode, disabled, verifying, resending, onVerify, onResend }: EmailVerifyStepProps) {
  const s = useStyles();
  const { t } = useI18n();

  return (
    <View>
      <TextField
        testID="auth-code"
        label={t("auth_code")}
        icon="shield-checkmark-outline"
        value={code}
        onChangeText={onChangeCode}
        placeholder={t("auth_code_ph")}
        keyboardType="number-pad"
        autoCapitalize="none"
        editable={!disabled}
      />
      <Button
        testID="verify-code-submit"
        label={t("auth_verify_btn")}
        loading={verifying}
        disabled={disabled}
        onPress={onVerify}
      />
      <Button
        testID="resend-code-btn"
        variant="ghost"
        size="sm"
        style={s.altBtn}
        label={t("auth_resend_code")}
        loading={resending}
        disabled={disabled}
        onPress={onResend}
      />
    </View>
  );
}

const useStyles = makeStyles(() => ({
  altBtn: { marginTop: spacing.sm },
}));
