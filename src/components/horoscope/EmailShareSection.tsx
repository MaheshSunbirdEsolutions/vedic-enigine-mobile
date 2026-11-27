/**
 * Share daily horoscope via SMTP email (status check, preview, and send).
 * Port of web/components/EmailShareButton.tsx.
 */
import { useState } from "react";
import { View } from "react-native";
import { useMutation } from "@tanstack/react-query";
import { engineApi, errorMessageKey } from "@/api";
import { Button, Card, Chip, InlineError, Text, TextField } from "@/components/ui";
import { birthOf } from "@/domain/birth";
import { useEmailStatus } from "@/hooks/useAstro";
import { useI18n } from "@/i18n/I18nProvider";
import { makeStyles, radius, spacing } from "@/theme";
import type { EmailHoroscopeRequest, EmailPreviewResponse, EmailStatus, Kundli } from "@/types/api";

type Props = {
  kind: "rashi" | "kundli";
  sign?: string;
  kundli?: Kundli;
  tz: string;
  lat: number;
  lon: number;
  day: string;
};

export function EmailShareSection({ kind, sign = "Aries", kundli, tz, lat, lon, day }: Props) {
  const s = useStyles();
  const { t, T, lang } = useI18n();
  const [open, setOpen] = useState(false);
  const [toEmail, setToEmail] = useState("");
  const [validationErr, setValidationErr] = useState<string | null>(null);
  const [sentMsg, setSentMsg] = useState<string | null>(null);
  const [preview, setPreview] = useState<EmailPreviewResponse | null>(null);
  const [latestStatus, setLatestStatus] = useState<EmailStatus | null>(null);

  const statusQuery = useEmailStatus(open);
  const st = latestStatus ?? statusQuery.data ?? null;

  const basePayload = (): EmailHoroscopeRequest => ({
    to_email: toEmail.trim(),
    kind,
    sign,
    kundli_id: kundli?.id || "",
    name: kundli?.name || "",
    ...(kundli ? birthOf(kundli) : { tz, lat, lon }),
    lang,
    day,
  });

  const sendMut = useMutation({
    mutationFn: () => engineApi.email.sendHoroscope(basePayload()),
    onSuccess: (r) => {
      if (r.status) setLatestStatus(r.status);
      setSentMsg(`✓ ${t("email_sent_ok")} ${(r.to || []).join(", ")}`);
    },
  });

  const previewMut = useMutation({
    mutationFn: () => engineApi.email.previewHoroscope(basePayload()),
    onSuccess: (r) => setPreview(r),
  });

  const busy = sendMut.isPending || previewMut.isPending;

  const onSend = () => {
    setSentMsg(null);
    if (!toEmail.trim()) {
      setValidationErr(t("email_need_to"));
      return;
    }
    setValidationErr(null);
    sendMut.mutate();
  };

  const onTogglePreview = () => {
    setValidationErr(null);
    if (preview) {
      setPreview(null);
      return;
    }
    previewMut.mutate();
  };

  const activeErr = validationErr
    ?? (sendMut.error ? t(errorMessageKey(sendMut.error)) : null)
    ?? (previewMut.error ? t(errorMessageKey(previewMut.error)) : null);

  return (
    <View style={s.wrap}>
      <View style={s.triggerRow}>
        <Button
          testID="email-share-toggle"
          size="sm"
          variant="secondary"
          icon="mail-outline"
          label={t("email_share_btn")}
          onPress={() => setOpen((x) => !x)}
        />
        {open && st ? (
          <Chip
            tone={st.configured ? "good" : "mixed"}
            label={st.configured ? `${t("email_smtp_ready")} (${st.host})` : t("email_smtp_missing")}
          />
        ) : null}
      </View>

      {open && (
        <Card tone="mixed" style={s.panel} testID="email-share-panel">
          <Text variant="subheading">{t("email_title")}</Text>
          <Text variant="small" style={s.meta}>
            {kind === "rashi" ? T(sign) : (kundli?.name || t("by_kundli"))} · {day}
          </Text>

          <TextField
            testID="email-to-input"
            label={t("email_to")}
            value={toEmail}
            onChangeText={(v) => {
              setToEmail(v);
              setValidationErr(null);
            }}
            placeholder={t("email_to_ph")}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />

          <View style={s.btnRow}>
            <Button
              testID="email-send-btn"
              size="sm"
              icon="send-outline"
              label={sendMut.isPending ? t("email_sending") : t("email_send")}
              loading={sendMut.isPending}
              disabled={busy}
              onPress={onSend}
            />
            <Button
              testID="email-preview-btn"
              size="sm"
              variant="ghost"
              icon={preview ? "eye-off-outline" : "eye-outline"}
              label={t("email_preview")}
              loading={previewMut.isPending}
              disabled={busy}
              onPress={onTogglePreview}
            />
          </View>

          {st && !st.configured ? <Text variant="small" style={s.hint}>{t("email_env_hint")}</Text> : null}
          <InlineError message={activeErr} />
          {sentMsg ? <Text weight="semibold" style={s.sentMsg}>{sentMsg}</Text> : null}

          {preview && (
            <View style={s.previewBox} testID="email-preview-box">
              <Text variant="small" style={s.previewSubject}>
                <Text weight="semibold">Subject: </Text>{preview.subject}
              </Text>
              <Text variant="small" style={s.previewBody}>{preview.text}</Text>
            </View>
          )}
        </Card>
      )}
    </View>
  );
}

const useStyles = makeStyles((t) => ({
  wrap: { marginBottom: spacing.md },
  triggerRow: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: spacing.sm },
  panel: { marginTop: spacing.sm, paddingLeft: spacing.lg + 2 },
  meta: { marginTop: 2, marginBottom: spacing.sm },
  btnRow: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: spacing.sm },
  hint: { marginTop: spacing.sm },
  sentMsg: { color: t.colors.good, marginTop: spacing.sm },
  previewBox: {
    marginTop: spacing.md,
    padding: spacing.md,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: t.colors.line,
    backgroundColor: t.colors.bg,
    gap: 6,
  },
  previewSubject: { marginBottom: 2 },
  previewBody: { lineHeight: 19 },
}));
