import { useState } from "react";
import { StyleSheet, View } from "react-native";
import Constants from "expo-constants";
import { useRouter } from "expo-router";
import { queryKeys } from "@/api";
import { useAppAuth } from "@/auth/useAppAuth";
import { Button, Card, Chip, ErrorState, Screen, SegmentedControl, Text, TextField, confirmAsync } from "@/components/ui";
import { env, normalizeBaseUrl } from "@/config/env";
import { useEngineHealth } from "@/hooks/useEngineHealth";
import { useI18n } from "@/i18n/I18nProvider";
import { getEngineUrl, usePreferences } from "@/state/preferences";
import { spacing } from "@/theme";
import type { ColorPreference } from "@/theme";
import type { Lang } from "@/types/api";
import { useQueryClient } from "@tanstack/react-query";

export default function SettingsScreen() {
  const { t, targetLang, setLang } = useI18n();
  const qc = useQueryClient();
  const router = useRouter();
  const { isConfigured, isLoaded, isSignedIn, email, fullName, signOut } = useAppAuth();
  const [signingOut, setSigningOut] = useState(false);
  const colorScheme = usePreferences((s) => s.colorScheme);
  const setColorScheme = usePreferences((s) => s.setColorScheme);
  const chartStyle = usePreferences((s) => s.chartStyle);
  const setChartStyle = usePreferences((s) => s.setChartStyle);
  const override = usePreferences((s) => s.engineUrlOverride);
  const setOverride = usePreferences((s) => s.setEngineUrlOverride);
  const [draft, setDraft] = useState(override ?? env.engineUrl);
  const [testing, setTesting] = useState(false);
  const url = normalizeBaseUrl(draft);
  const health = useEngineHealth(url ?? "", testing && !!url);

  const save = (value: string | null) => {
    setOverride(value);
    setDraft(value ?? env.engineUrl);
    setTesting(false);
    void qc.invalidateQueries(); // everything came from the previous engine
  };

  const handleSignOut = async () => {
    if (!(await confirmAsync(t("auth_confirm_sign_out"), t("auth_sign_out"), t("cancel")))) return;
    setSigningOut(true);
    try {
      await signOut();
      qc.removeQueries({ queryKey: queryKeys.kundlis.all });
      qc.removeQueries({ queryKey: queryKeys.me });
    } finally {
      setSigningOut(false);
    }
  };

  return (
    <Screen testID="settings-screen">
      <Card icon="person-circle-outline" title={t("auth_account")}>
        {!isConfigured ? (
          <Text variant="small">{t("auth_missing_key")}</Text>
        ) : !isLoaded ? (
          <Text variant="muted">{t("loading")}</Text>
        ) : isSignedIn ? (
          <View>
            {fullName ? <Text weight="semibold">{fullName}</Text> : null}
            <Text variant="muted" style={styles.accountEmail}>{email ?? t("auth_signed_in_as")}</Text>
            <View style={styles.row}>
              <Button
                testID="settings-sign-out"
                variant="danger"
                icon="log-out-outline"
                label={t("auth_sign_out")}
                loading={signingOut}
                onPress={() => void handleSignOut()}
              />
            </View>
          </View>
        ) : (
          <View>
            <Text variant="muted" style={styles.accountEmail}>{t("auth_guest")}</Text>
            <View style={styles.row}>
              <Button testID="settings-sign-in" icon="log-in-outline" label={t("auth_sign_in")} onPress={() => router.push("/(auth)/sign-in")} />
              <Button testID="settings-sign-up" variant="secondary" label={t("auth_sign_up")} onPress={() => router.push("/(auth)/sign-up")} />
            </View>
          </View>
        )}
      </Card>
      <Card icon="language-outline" title={t("settings_language")}>
        <SegmentedControl<Lang> testID="lang" value={targetLang} onChange={setLang}
          segments={[{ value: "en", label: "English" }, { value: "hi", label: "हिन्दी" }]} />
      </Card>
      <Card icon="contrast-outline" title={t("settings_appearance")}>
        <SegmentedControl<ColorPreference> testID="appearance" value={colorScheme} onChange={setColorScheme}
          segments={[{ value: "system", label: t("appearance_system") }, { value: "light", label: t("appearance_light") }, { value: "dark", label: t("appearance_dark") }]} />
      </Card>
      <Card icon="grid-outline" title={t("settings_chart_style")}>
        <SegmentedControl value={chartStyle} onChange={setChartStyle}
          segments={[{ value: "north", label: t("north") }, { value: "south", label: t("south") }]} />
      </Card>
      <Card icon="server-outline" title={t("settings_engine")}>
        <Text variant="small">{t("settings_engine_default")}: {env.engineUrl}</Text>
        <TextField testID="engine-url" label={t("settings_engine_url")} value={draft} onChangeText={(s) => { setDraft(s); setTesting(false); }}
          autoCapitalize="none" autoCorrect={false} keyboardType="url" error={url ? null : t("settings_engine_invalid")} />
        <View style={styles.row}>
          <Button variant="secondary" label={t("settings_test")} onPress={() => setTesting(true)} disabled={!url} loading={health.isFetching} />
          <Button label={t("settings_engine_save")} onPress={() => url && save(url === env.engineUrl ? null : url)} disabled={!url} />
          {override && <Button variant="ghost" label={t("settings_engine_reset")} onPress={() => save(null)} />}
        </View>
        {testing && health.isSuccess && <Chip tone="good" label={t("settings_ok")} />}
        {testing && health.isError && <ErrorState error={health.error} />}
        <Text variant="small" style={styles.meta}>
          {t("settings_env")}: {env.appEnv} · {t("settings_version")}: {Constants.expoConfig?.version ?? "—"} · {getEngineUrl()}
        </Text>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  accountEmail: { marginBottom: spacing.sm },
  meta: { marginTop: spacing.md },
});
