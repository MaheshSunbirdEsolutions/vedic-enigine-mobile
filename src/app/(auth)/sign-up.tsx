import { useEffect, useRef, useState } from "react";
import { useSignUp } from "@clerk/expo";
import { useQueryClient } from "@tanstack/react-query";
import { useLocalSearchParams, useRouter } from "expo-router";
import { queryKeys } from "@/api";
import { formatClerkError } from "@/auth/clerkError";
import { finishAuthNavigation, type AuthRouteParams } from "@/auth/navigation";
import { useAppAuth } from "@/auth/useAppAuth";
import { AuthShell } from "@/components/auth/AuthShell";
import { EmailVerifyStep } from "@/components/auth/EmailVerifyStep";
import { GoogleButton } from "@/components/auth/GoogleButton";
import { Button, InlineError, Text, TextField } from "@/components/ui";
import { useI18n } from "@/i18n/I18nProvider";

type Step = "form" | "verify";

function ConfiguredSignUp({ onBack }: { onBack: () => void }) {
  const { t } = useI18n();
  const router = useRouter();
  const params = useLocalSearchParams<AuthRouteParams>();
  const queryClient = useQueryClient();
  const { isSignedIn } = useAppAuth();
  const { signUp, fetchStatus } = useSignUp();

  const [step, setStep] = useState<Step>("form");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<"submit" | "sso" | "resend" | null>(null);
  const completedRef = useRef(false);

  const completeSignUp = async () => {
    completedRef.current = true;
    await queryClient.invalidateQueries({ queryKey: queryKeys.me });
    finishAuthNavigation(router, params);
  };

  useEffect(() => {
    if (isSignedIn && !completedRef.current) {
      completedRef.current = true;
      finishAuthNavigation(router, params);
    }
  }, [isSignedIn, params, router]);

  const loading = busy !== null || fetchStatus === "fetching";

  const handleSubmit = async () => {
    const cleanEmail = email.trim();
    if (!cleanEmail.includes("@")) return setError(t("auth_err_email"));
    if (!password) return setError(t("auth_err_password"));
    if (!signUp) return;
    setError(null);
    setBusy("submit");
    try {
      let res = await signUp.password({ emailAddress: cleanEmail, password });
      if (res.error) {
        const firstMsg = formatClerkError(res.error, "");
        // Some Clerk instances require email-code-only sign up if passwords are disabled.
        if (firstMsg.toLowerCase().includes("password") && !firstMsg.toLowerCase().includes("short") && !firstMsg.toLowerCase().includes("pwned")) {
          res = await signUp.create({ emailAddress: cleanEmail });
        }
      }
      if (res.error) return setError(formatClerkError(res.error, t("auth_failed")));

      if (signUp.status === "complete") {
        const fin = await signUp.finalize();
        if (fin.error) return setError(formatClerkError(fin.error, t("auth_failed")));
        await completeSignUp();
        return;
      }

      const sent = await signUp.verifications.sendEmailCode();
      if (sent.error) return setError(formatClerkError(sent.error, t("auth_failed")));
      setStep("verify");
    } finally {
      setBusy(null);
    }
  };

  const handleVerify = async () => {
    const cleanCode = code.trim();
    if (!cleanCode) return setError(t("auth_err_code"));
    if (!signUp) return;
    setError(null);
    setBusy("submit");
    try {
      const res = await signUp.verifications.verifyEmailCode({ code: cleanCode });
      if (res.error) return setError(formatClerkError(res.error, t("auth_failed")));

      if (signUp.status === "complete") {
        const fin = await signUp.finalize();
        if (fin.error) return setError(formatClerkError(fin.error, t("auth_failed")));
        await completeSignUp();
        return;
      }
      setError(t("auth_failed"));
    } finally {
      setBusy(null);
    }
  };

  const handleResend = async () => {
    if (!signUp) return;
    setError(null);
    setBusy("resend");
    try {
      const sent = await signUp.verifications.sendEmailCode();
      if (sent.error) setError(formatClerkError(sent.error, t("auth_failed")));
    } finally {
      setBusy(null);
    }
  };

  return (
    <AuthShell
      testID="sign-up-screen"
      title={step === "verify" ? t("auth_verify_title") : t("auth_sign_up_title")}
      subtitle={step === "verify" ? t("auth_verify_sub") : t("auth_sign_up_sub")}
      onBack={step === "verify" ? () => { setStep("form"); setCode(""); setError(null); } : onBack}
      footer={(
        <>
          <Text variant="small">{t("auth_have_account")}</Text>
          <Button
            testID="go-to-sign-in"
            variant="ghost"
            size="sm"
            label={t("auth_sign_in")}
            onPress={() => router.replace({ pathname: "/(auth)/sign-in", params })}
          />
        </>
      )}
    >
      {step === "form" ? (
        <>
          <GoogleButton
            loading={busy === "sso"}
            disabled={loading}
            onStart={() => { setError(null); setBusy("sso"); }}
            onSuccess={completeSignUp}
            onError={setError}
            onSettled={() => setBusy(null)}
          />
          <TextField
            testID="auth-email"
            label={t("auth_email")}
            icon="mail-outline"
            value={email}
            onChangeText={setEmail}
            placeholder={t("auth_email_ph")}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            textContentType="emailAddress"
            editable={!loading}
          />
          <TextField
            testID="auth-password"
            label={t("auth_password")}
            icon="lock-closed-outline"
            value={password}
            onChangeText={setPassword}
            placeholder={t("auth_password_ph")}
            secureTextEntry
            textContentType="newPassword"
            editable={!loading}
          />
          <Button
            testID="sign-up-submit"
            label={t("auth_sign_up")}
            loading={busy === "submit"}
            disabled={loading}
            onPress={() => void handleSubmit()}
          />
        </>
      ) : (
        <EmailVerifyStep
          code={code}
          onChangeCode={setCode}
          disabled={loading}
          verifying={busy === "submit"}
          resending={busy === "resend"}
          onVerify={() => void handleVerify()}
          onResend={() => void handleResend()}
        />
      )}
      <InlineError message={error} />
    </AuthShell>
  );
}

export default function SignUpScreen() {
  const { isConfigured } = useAppAuth();
  const { t } = useI18n();
  const router = useRouter();
  const goBack = () => (router.canGoBack() ? router.back() : router.replace("/(tabs)"));

  if (!isConfigured) {
    return (
      <AuthShell testID="sign-up-screen" title={t("auth_sign_up_title")} subtitle={t("auth_sign_up_sub")} onBack={goBack}>
        <InlineError message={t("auth_missing_key")} />
      </AuthShell>
    );
  }
  return <ConfiguredSignUp onBack={goBack} />;
}
