import { useState } from "react";
import { Switch, View } from "react-native";
import { Button, Chip, EmptyState, InlineError, Section, Text, TextField } from "@/components/ui";
import { ASK_EXAMPLES, isValidQuestion, type AskHistoryItem } from "@/domain/ask";
import { verdictTone } from "@/domain/tone";
import { useAsk, useAskStatus } from "@/hooks/useAsk";
import { useI18n } from "@/i18n/I18nProvider";
import { makeStyles, spacing, useTheme } from "@/theme";
import type { AskResponse, Kundli } from "@/types/api";
import { FindingCard } from "./FindingCard";

export function AskTab({ kundli }: { kundli: Kundli }) {
  const styles = useStyles();
  const { colors } = useTheme();
  const { t, lang } = useI18n();
  const status = useAskStatus();
  const { history, ask, busy, clear } = useAsk(kundli, lang);
  const [q, setQ] = useState("");
  const [useAi, setUseAi] = useState(true);
  const aiOn = !!status.data?.ai;

  const send = async (text: string) => { await ask(text, aiOn && useAi); setQ(""); };

  return (
    <View testID="ask-tab">
      <Text variant="muted">{t("ask_intro")}</Text>
      <TextField testID="ask-input" value={q} onChangeText={setQ} placeholder={t("ask_placeholder")} multiline style={styles.input} />
      <View style={styles.row}>
        <Button testID="ask-send" label={busy ? t("ask_thinking") : t("ask_button")} onPress={() => void send(q)} disabled={!isValidQuestion(q)} loading={busy} />
        {aiOn && (
          <View style={styles.toggle}>
            <Switch value={useAi} onValueChange={setUseAi} trackColor={{ true: colors.accent }} accessibilityLabel={t("ask_use_ai")} />
            <Text variant="small">{t("ask_use_ai")}</Text>
          </View>
        )}
      </View>
      <Text variant="small" style={styles.status}>{status.data ? (aiOn ? `${t("ask_ai_on")} (${status.data.model})` : t("ask_ai_off")) : ""}</Text>
      <View style={styles.chips}>
        {(ASK_EXAMPLES[lang] ?? ASK_EXAMPLES.en).map((x) => <Chip key={x} tone="neutral" label={x} onPress={busy ? undefined : () => void send(x)} />)}
      </View>

      {history.length === 0 && !busy && <EmptyState message={t("ask_empty")} />}
      {history.map((it, i) => <HistoryItem key={it.at + i} item={it} />)}
      {history.length > 0 && <Button variant="ghost" label={t("ask_clear")} onPress={clear} />}
    </View>
  );
}

function HistoryItem({ item }: { item: AskHistoryItem }) {
  const styles = useStyles();
  return (
    <View style={styles.item} testID="ask-item">
      <Text variant="subheading">❓ {item.q}</Text>
      <InlineError message={item.error} />
      {item.response && <Answer r={item.response} />}
    </View>
  );
}

function Answer({ r }: { r: AskResponse }) {
  const styles = useStyles();
  const { t, T } = useI18n();
  return (
    <View>
      {r.mode === "ai" && r.ai_text ? (
        <FindingCard tone="accent" title={`${t("ask_ai_written")} · ${r.model ?? ""}`}><Text>{r.ai_text.replace(/\*\*/g, "")}</Text></FindingCard>
      ) : null}
      {r.ai_error ? <Text variant="small">⚠ {t("ask_ai_failed")}: {r.ai_error}</Text> : null}
      {r.sections.map((s, i) => (
        <FindingCard key={i} tone={verdictTone(s.verdict)} title={s.title}>
          {s.paras.map((p, j) => <Text key={j}>{p}</Text>)}
        </FindingCard>
      ))}
      {r.remedies.length > 0 && (
        <Section title={t("ask_remedies")}>
          {r.remedies.map((x) => (
            <FindingCard key={x.planet} tone="mixed" title={T(x.planet)}>
              <Text variant="muted">{x.approach}</Text>
              {x.steps.map((s, j) => <Text key={j}>{j + 1}. {s}</Text>)}
            </FindingCard>
          ))}
        </Section>
      )}
      {r.refs.length > 0 && (
        <Section title={t("ask_books")}>
          {r.refs.map((x, i) => (
            <Text key={i} style={styles.ref}><Text style={styles.bold}>{x.title}</Text>, {x.page_label}{x.why ? ` – ${x.why}` : ""}</Text>
          ))}
        </Section>
      )}
      <Text variant="small">{r.note}</Text>
    </View>
  );
}

const useStyles = makeStyles((t) => ({
  input: { minHeight: 80 },
  row: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  toggle: { flexDirection: "row", alignItems: "center", gap: 6 },
  status: { marginVertical: spacing.sm },
  chips: { flexDirection: "row", flexWrap: "wrap" },
  item: { borderTopWidth: 1, borderTopColor: t.colors.line, paddingTop: spacing.md, marginTop: spacing.md },
  ref: { marginBottom: 6, fontSize: 14 },
  bold: { fontWeight: "600" },
}));
