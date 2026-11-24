import { StyleSheet, View } from "react-native";
import { Chip, DataTable, Stat, StatRow, Text, type Column } from "@/components/ui";
import { humanize } from "@/domain/format";
import { isAcceptable, matchDoshas } from "@/domain/match";
import { useI18n } from "@/i18n/I18nProvider";
import { colors, font } from "@/theme";
import type { Koota, MatchResult } from "@/types/api";

type Row = Koota & { key: string };

export function MatchResultView({ m }: { m: MatchResult }) {
  const { t, T } = useI18n();
  const ok = isAcceptable(m);
  const doshas = matchDoshas(m);
  const name = (k: string) => (T(k) === k ? humanize(k) : T(k));
  const rows: Row[] = Object.entries(m.kootas).map(([key, v]) => ({ key, ...v }));
  const cols: Column<Row>[] = [
    { key: "k", label: t("koota"), flex: 1.3, render: (r) => <Text style={styles.b}>{name(r.key)}{r.simplified ? " *" : ""}</Text> },
    { key: "g", label: t("groom"), render: (r) => (r.groom ? T(r.groom) : "—") },
    { key: "b", label: t("bride"), render: (r) => (r.bride ? T(r.bride) : "—") },
    { key: "s", label: t("score"), flex: 0.7, render: (r) => `${r.score} / ${r.max}` },
  ];
  return (
    <View testID="match-result">
      <StatRow>
        <Stat label={t("guna_milan")}><Text style={styles.big} testID="match-total">{m.total}<Text style={styles.max}> / {m.max}</Text></Text></Stat>
        <Stat label={t("verdict")}><Chip tone={ok ? "good" : "bad"} label={t(ok ? "acceptable" : "below")} /></Stat>
        <Stat label={t("doshas")}>
          <View style={styles.chips}>{doshas.length ? doshas.map((d) => <Chip key={d} tone="bad" label={t(d)} />) : <Chip tone="good" label={t("none")} />}</View>
        </Stat>
        <Stat label={t("manglik_gb")} value={`${t(m.manglik.groom ? "yes" : "no")} / ${t(m.manglik.bride ? "yes" : "no")}`} />
      </StatRow>
      <DataTable columns={cols} rows={rows} rowKey={(r) => r.key} />
      <Text variant="small" style={styles.note}>* {t("simplified")} · {t("match_note")}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  b: { fontWeight: "600", fontSize: 14 },
  big: { fontSize: font.size.xxl, fontWeight: "700", color: colors.accent, lineHeight: 42 },
  max: { fontSize: 18, color: colors.muted, fontWeight: "400" },
  chips: { flexDirection: "row", flexWrap: "wrap" },
  note: { marginTop: 12 },
});
