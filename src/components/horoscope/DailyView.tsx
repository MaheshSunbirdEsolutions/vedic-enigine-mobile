/**
 * Personalized Daily Horoscope view for a Kundli (Chandrabala, Tarabala, daily Gochara,
 * area-by-area outlook, 7-day strip, and 9 planetary transits).
 * Port of web/components/DailyReport.tsx.
 */
import { View } from "react-native";
import { Fold, H2, LabelLine, Note, P, rateTone } from "@/components/reports/parts";
import { Chip, Stat, StatRow, Text } from "@/components/ui";
import { formatDate, formatTime } from "@/domain/format";
import { useI18n } from "@/i18n/I18nProvider";
import { makeStyles, spacing, useTheme } from "@/theme";
import type { DailyReport, Kundli } from "@/types/api";
import { EmailShareSection } from "./EmailShareSection";
import { AreaOutlookList, GuidanceCards, TransitsTable, WeekStrip, YogaCautionChips } from "./parts";

export function DailyView({
  r,
  kundli,
  onSelectDay,
}: {
  r: DailyReport;
  kundli?: Kundli;
  onSelectDay?: (day: string) => void;
}) {
  const s = useStyles();
  const theme = useTheme();
  const { t, T, lang } = useI18n();
  const p = r.panchang;
  const cb = r.chandrabala;
  const tb = r.tarabala;
  const tip = r.daily_tip;
  const tm = (v?: string) => formatTime(v, r.date, lang);

  return (
    <View testID="daily-view">
      <View style={s.headRow}>
        <H2>{formatDate(r.date, lang)}</H2>
        <Chip tone={rateTone(r.rating)} label={r.rating_label} />
      </View>

      {kundli && (
        <EmailShareSection
          kind="kundli"
          kundli={kundli}
          tz={kundli.tz}
          lat={kundli.lat}
          lon={kundli.lon}
          day={r.date}
        />
      )}

      <P>{r.summary}</P>

      <StatRow>
        <Stat label={`${t("vara")} / ${t("tithi")}`} value={T(p.vara)}>
          <Text variant="small">{T(p.tithi.paksha)} {T(p.tithi.name)}</Text>
        </Stat>
        <Stat label={t("nakshatra")} value={T(p.nakshatra.name)}>
          <Text variant="small">{t("ends")} {tm(p.nakshatra.ends)}</Text>
        </Stat>
        <Stat label={t("chandrabala")} value={`${T(cb.moon_sign)} (${cb.house_from_moon})`}>
          <View style={s.chandraMeta}>
            <Chip tone={cb.chandrashtama ? "bad" : cb.favourable ? "good" : "mixed"} label={cb.label} />
            <Text variant="small">{t("bindus")}: {cb.bindus}</Text>
          </View>
        </Stat>
        {tb ? (
          <Stat label={t("tarabala")} value={tb.name}>
            <Text variant="small" style={tb.good === false ? { color: theme.colors.bad } : undefined}>{tb.meaning}</Text>
          </Stat>
        ) : null}
        {r.dasha_now?.length > 0 ? (
          <Stat label={t("running_now")} value={r.dasha_now.map(T).join(" / ")}>
            {r.dasha_reading?.rating_label ? <Text variant="small">{r.dasha_reading.rating_label}</Text> : null}
          </Stat>
        ) : null}
        <Stat label={t("rahu_kaal")} value={`${tm(p.rahu_kaal.start)}–${tm(p.rahu_kaal.end)}`}>
          <Text variant="small">{t("sunrise")} {tm(p.sunrise)}</Text>
        </Stat>
      </StatRow>

      <YogaCautionChips yogas={r.yogas} cautions={r.cautions} />
      <GuidanceCards favour={r.guidance.favour} avoid={r.guidance.avoid} />

      {tip ? (
        <View style={s.tipWrap}>
          <View style={[s.tipCard, { borderLeftColor: theme.colors.mixed, backgroundColor: theme.colors.card }, theme.shadow]}>
            <Text variant="subheading">{t("daily_tip")} · {T(tip.planet)}</Text>
            <LabelLine label={t("lucky_colour")}>{tip.colour}</LabelLine>
            <P>{tip.practice}</P>
            <Note>
              {t("sys_mantra")}: {tip.mantra} · {t("daana")}: {tip.daana}
            </Note>
          </View>
        </View>
      ) : null}

      <AreaOutlookList areas={r.areas} />

      <WeekStrip
        title={t("next_7_days")}
        items={r.week ?? []}
        activeDate={r.date}
        onSelectDay={onSelectDay}
        renderMeta={(w) => (
          <>
            <Text variant="small">{T(w.nakshatra)}</Text>
            <Text variant="small" style={w.chandrashtama ? { color: theme.colors.bad } : undefined}>
              {w.tara}{w.chandrashtama ? " · ⚠ 8th" : ""}
            </Text>
          </>
        )}
      />

      <Fold summary={t("transits_today")}>
        <TransitsTable transits={r.transits} showLagnaAndBindus />
      </Fold>

      <Note>{t("method")}: {r.method}</Note>
      <Note>{r.disclaimer}</Note>
    </View>
  );
}

const useStyles = makeStyles((t) => ({
  headRow: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: spacing.sm, marginBottom: spacing.sm },
  chandraMeta: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: 4, marginTop: 4 },
  tipWrap: { marginBottom: spacing.md },
  tipCard: {
    borderRadius: 14,
    padding: spacing.md,
    paddingLeft: spacing.lg,
    borderLeftWidth: 4,
    borderWidth: t.dark ? 1 : 0.5,
    borderColor: t.dark ? t.colors.line : t.colors.lineSoft,
    gap: 4,
  },
}));
