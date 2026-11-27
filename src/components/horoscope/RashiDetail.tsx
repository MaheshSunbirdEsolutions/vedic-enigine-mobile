/**
 * Detailed view for a single Moon sign (Rashi) from /horoscope/daily.
 * Port of RashiDetail in web/app/(app)/horoscope/page.tsx.
 */
import { View } from "react-native";
import { Block, Chips, H3, LabelLine, Note, P, rateTone } from "@/components/reports/parts";
import { Button, Chip, Stat, StatRow, Text } from "@/components/ui";
import { formatTime } from "@/domain/format";
import { useI18n } from "@/i18n/I18nProvider";
import { makeStyles, spacing } from "@/theme";
import type { DailyPanchangSummary, DailyRashiSign } from "@/types/api";
import { AreaOutlookList, GuidanceCards, TransitsTable, WeekStrip } from "./parts";

export function RashiDetail({
  s: signData,
  p,
  moonSign,
  day,
  onSelectDay,
  onBack,
}: {
  s: DailyRashiSign;
  p: DailyPanchangSummary;
  moonSign: string;
  day: string;
  onSelectDay: (d: string) => void;
  onBack: () => void;
}) {
  const styles = useStyles();
  const { t, T, lang } = useI18n();
  const tm = (v?: string) => formatTime(v, day, lang);

  return (
    <View testID={`rashi-detail-${signData.sign}`}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text variant="title">{T(signData.sign)}</Text>
          <Chip tone={rateTone(signData.rating)} label={signData.rating_label} />
        </View>
        <Button
          testID="rashi-back-btn"
          size="sm"
          variant="ghost"
          icon="arrow-back"
          label={t("all_signs")}
          onPress={onBack}
        />
      </View>

      <Note>{t("lord")}: {T(signData.lord)} · {t("score")}: {signData.score}</Note>

      {(signData.chandrashtama || signData.ghat_nakshatra || signData.saturn_phase) ? (
        <Chips>
          {signData.chandrashtama ? <Chip tone="bad" label="Chandrashtama (8th)" /> : null}
          {signData.ghat_nakshatra ? <Chip tone="bad" label={`${t("ghat_nak")}: ${T(signData.ghat_nakshatra_name)}`} /> : null}
          {signData.saturn_phase ? <Chip tone="mixed" label={`${t("sade_dhaiya")}: ${T(signData.saturn_phase)}`} /> : null}
        </Chips>
      ) : null}

      <P>{signData.overview}</P>

      <StatRow>
        <Stat label={t("transit_moon")} value={`${T(moonSign)} (+${signData.moon_house})`}>
          <Text variant="small">{T(p.nakshatra.name)}</Text>
        </Stat>
        <Stat label={t("lucky_colour")} value={signData.colour} />
        <Stat label={t("lucky_numbers")} value={signData.lucky_numbers.join(", ")} />
        <Stat
          label={t("sade_dhaiya")}
          value={signData.saturn_phase ? T(signData.saturn_phase) : t("normal_saturn")}
        />
        <Stat label={t("rahu_kaal")} value={`${tm(p.rahu_kaal.start)}–${tm(p.rahu_kaal.end)}`}>
          <Text variant="small">{t("sunrise")} {tm(p.sunrise)}</Text>
        </Stat>
      </StatRow>

      <GuidanceCards favour={signData.guidance.favour} avoid={signData.guidance.avoid} />
      <AreaOutlookList areas={signData.areas} />

      <Block tone="mixed" title={`${t("daily_tip")} · ${T(signData.lord)}`}>
        <P>{signData.tip}</P>
        <LabelLine label={t("deity_worship")}>{signData.deity}</LabelLine>
        <LabelLine label={t("daana")}>{signData.daana}</LabelLine>
        <Note>{t("sys_mantra")}: {signData.mantra}</Note>
        {signData.health_watch ? (
          <Note>{t("health_watch_today")}: {signData.health_watch.parts} ({signData.health_watch.watch})</Note>
        ) : null}
      </Block>

      <WeekStrip
        title={t("next_7_days_rashi")}
        items={signData.week ?? []}
        activeDate={day}
        onSelectDay={onSelectDay}
        renderMeta={(w) => (
          <>
            <Text variant="small">{T(w.moon_sign)} (+{w.moon_house})</Text>
            <Text variant="small">{T(w.nakshatra)}{w.chandrashtama ? " · ⚠ 8th" : ""}</Text>
          </>
        )}
      />

      <H3>{t("transits_from_rashi")} {T(signData.sign)}</H3>
      <TransitsTable transits={signData.transits} />
    </View>
  );
}

const useStyles = makeStyles(() => ({
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: spacing.sm, marginBottom: 4 },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: spacing.sm, flexWrap: "wrap", flex: 1 },
}));
