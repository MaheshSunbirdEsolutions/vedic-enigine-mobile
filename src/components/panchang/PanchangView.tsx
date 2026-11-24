import { StyleSheet, View } from "react-native";
import { DataTable, Stat, StatRow, Text, type Column } from "@/components/ui";
import { formatTime } from "@/domain/format";
import { useI18n } from "@/i18n/I18nProvider";
import type { Panchang } from "@/types/api";

type Limb = { key: string; value: string; ends: string };

export function PanchangView({ p }: { p: Panchang }) {
  const { t, T, lang } = useI18n();
  const tm = (s: string) => formatTime(s, p.date, lang);
  const rows: Limb[] = [
    { key: t("tithi"), value: `${T(p.tithi.paksha)} ${T(p.tithi.name)} (${p.tithi.number})`, ends: tm(p.tithi.ends) },
    { key: t("nakshatra"), value: T(p.nakshatra.name), ends: tm(p.nakshatra.ends) },
    { key: t("yoga"), value: T(p.yoga.name), ends: tm(p.yoga.ends) },
    { key: t("karana"), value: T(p.karana.name), ends: tm(p.karana.ends) },
  ];
  const cols: Column<Limb>[] = [
    { key: "l", label: t("limb"), render: (r) => r.key },
    { key: "v", label: t("at_sunrise"), flex: 1.6, render: (r) => <Text style={styles.b}>{r.value}</Text> },
    { key: "e", label: t("ends"), render: (r) => r.ends },
  ];
  return (
    <View testID="panchang-view">
      <StatRow>
        <Stat label={t("sunrise")} value={tm(p.sunrise)} />
        <Stat label={t("sunset")} value={tm(p.sunset)} />
        <Stat label={t("vara")} value={T(p.vara)} />
        <Stat label={t("rahu_kaal")} value={`${tm(p.rahu_kaal.start)}–${tm(p.rahu_kaal.end)}`} />
      </StatRow>
      <DataTable columns={cols} rows={rows} rowKey={(r) => r.key} />
      <Text variant="small" style={styles.note}>{t("panchang_note")} {p.tz}.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  b: { fontWeight: "600", fontSize: 14 },
  note: { marginTop: 12 },
});
