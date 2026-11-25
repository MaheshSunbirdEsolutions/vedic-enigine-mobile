/**
 * Reports tab: all 12 reports of the web app, chosen from a scrollable category strip.
 * The year applies to year-based reports; Print and Download PDF actions appear for the active
 * sub-tab once its data finishes loading.
 */
import { useState } from "react";
import { View } from "react-native";
import {
  BhriguReport, DoshaReport, FullReport, IssuesReport, LalKitabReport, LifeAreasReport, LifelongReport,
  NakshatraReport, TirthaReport, VarshphalReport, YearlyReport,
} from "@/components/reports/ReportViews";
import type { Json } from "@/components/reports/parts";
import { Button, FadeSwitch, IconButton, InlineError, QueryView, SegmentedControl, SkeletonCards, Text } from "@/components/ui";
import type { ReportId } from "@/api";
import { useBookStatus, useChartBundle, useReport, useSimpleReport } from "@/hooks/useAstro";
import { useReportExport } from "@/hooks/useReportExport";
import { useI18n } from "@/i18n/I18nProvider";
import { makeStyles, radius, spacing } from "@/theme";
import type { Kundli } from "@/types/api";
import { SimpleReportView } from "./SimpleReportView";

/** Same order and labels as the web app. "wrong" and "full" share one engine report. */
export const REPORTS = [
  { key: "simple", ep: "simple", label: "rep_simple" },
  { key: "lifepred", ep: "lifelong", label: "rep_life_pred" },
  { key: "yearpred", ep: "yearly", label: "rep_year_pred" },
  { key: "issues", ep: "issues", label: "rep_issues" },
  { key: "wrong", ep: "full", label: "rep_wrong" },
  { key: "full", ep: "full", label: "rep_full" },
  { key: "life", ep: "life-areas", label: "rep_life" },
  { key: "varsh", ep: "varshphal", label: "rep_varsh" },
  { key: "lk", ep: "lal-kitab", label: "rep_lk" },
  { key: "nak", ep: "nakshatra", label: "rep_nakshatra" },
  { key: "tirtha", ep: "tirtha", label: "rep_tirtha" },
  { key: "bhrigu", ep: "bhrigu", label: "rep_bhrigu" },
] as const;
export type ReportKey = (typeof REPORTS)[number]["key"];

const YEAR_REPORTS: ReportKey[] = ["yearpred", "varsh"];

export function ReportsTab({ kundli }: { kundli: Kundli }) {
  const { t, T, lang } = useI18n();
  const s = useStyles();
  const [rep, setRep] = useState<ReportKey>("simple");
  const [year, setYear] = useState(() => new Date().getFullYear());
  const cur = REPORTS.find((r) => r.key === rep)!;
  const isSimple = rep === "simple";
  const simple = useSimpleReport(kundli, lang, isSimple);
  const detailed = useReport<Json>(cur.ep as ReportId, kundli, lang, year, !isSimple);
  const books = useBookStatus().data ?? { lalkitab: 0, bhrigu: 0 };
  const chart = useChartBundle(kundli).data?.chart;

  const activeQuery = isSimple ? simple : detailed;
  const isSubTabAvailable =
    activeQuery.isSuccess && !activeQuery.isPending && !activeQuery.isError && !activeQuery.isPlaceholderData && !!activeQuery.data;
  const subTabKey = `${rep}:${year}:${lang}`;
  const { busyAction, exportError, printReport, downloadPdf } = useReportExport(subTabKey);

  const exportInput = {
    key: rep,
    title: t(cur.label),
    kundli,
    data: activeQuery.data,
    chart,
    year,
  };

  return (
    <View testID="reports-tab">
      <SegmentedControl<ReportKey> scroll testID="report" value={rep} onChange={setRep}
        segments={REPORTS.map((r) => ({ value: r.key, label: t(r.label) }))} />

      {(YEAR_REPORTS.includes(rep) || isSubTabAvailable) && (
        <View style={s.tools}>
          {YEAR_REPORTS.includes(rep) ? (
            <View style={s.year} accessibilityLabel={t("year")}>
              <IconButton icon="chevron-back" size={34} label={`${t("year")} ${year - 1}`} onPress={() => setYear((y) => y - 1)} testID="year-prev" />
              <Text weight="semibold" style={s.yearText}>{year}</Text>
              <IconButton icon="chevron-forward" size={34} label={`${t("year")} ${year + 1}`} onPress={() => setYear((y) => y + 1)} testID="year-next" />
            </View>
          ) : <View style={s.flex} />}
          {isSubTabAvailable && (
            <View style={s.exportRow} testID={`report-export-${rep}`}>
              <Button size="sm" variant="secondary" icon="print-outline" label={t("report_print")}
                loading={busyAction === "print"} disabled={busyAction !== null}
                onPress={() => void printReport(exportInput)} testID={`report-print-${rep}`} />
              <Button size="sm" variant="secondary" icon="download-outline" label={t("report_download_pdf")}
                loading={busyAction === "pdf"} disabled={busyAction !== null}
                onPress={() => void downloadPdf(exportInput)} testID={`report-download-${rep}`} />
            </View>
          )}
        </View>
      )}
      <InlineError message={exportError} />

      <Text variant="title" style={s.title}>{t(cur.label)}{rep === "varsh" && detailed.data?.year ? ` ${detailed.data.year}` : ""}</Text>
      {chart ? (
        <Text variant="small" style={s.meta}>
          {kundli.name} · {t("lagna")}: {T(chart.lagna.sign)} · {t("moon_sign")}: {T(chart.planets.Moon.sign)} · {t("nakshatra")}: {T(chart.planets.Moon.nakshatra.name)}
        </Text>
      ) : null}

      <FadeSwitch id={rep}>
        {isSimple ? (
          <QueryView query={simple} skeleton={<SkeletonCards count={4} />}>{(r) => <SimpleReportView report={r} />}</QueryView>
        ) : (
          <QueryView query={detailed} skeleton={<SkeletonCards count={4} lines={4} />}>
            {(r) => (
              <View>
                {rep === "lifepred" && <LifelongReport r={r} />}
                {rep === "yearpred" && <YearlyReport r={r} onYear={setYear} />}
                {rep === "issues" && <IssuesReport r={r} />}
                {rep === "wrong" && <DoshaReport r={r} />}
                {rep === "full" && <FullReport r={r} />}
                {rep === "life" && <LifeAreasReport r={r} />}
                {rep === "varsh" && <VarshphalReport r={r} books={books} />}
                {rep === "lk" && <LalKitabReport r={r} books={books} />}
                {rep === "nak" && <NakshatraReport r={r} />}
                {rep === "tirtha" && <TirthaReport r={r} />}
                {rep === "bhrigu" && <BhriguReport r={r} books={books} />}
              </View>
            )}
          </QueryView>
        )}
      </FadeSwitch>
    </View>
  );
}

const useStyles = makeStyles((t) => ({
  tools: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: spacing.sm, marginBottom: spacing.md },
  year: { flexDirection: "row", alignItems: "center", gap: spacing.sm, backgroundColor: t.colors.fill, borderRadius: radius.pill, padding: 3 },
  yearText: { minWidth: 44, textAlign: "center", fontSize: 15 },
  exportRow: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: spacing.xs },
  flex: { flex: 1 },
  title: { marginTop: spacing.xs },
  meta: { marginBottom: spacing.md },
}));
