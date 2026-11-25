import { useMemo } from "react";
import { View } from "react-native";
import { KundliChart } from "@/components/kundli/KundliChart";
import { Card, Chip, DataTable, SegmentedControl, Section, Stat, StatRow, Text, type Column } from "@/components/ui";
import { labelsBySign, placementsFor, retrogrades } from "@/domain/chart";
import { dignityTone } from "@/domain/tone";
import { useI18n } from "@/i18n/I18nProvider";
import { usePreferences } from "@/state/preferences";
import { makeStyles, spacing } from "@/theme";
import type { Chart, HouseRow, PlanetPos } from "@/types/api";

type PlanetRow = { name: string; p: PlanetPos; retro: boolean };

export function ChartTab({ chart }: { chart: Chart }) {
  const styles = useStyles();
  const { t, T, abbr, lang } = useI18n();
  const style = usePreferences((s) => s.chartStyle);
  const setStyle = usePreferences((s) => s.setChartStyle);
  const retro = useMemo(() => retrogrades(chart), [chart]);
  const mark = lang === "en" ? "ᴿ" : "(व)";
  const d1 = placementsFor(chart, "D1"), d9 = placementsFor(chart, "D9");
  const moon = chart.planets.Moon;
  const ds = chart.doshas;
  const rows: PlanetRow[] = Object.entries(chart.planets).map(([name, p]) => ({ name, p, retro: retro[name] }));

  const planetCols: Column<PlanetRow>[] = [
    { key: "g", label: t("graha"), width: 92, render: (r) => <Text style={styles.b}>{T(r.name)}{r.retro ? ` ${mark}` : ""}</Text> },
    {
      key: "s",
      label: t("sign"),
      width: 112,
      render: (r) => (
        <View>
          <Text style={styles.cellText}>{T(r.p.sign)}</Text>
          <Text variant="small">{r.p.degree_in_sign}</Text>
        </View>
      ),
    },
    { key: "n", label: t("nakshatra"), width: 150, render: (r) => `${T(r.p.nakshatra.name)} (${r.p.nakshatra.pada})` },
    { key: "h", label: t("house"), width: 64, render: (r) => String(r.p.house) },
    { key: "d", label: t("dignity"), width: 124, render: (r) => r.p.dignity === "n/a" ? "—" : <Chip tone={dignityTone(r.p.dignity)} label={T(r.p.dignity)} /> },
  ];
  const houseCols: Column<HouseRow>[] = [
    { key: "h", label: t("house"), width: 64, render: (h) => String(h.house) },
    { key: "s", label: t("sign"), width: 108, render: (h) => T(h.sign) },
    { key: "l", label: t("lord"), width: 92, render: (h) => T(h.lord) },
    { key: "o", label: t("occupants"), width: 140, render: (h) => h.planets.map(T).join(", ") || "—" },
  ];

  return (
    <View testID="chart-tab">
      <StatRow>
        <Stat label={t("lagna")} value={`${T(chart.lagna.sign)} ${chart.lagna.degree_in_sign}`} />
        <Stat label={t("moon_sign")} value={T(moon.sign)} />
        <Stat label={t("nakshatra")} value={`${T(moon.nakshatra.name)} · ${t("pada")} ${moon.nakshatra.pada}`} />
        <Stat label={`${t("ayanamsa")} (${chart.ayanamsa.name})`} value={chart.ayanamsa.dms} />
        <Stat label={t("doshas")}>
          <View style={styles.chips}>
            {ds.manglik.present && <Chip tone="bad" label={t("manglik")} />}
            {ds.kaal_sarp.present && <Chip tone="bad" label={t("kaal_sarp")} />}
            {!ds.manglik.present && !ds.kaal_sarp.present && <Chip tone="good" label={t("none")} />}
          </View>
        </Stat>
      </StatRow>
      <SegmentedControl testID="chart-style" value={style} onChange={setStyle}
        segments={[{ value: "north", label: t("north") }, { value: "south", label: t("south") }]} />
      {(["D1", "D9"] as const).map((v) => {
        const pl = v === "D1" ? d1 : d9;
        return (
          <Card key={v} title={t(v.toLowerCase())}>
            <KundliChart testID={`chart-${v}`} variant={style} lagna={pl.lagna} ascLabel={t("asc")} centreLabel={t("rashi")}
              signLabel={(s) => (lang === "en" ? s.slice(0, 3) : T(s))}
              bySign={labelsBySign(pl.planets, abbr, v === "D1" ? retro : {}, mark)} />
          </Card>
        );
      })}
      <Section title={t("positions")}>
        <DataTable scroll columns={planetCols} rows={rows} rowKey={(r) => r.name} />
      </Section>
      <Section title={t("houses_title")}>
        <DataTable scroll columns={houseCols} rows={chart.houses} rowKey={(h) => String(h.house)} />
      </Section>
    </View>
  );
}

const useStyles = makeStyles((t) => ({
  b: { fontFamily: t.fonts.semibold, fontSize: 14 },
  cellText: { fontSize: 14 },
  chips: { flexDirection: "row", flexWrap: "wrap", marginTop: spacing.xs },
}));
