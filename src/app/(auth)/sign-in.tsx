import { useEffect, useRef, useState } from "react";
import { useSignIn } from "@clerk/expo";
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
import { makeStyles, spacing } from "@/theme";

type Mode = "password" | "code-request" | "verify";
type VerifySource = "email_code" | "mfa";

function ConfiguredSignIn({ onBack }: { onBack: () => void }) {
  const s = useStyles();
  const { t } = useI18n();
  const router = useRouter();
  const params = useLocalSearchParams<AuthRouteParams>();
  const queryClient = useQueryClient();
  const { isSignedIn } = useAppAuth();
  const { signIn, fetchStatus } = useSignIn();

  const [mode, setMode] = useState<Mode>("password");
  const [verifySource, setVerifySource] = useState<VerifySource>("email_code");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<"submit" | "sso" | "resend" | null>(null);
  const completedRef = useRef(false);

  const completeSignIn = async () => {
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

  const cleanEmail = email.trim();
  const loading = busy !== null || fetchStatus === "fetching";

  const handlePasswordSubmit = async () => {
    if (!cleanEmail.includes("@")) return setError(t("auth_err_email"));
    if (!password) return setError(t("auth_err_password"));
    if (!signIn) return;
    setError(null);
    setBusy("submit");
    try {
      const res = await signIn.password({ emailAddress: cleanEmail, password });
      if (res.error) {
        setError(formatClerkError(res.error, t("auth_failed")));
        return;
      }
      if (signIn.status === "complete") {
        const fin = await signIn.finalize();
        if (fin.error) return setError(formatClerkError(fin.error, t("auth_failed")));
        await completeSignIn();
        return;
      }
      if (signIn.status === "needs_second_factor" || signIn.status === "needs_client_trust") {
        const sent = await signIn.mfa.sendEmailCode();
        if (sent.error) return setError(formatClerkError(sent.error, t("auth_failed")));
        setVerifySource("mfa");
        setMode("verify");
        return;
      }
      if (signIn.status === "needs_first_factor") {
        const sent = await signIn.emailCode.sendCode({ emailAddress: cleanEmail });
        if (sent.error) return setError(formatClerkError(sent.error, t("auth_failed")));
        setVerifySource("email_code");
        setMode("verify");
        return;
      }
      setError(t("auth_failed"));
    } finally {
      setBusy(null);
    }
  };

  const handleSendEmailCode = async () => {
    if (!cleanEmail.includes("@")) return setError(t("auth_err_email"));
    if (!signIn) return;
    setError(null);
    setBusy("submit");
    try {
      const res = await signIn.emailCode.sendCode({ emailAddress: cleanEmail });
      if (res.error) return setError(formatClerkError(res.error, t("auth_failed")));
      setVerifySource("email_code");
      setMode("verify");
    } finally {
      setBusy(null);
    }
  };

  const handleVerifyCode = async () => {
    const cleanCode = code.trim();
    if (!cleanCode) return setError(t("auth_err_code"));
    if (!signIn) return;
    setError(null);
    setBusy("submit");
    try {
      const res = verifySource === "mfa"
        ? await signIn.mfa.verifyEmailCode({ code: cleanCode })
        : await signIn.emailCode.verifyCode({ code: cleanCode });
      if (res.error) return setError(formatClerkError(res.error, t("auth_failed")));

      if (signIn.status === "complete") {
        const fin = await signIn.finalize();
        if (fin.error) return setError(formatClerkError(fin.error, t("auth_failed")));
        await completeSignIn();
        return;
      }
      if (signIn.status === "needs_second_factor" || signIn.status === "needs_client_trust") {
        const sent = await signIn.mfa.sendEmailCode();
        if (sent.error) return setError(formatClerkError(sent.error, t("auth_failed")));
        setVerifySource("mfa");
        setCode("");
        return;
      }
      setError(t("auth_failed"));
    } finally {
      setBusy(null);
    }
  };

  const handleResend = async () => {
    if (!signIn) return;
    setError(null);
    setBusy("resend");
    try {
      const res = verifySource === "mfa"
        ? await signIn.mfa.sendEmailCode()
        : await signIn.emailCode.sendCode({ emailAddress: cleanEmail });
      if (res.error) setError(formatClerkError(res.error, t("auth_failed")));
    } finally {
      setBusy(null);
    }
  };

  const title = mode === "verify" ? t("auth_verify_title") : t("auth_sign_in_title");
  const subtitle = mode === "verify" ? t("auth_verify_sub") : t("auth_sign_in_sub");

  return (
    <AuthShell
      testID="sign-in-screen"
      title={title}
      subtitle={subtitle}
      onBack={mode === "verify" ? () => { setMode("password"); setCode(""); setError(null); } : onBack}
      footer={(
        <>
          <Text variant="small">{t("auth_no_account")}</Text>
          <Button
            testID="go-to-sign-up"
            variant="ghost"
            size="sm"
            label={t("auth_sign_up")}
            onPress={() => router.replace({ pathname: "/(auth)/sign-up", params })}
          />
        </>
      )}
    >
      {mode !== "verify" ? (
        <>
          <GoogleButton
            loading={busy === "sso"}
            disabled={loading}
            onStart={() => { setError(null); setBusy("sso"); }}
            onSuccess={completeSignIn}
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
          {mode === "password" ? (
            <>
              <TextField
                testID="auth-password"
                label={t("auth_password")}
                icon="lock-closed-outline"
                value={password}
                onChangeText={setPassword}
                placeholder={t("auth_password_ph")}
                secureTextEntry
                textContentType="password"
                editable={!loading}
              />
              <Button
                testID="sign-in-submit"
                label={t("auth_sign_in")}
                loading={busy === "submit"}
                disabled={loading}
                onPress={() => void handlePasswordSubmit()}
              />
              <Button
                testID="switch-to-email-code"
                variant="ghost"
                size="sm"
                style={s.altBtn}
                label={t("auth_use_code")}
                disabled={loading}
                onPress={() => { setError(null); setMode("code-request"); }}
              />
            </>
          ) : (
            <>
              <Button
                testID="email-code-send"
                label={t("auth_verify_btn")}
                loading={busy === "submit"}
                disabled={loading}
                onPress={() => void handleSendEmailCode()}
              />
              <Button
                testID="switch-to-password"
                variant="ghost"
                size="sm"
                style={s.altBtn}
                label={t("auth_use_password")}
                disabled={loading}
                onPress={() => { setError(null); setMode("password"); }}
              />
            </>
          )}
        </>
      ) : (
        <EmailVerifyStep
          code={code}
          onChangeCode={setCode}
          disabled={loading}
          verifying={busy === "submit"}
          resending={busy === "resend"}
          onVerify={() => void handleVerifyCode()}
          onResend={() => void handleResend()}
        />
      )}
      <InlineError message={error} />
    </AuthShell>
  );
}

export default function SignInScreen() {
  const { isConfigured } = useAppAuth();
  const { t } = useI18n();
  const router = useRouter();
  const goBack = () => (router.canGoBack() ? router.back() : router.replace("/(tabs)"));

  if (!isConfigured) {
    return (
      <AuthShell testID="sign-in-screen" title={t("auth_sign_in_title")} subtitle={t("auth_sign_in_sub")} onBack={goBack}>
        <InlineError message={t("auth_missing_key")} />
      </AuthShell>
    );
  }
  return <ConfiguredSignIn onBack={goBack} />;
}

const useStyles = makeStyles(() => ({
  altBtn: { marginTop: spacing.sm },
}));
