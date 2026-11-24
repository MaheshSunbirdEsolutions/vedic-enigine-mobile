import { View } from "react-native";
import { Card, Chip, Section, Stat, StatRow, Text } from "@/components/ui";
import { isCurrent } from "@/domain/dasha";
import { formatDate } from "@/domain/format";
import { useI18n } from "@/i18n/I18nProvider";
import { makeStyles, spacing } from "@/theme";
import type { SadeSati } from "@/types/api";

export function SadeSatiTab({ data, now }: { data: SadeSati; now?: Date }) {
  const styles = useStyles();
  const { t, T, lang } = useI18n();
  const n = data.now;
  return (
    <View testID="sade-tab">
      <StatRow>
        <Stat label={t("natal_moon")} value={T(data.moon_sign)} />
        <Stat label={t("saturn_today")} value={T(n.saturn_sign)} />
        <Stat label={t("sade_now")}>{n.sade_sati ? <Chip tone="bad" label={`${t("yes")} · ${T(n.phase)}`} /> : <Chip tone="good" label={t("no")} />}</Stat>
        <Stat label={t("dhaiya")}>{n.dhaiya ? <Chip tone="mixed" label={T(n.dhaiya)} /> : <Text>—</Text>}</Stat>
      </StatRow>
      <Section title={t("lifetime_sade")}>
        {data.periods.map((p, i) => (
          <Card key={i} style={isCurrent(p, now) ? styles.cur : undefined}>
            <Text variant="subheading">{formatDate(p.start, lang)} → {p.end ? formatDate(p.end, lang) : "—"}</Text>
            <View style={styles.chips}>
              {p.phases.map((ph, k) => <Chip key={k} tone="neutral" label={`${T(ph.sign)}: ${T(ph.phase)} · ${formatDate(ph.from, lang)}`} />)}
            </View>
          </Card>
        ))}
      </Section>
      <Text variant="small">{t("sade_note")}</Text>
    </View>
  );
}

const useStyles = makeStyles((t) => ({
  cur: { backgroundColor: t.colors.accentSoft, borderColor: t.colors.accent },
  chips: { flexDirection: "row", flexWrap: "wrap", marginTop: spacing.sm },
}));
