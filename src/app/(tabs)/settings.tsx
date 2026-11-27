import { useState } from "react";
import { Platform, StyleSheet, View } from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import Constants from "expo-constants";
import { useRouter } from "expo-router";
import { queryKeys } from "@/api";
import { useAppAuth } from "@/auth/useAppAuth";
import {
  Button, Card, Chip, ErrorState, InlineError, Screen, SegmentedControl, Text, TextField,
  confirmAsync, useToast,
} from "@/components/ui";
import { env, normalizeBaseUrl } from "@/config/env";
import { useEngineHealth } from "@/hooks/useEngineHealth";
import { useI18n } from "@/i18n/I18nProvider";
import {
  cancelDailyHoroscopeNotification,
  formatReminderTime,
  isSameLocalDay,
  openNotificationSettings,
  scheduleDailyHoroscopeNotification,
  scheduleTestHoroscopeNotification,
  useNotificationPermission,
  type NotificationPermissionState,
} from "@/notifications/dailyHoroscope";
import type { Tone } from "@/domain/tone";
import { getEngineUrl, usePreferences } from "@/state/preferences";
import { spacing, useTheme } from "@/theme";
import type { ColorPreference } from "@/theme";
import type { Lang } from "@/types/api";
import { useQueryClient } from "@tanstack/react-query";

export default function SettingsScreen() {
  const { t, targetLang, setLang } = useI18n();
  const theme = useTheme();
  const toast = useToast();
  const qc = useQueryClient();
  const router = useRouter();
  const { isConfigured, isLoaded, isSignedIn, email, fullName, signOut } = useAppAuth();
  const [signingOut, setSigningOut] = useState(false);
  const colorScheme = usePreferences((s) => s.colorScheme);
  const setColorScheme = usePreferences((s) => s.setColorScheme);
  const chartStyle = usePreferences((s) => s.chartStyle);
  const setChartStyle = usePreferences((s) => s.setChartStyle);
  const notifEnabled = usePreferences((s) => s.dailyHoroscopeEnabled);
  const setNotifEnabled = usePreferences((s) => s.setDailyHoroscopeEnabled);
  const notifHour = usePreferences((s) => s.dailyHoroscopeHour);
  const notifMinute = usePreferences((s) => s.dailyHoroscopeMinute);
  const setNotifTime = usePreferences((s) => s.setDailyHoroscopeTime);
  const [notifError, setNotifError] = useState<string | null>(null);
  const [notifBusy, setNotifBusy] = useState(false);
  const [timePickerOpen, setTimePickerOpen] = useState(false);
  const notifPerm = useNotificationPermission(t("notif_daily_title"));
  const override = usePreferences((s) => s.engineUrlOverride);
  const setOverride = usePreferences((s) => s.setEngineUrlOverride);
  const [draft, setDraft] = useState(override ?? env.engineUrl);
  const [testing, setTesting] = useState(false);
  const url = normalizeBaseUrl(draft);
  const health = useEngineHealth(url ?? "", testing && !!url);
  const nativeTimePicker = Platform.OS === "ios" || Platform.OS === "android";

  const permTone: Record<NotificationPermissionState, Tone> = {
    granted: "good",
    denied: "bad",
    undetermined: "mixed",
    checking: "neutral",
    web: "neutral",
  };

  const permLabel = {
    granted: t("notif_status_enabled"),
    denied: t("notif_status_disabled"),
    undetermined: t("notif_status_not_set"),
    checking: t("loading"),
    web: t("notif_status_mobile_only"),
  }[notifPerm.state];

  const reminderPaused = notifEnabled && notifPerm.state === "denied";
  const reminderTone: Tone = reminderPaused ? "bad" : notifEnabled ? "good" : "neutral";
  const reminderLabel = reminderPaused
    ? t("notif_status_paused")
    : notifEnabled
      ? `${t("notif_status_enabled")} · ${formatReminderTime(notifHour, notifMinute)}`
      : t("notif_status_not_enabled");

  const scheduleAt = async (hour: number, minute: number) => {
    setNotifError(null);
    setNotifBusy(true);
    try {
      const res = await scheduleDailyHoroscopeNotification({
        hour,
        minute,
        title: t("notif_push_title"),
        body: t("notif_push_body"),
        channelName: t("notif_daily_title"),
      });
      await notifPerm.refresh();
      if (!res.ok) {
        setNotifEnabled(false);
        setNotifError(t(res.reason === "web" ? "notif_unsupported_web" : "notif_denied"));
        return false;
      }
      setNotifEnabled(true);
      const dayTag = res.nextTriggerAt
        ? ` (${isSameLocalDay(res.nextTriggerAt) ? t("notif_next_today") : t("notif_next_tomorrow")})`
        : "";
      toast(`${t("notif_saved")} ${formatReminderTime(hour, minute)}${dayTag}`);
      return true;
    } catch (err) {
      setNotifError(err instanceof Error ? err.message : t("err_unknown"));
      return false;
    } finally {
      setNotifBusy(false);
    }
  };

  const handleSendTest = async () => {
    setNotifError(null);
    setNotifBusy(true);
    try {
      const res = await scheduleTestHoroscopeNotification({
        title: t("notif_push_title"),
        body: t("notif_push_body"),
        channelName: t("notif_daily_title"),
      });
      await notifPerm.refresh();
      if (!res.ok) {
        setNotifError(t(res.reason === "web" ? "notif_unsupported_web" : "notif_denied"));
        return;
      }
      toast(t("notif_test_scheduled"));
    } catch (err) {
      setNotifError(err instanceof Error ? err.message : t("err_unknown"));
    } finally {
      setNotifBusy(false);
    }
  };

  const handleAllowPermission = async () => {
    setNotifError(null);
    setNotifBusy(true);
    try {
      const snap = await notifPerm.request();
      if (snap.state !== "granted") {
        setNotifError(t("notif_denied"));
        return;
      }
      if (notifEnabled) {
        await scheduleAt(notifHour, notifMinute);
      }
    } finally {
      setNotifBusy(false);
    }
  };

  const handleAllowExactAlarm = async () => {
    setNotifError(null);
    setNotifBusy(true);
    try {
      const exact = await notifPerm.requestExactAlarm();
      if (exact === "granted" && notifEnabled) {
        await scheduleAt(notifHour, notifMinute);
      }
    } finally {
      setNotifBusy(false);
    }
  };

  const exactAlarmTone: Tone =
    notifPerm.exactAlarm === "granted"
      ? "good"
      : notifPerm.exactAlarm === "denied"
        ? "mixed"
        : "neutral";

  const exactAlarmLabel =
    notifPerm.exactAlarm === "granted"
      ? t("notif_exact_allowed")
      : notifPerm.exactAlarm === "denied"
        ? t("notif_exact_restricted")
        : t("loading");

  const handleToggleNotif = async (enabled: boolean) => {
    if (!enabled) {
      setNotifError(null);
      setTimePickerOpen(false);
      setNotifEnabled(false);
      await cancelDailyHoroscopeNotification();
      toast(t("notif_cancelled"));
      return;
    }
    await scheduleAt(notifHour, notifMinute);
  };

  const handlePickTime = async (hour: number, minute: number) => {
    setNotifTime(hour, minute);
    await scheduleAt(hour, minute);
  };

  const pickerDate = new Date(2000, 0, 1, notifHour, notifMinute, 0);

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
      <Card icon="notifications-outline" title={t("notif_daily_title")}>
        <Text variant="small" style={styles.accountEmail}>{t("notif_daily_sub")}</Text>
        <View testID="settings-notif-status-section" style={styles.notifStatusBox}>
          <View style={styles.statusRow}>
            <Text variant="small" style={styles.flex}>{t("notif_perm_label")}</Text>
            <Chip testID="settings-notif-permission-status" tone={permTone[notifPerm.state]} label={permLabel} />
          </View>
          <View style={styles.statusRow}>
            <Text variant="small" style={styles.flex}>{t("notif_reminder_status")}</Text>
            <Chip testID="settings-horoscope-status" tone={reminderTone} label={reminderLabel} />
          </View>
          {notifPerm.exactAlarm !== "not_applicable" ? (
            <View style={styles.statusRow}>
              <Text variant="small" style={styles.flex}>{t("notif_exact_label")}</Text>
              <Chip testID="settings-notif-exact-alarm-status" tone={exactAlarmTone} label={exactAlarmLabel} />
            </View>
          ) : null}
          {notifPerm.state === "undetermined" || notifPerm.state === "denied" || notifPerm.exactAlarm === "denied" ? (
            <View style={styles.row}>
              {(notifPerm.state === "undetermined" || notifPerm.state === "denied") &&
                (notifPerm.canAskAgain ? (
                  <Button
                    testID="settings-notif-allow"
                    variant="secondary"
                    size="sm"
                    icon="notifications-outline"
                    label={t("notif_allow_btn")}
                    disabled={notifBusy}
                    onPress={() => void handleAllowPermission()}
                  />
                ) : (
                  <Button
                    testID="settings-notif-open-settings"
                    variant="secondary"
                    size="sm"
                    icon="settings-outline"
                    label={t("notif_open_settings_btn")}
                    disabled={notifBusy}
                    onPress={() => void openNotificationSettings()}
                  />
                ))}
              {notifPerm.exactAlarm === "denied" ? (
                <Button
                  testID="settings-notif-allow-exact"
                  variant="secondary"
                  size="sm"
                  icon="alarm-outline"
                  label={t("notif_allow_exact_btn")}
                  disabled={notifBusy}
                  onPress={() => void handleAllowExactAlarm()}
                />
              ) : null}
            </View>
          ) : null}
          {notifPerm.exactAlarm === "denied" ? (
            <Text variant="small">{t("notif_exact_hint")}</Text>
          ) : null}
        </View>
        <SegmentedControl<"off" | "on">
          testID="settings-horoscope-notif"
          value={notifEnabled ? "on" : "off"}
          onChange={(next) => {
            if (!notifBusy) void handleToggleNotif(next === "on");
          }}
          segments={[
            { value: "off", label: t("notif_off") },
            { value: "on", label: t("notif_on") },
          ]}
        />
        <View style={[styles.row, styles.notifTimeRow]}>
          <View style={styles.flex}>
            <Text variant="small">{t("notif_time")}</Text>
            <Text testID="settings-horoscope-time-label" weight="semibold">
              {formatReminderTime(notifHour, notifMinute)}
            </Text>
          </View>
          {nativeTimePicker ? (
            <Button
              testID="settings-horoscope-time"
              variant="secondary"
              size="sm"
              icon="time-outline"
              label={t("notif_change_time")}
              disabled={notifBusy}
              onPress={() => setTimePickerOpen((o) => !o)}
            />
          ) : null}
        </View>
        {nativeTimePicker && timePickerOpen ? (
          <DateTimePicker
            value={pickerDate}
            mode="time"
            is24Hour={false}
            display={Platform.OS === "ios" ? "spinner" : "clock"}
            themeVariant={theme.dark ? "dark" : "light"}
            accentColor={theme.colors.accent}
            onValueChange={(_e, d) => {
              setTimePickerOpen(Platform.OS === "ios");
              void handlePickTime(d.getHours(), d.getMinutes());
            }}
            onDismiss={() => setTimePickerOpen(false)}
          />
        ) : null}
        {nativeTimePicker && timePickerOpen && Platform.OS === "ios" ? (
          <Button variant="ghost" label="OK" onPress={() => setTimePickerOpen(false)} />
        ) : null}
        {Platform.OS !== "web" ? (
          <View style={styles.notifTestRow}>
            <Button
              testID="settings-notif-test"
              variant="secondary"
              size="sm"
              icon="paper-plane-outline"
              label={t("notif_test_btn")}
              disabled={notifBusy}
              onPress={() => void handleSendTest()}
            />
          </View>
        ) : null}
        <InlineError message={notifError} />
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
  row: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: spacing.sm },
  flex: { flex: 1 },
  notifStatusBox: { gap: spacing.xs, marginBottom: spacing.md },
  statusRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: spacing.sm },
  notifTimeRow: { marginTop: spacing.md },
  notifTestRow: { marginTop: spacing.sm, alignItems: "flex-start" },
  accountEmail: { marginBottom: spacing.sm },
  meta: { marginTop: spacing.md },
});
