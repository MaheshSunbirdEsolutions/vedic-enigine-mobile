/**
 * Shared UI building blocks for Daily Horoscope (both 12-Rashi and personalized Kundli views).
 */
import type { ReactNode } from "react";
import { ScrollView, View } from "react-native";
import { Block, Bullets, Chips, H3, Note, rateTone } from "@/components/reports/parts";
import { Chip, DataTable, PressableScale, Text, type Column } from "@/components/ui";
import { formatDate } from "@/domain/format";
import { useI18n } from "@/i18n/I18nProvider";
import { makeStyles, radius, spacing, useTheme } from "@/theme";
import type { DailyArea, DailyTransit, Rating } from "@/types/api";

export function GuidanceCards({ favour, avoid }: { favour: string[]; avoid: string[] }) {
  const { t } = useI18n();
  return (
    <View>
      <Block tone="good" title={t("daily_favour")}>
        <Bullets items={favour} />
      </Block>
      <Block tone="bad" title={t("daily_avoid")}>
        <Bullets items={avoid} />
      </Block>
    </View>
  );
}

export function AreaOutlookList({ areas }: { areas: DailyArea[] }) {
  const { t } = useI18n();
  const s = useStyles();
  return (
    <>
      <H3>{t("area_outlook")}</H3>
      {areas.map((a) => (
        <Block
          key={a.area}
          tone={rateTone(a.rating)}
          title={a.title}
          right={<Chip tone={rateTone(a.rating)} label={a.rating_label} />}
        >
          {a.text ? <Text style={s.areaText}>{a.text}</Text> : null}
          <Bullets items={a.reasons} />
        </Block>
      ))}
    </>
  );
}

export type WeekStripItem = {
  date: string;
  weekday: string;
  rating: Rating;
  rating_label: string;
};

export function WeekStrip<T extends WeekStripItem>({
  title,
  items,
  activeDate,
  onSelectDay,
  renderMeta,
}: {
  title: string;
  items: T[];
  activeDate?: string;
  onSelectDay?: (day: string) => void;
  renderMeta: (item: T) => ReactNode;
}) {
  const { lang } = useI18n();
  const s = useStyles();
  const t = useTheme();
  if (!items?.length) return null;

  return (
    <>
      <H3>{title}</H3>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.weekScroll} contentContainerStyle={s.weekContent}>
        {items.map((w, idx) => {
          const isActive = activeDate ? w.date === activeDate : idx === 0;
          const card = (
            <View style={[s.dayCard, t.shadow, isActive && s.dayCardActive]}>
              <Text variant="label" numberOfLines={1}>{formatDate(w.date, lang)} · {w.weekday}</Text>
              <View style={s.dayChipWrap}>
                <Chip tone={rateTone(w.rating)} label={w.rating_label} />
              </View>
              {renderMeta(w)}
            </View>
          );
          if (!onSelectDay) return <View key={w.date}>{card}</View>;
          return (
            <PressableScale
              key={w.date}
              testID={`horoscope-day-${w.date}`}
              onPress={() => onSelectDay(w.date)}
              haptic="selection"
              scaleTo={0.97}
              accessibilityRole="button"
              accessibilityLabel={`${formatDate(w.date, lang)} ${w.weekday} ${w.rating_label}`}
            >
              {card}
            </PressableScale>
          );
        })}
      </ScrollView>
    </>
  );
}

export function TransitsTable({
  transits,
  showLagnaAndBindus = false,
}: {
  transits: DailyTransit[];
  showLagnaAndBindus?: boolean;
}) {
  const { t, T } = useI18n();
  const s = useStyles();
  const cols: Column<DailyTransit>[] = [
    { key: "p", label: t("graha"), width: 92, render: (x) => <Text weight="semibold">{T(x.planet)}</Text> },
    { key: "s", label: t("sign"), width: 96, render: (x) => T(x.sign) },
    { key: "n", label: t("nakshatra"), width: 120, render: (x) => T(x.nakshatra) },
    {
      key: "h",
      label: t("house"),
      width: showLagnaAndBindus ? 88 : 70,
      render: (x) => (
        <View style={s.houseCell}>
          <Chip tone={x.good ? "good" : "neutral"} label={String(x.house_from_moon)} />
          {showLagnaAndBindus && x.house_from_lagna != null ? (
            <Text variant="small">/{x.house_from_lagna}</Text>
          ) : null}
        </View>
      ),
    },
    ...(showLagnaAndBindus
      ? [{ key: "b", label: t("bindus"), width: 72, render: (x: DailyTransit) => String(x.bindus ?? "—") }]
      : []),
    { key: "t", label: "", width: 250, render: (x) => <Text variant="small">{x.text}</Text> },
  ];

  return (
    <DataTable
      scroll
      rows={transits}
      rowKey={(x) => x.planet}
      highlight={(x) => x.good}
      columns={cols}
    />
  );
}

export function YogaCautionChips({ yogas, cautions }: { yogas?: string[]; cautions?: string[] }) {
  if (!yogas?.length && !cautions?.length) return null;
  return (
    <Chips>
      {yogas?.map((y) => <Chip key={y} tone="good" label={y} />)}
      {cautions?.map((c) => <Chip key={c} tone="bad" label={c} />)}
    </Chips>
  );
}

export { Note };

const useStyles = makeStyles((t) => ({
  areaText: { marginBottom: spacing.xs },
  weekScroll: { marginBottom: spacing.md },
  weekContent: { gap: spacing.sm, paddingRight: spacing.sm },
  dayCard: {
    width: 152,
    backgroundColor: t.colors.card,
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: t.dark ? 1 : 0.5,
    borderColor: t.dark ? t.colors.line : t.colors.lineSoft,
    gap: 2,
  },
  dayCardActive: {
    borderWidth: 2,
    borderColor: t.colors.accent,
    backgroundColor: t.colors.accentSoft,
  },
  dayChipWrap: { marginTop: 4 },
  houseCell: { flexDirection: "row", alignItems: "center", gap: 4 },
}));
