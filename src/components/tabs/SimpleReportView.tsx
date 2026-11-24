import { View } from "react-native";
import { Chip, Section, Text } from "@/components/ui";
import { priorityTone, ratingTone } from "@/domain/tone";
import { useI18n } from "@/i18n/I18nProvider";
import { makeStyles, spacing } from "@/theme";
import type { SimpleReport } from "@/types/api";
import { FindingCard } from "./FindingCard";

/** "Simple summary" report: current period, this year, six months, priorities, remedy plans. */
export function SimpleReportView({ report }: { report: SimpleReport }) {
  const styles = useStyles();
  const { t, T } = useI18n();
  return (
    <View testID="simple-report">
      {report.rating_label ? <Chip tone={ratingTone(report.rating)} label={`${t("simple_now")}: ${report.rating_label}`} /> : null}
      {report.sections.map((s) => (
        <Section key={s.id} title={s.title}>
          {s.id !== "remedies" && (s.paras ?? []).map((p, i) => <Text key={i} style={styles.para}>{p}</Text>)}
          {s.months && (
            <View style={styles.chips}>
              {s.months.map((m) => <Chip key={m.label} tone={ratingTone(m.rating)} label={`${m.label}: ${m.rating_label}`} />)}
            </View>
          )}
          {s.items?.map((x, i) => (
            <View key={i} style={styles.item}>
              <Chip tone={priorityTone(x.priority)} label={x.priority_label} />
              <Text style={x.priority === "high" ? styles.bold : undefined}>{x.text}</Text>
            </View>
          ))}
          {s.plans && (
            <>
              {(s.paras ?? []).map((p, i) => <Text key={i} variant="muted" style={styles.para}>{p}</Text>)}
              {s.plans.map((pl) => (
                <FindingCard key={pl.planet} tone="mixed" title={`${T(pl.planet)} · ${T(pl.day)}`}>
                  <Text>{pl.why}</Text>
                  {pl.steps.map((st, i) => <Text key={i}>{i + 1}. {st}</Text>)}
                </FindingCard>
              ))}
            </>
          )}
        </Section>
      ))}
      <Text variant="small" style={styles.closing}>{report.closing}</Text>
    </View>
  );
}

const useStyles = makeStyles((t) => ({
  para: { marginBottom: spacing.sm, lineHeight: 23 },
  chips: { flexDirection: "row", flexWrap: "wrap" },
  item: { marginBottom: spacing.md },
  bold: { fontFamily: t.fonts.semibold },
  closing: { marginTop: spacing.lg },
}));
