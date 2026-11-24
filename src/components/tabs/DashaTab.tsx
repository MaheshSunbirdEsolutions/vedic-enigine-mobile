import { useMemo, useState } from "react";
import { Pressable, View } from "react-native";
import { Stat, StatRow, Text } from "@/components/ui";
import { currentKeys, flattenDasha, toggleKey, type DashaRow } from "@/domain/dasha";
import { formatDate } from "@/domain/format";
import { useI18n } from "@/i18n/I18nProvider";
import { makeStyles, spacing } from "@/theme";
import type { Dasha } from "@/types/api";

/** Vimshottari MD → AD → PD as an expandable list; the running periods start open. */
export function DashaTab({ dasha, now }: { dasha: Dasha; now?: Date }) {
  const styles = useStyles();
  const { t, T, lang } = useI18n();
  const [expanded, setExpanded] = useState(() => currentKeys(dasha.mahadashas, now));
  const rows = useMemo(() => flattenDasha(dasha.mahadashas, expanded, now), [dasha, expanded, now]);
  const label = (r: DashaRow) =>
    r.level === 1 ? `${T(r.lords[0])} ${t("mahadasha")}` : `${T(r.lords[r.level - 2])} – ${T(r.lords[r.level - 1])}`;

  return (
    <View testID="dasha-tab">
      <StatRow>
        <Stat label={t("birth_dasha")} value={`${T(dasha.birth_dasha.lord)} · ${dasha.birth_dasha.balance_years.toFixed(2)} ${t("yrs_left")}`} />
        <Stat label={t("running_now")} value={dasha.current.map(T).join(" / ") || "—"} />
      </StatRow>
      <Text variant="small" style={styles.hint}>{t("dasha_hint")}</Text>
      {rows.map((r) => (
        <Pressable key={r.key} testID={`dasha-${r.key}`} disabled={!r.expandable}
          onPress={() => setExpanded((s) => toggleKey(s, r.key))}
          accessibilityRole={r.expandable ? "button" : "text"} accessibilityState={{ expanded: r.expanded }}
          style={[styles.row, { paddingLeft: 8 + (r.level - 1) * 20 }, r.current && styles.cur]}>
          <Text style={[styles.lord, r.level === 3 && styles.muted, r.level === 1 && styles.b]}>
            {r.expandable ? (r.expanded ? "▾ " : "▸ ") : "  "}{label(r)}
          </Text>
          <Text variant="small">{formatDate(r.start, lang)} → {formatDate(r.end, lang)}</Text>
        </Pressable>
      ))}
    </View>
  );
}

const useStyles = makeStyles((t) => ({
  hint: { marginBottom: spacing.sm },
  row: { paddingVertical: 9, paddingRight: 8, borderBottomWidth: 1, borderBottomColor: t.colors.lineSoft },
  cur: { backgroundColor: t.colors.accentSoft },
  lord: { fontSize: 15 },
  b: { fontFamily: t.fonts.semibold },
  muted: { color: t.colors.muted },
}));
