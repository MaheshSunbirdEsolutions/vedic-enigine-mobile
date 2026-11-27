/**
 * The kundli screen body: header with save/edit/delete, tab strip and tab content.
 * Used for saved kundlis (/kundli/[id]) and unsaved ones (/kundli/preview).
 */
import { useState } from "react";
import { View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Animated, { FadeIn, FadeOut, LinearTransition } from "react-native-reanimated";
import { useRouter } from "expo-router";
import { errorMessageKey } from "@/api";
import { useAppAuth } from "@/auth/useAppAuth";
import { AskTab } from "@/components/tabs/AskTab";
import { ChartTab } from "@/components/tabs/ChartTab";
import { DashaTab } from "@/components/tabs/DashaTab";
import { InterpretationTab } from "@/components/tabs/InterpretationTab";
import { ReportsTab } from "@/components/tabs/ReportsTab";
import { SadeSatiTab } from "@/components/tabs/SadeSatiTab";
import { Button, Card, FadeSwitch, Icon, IconButton, InlineError, QueryView, Screen, SegmentedControl, SkeletonCards, SkeletonChart, Text, confirmAsync, tapFeedback, useToast } from "@/components/ui";
import { to12h } from "@/domain/time12";
import { useChartBundle, useInterpretation } from "@/hooks/useAstro";
import { useDeleteKundli, useSaveKundli } from "@/hooks/useKundlis";
import { useI18n } from "@/i18n/I18nProvider";
import { makeStyles, radius, spacing, useTheme } from "@/theme";
import type { Kundli } from "@/types/api";
import { BirthForm } from "./BirthForm";

export const KUNDLI_TABS = ["chart", "dasha", "interp", "sade", "reports", "ask"] as const;
export type KundliTab = (typeof KUNDLI_TABS)[number];

export function KundliView({ initial }: { initial: Kundli }) {
  const s = useStyles();
  const theme = useTheme();
  const { t, lang } = useI18n();
  const router = useRouter();
  const toast = useToast();
  const { isSignedIn } = useAppAuth();
  const [k, setK] = useState<Kundli>(initial);
  const [tab, setTab] = useState<KundliTab>("chart");
  const [editing, setEditing] = useState(false);
  const bundle = useChartBundle(k);
  const interp = useInterpretation(k, lang, tab === "interp");
  const save = useSaveKundli();
  const del = useDeleteKundli();

  const onSave = async (next: Kundli = k) => {
    if (!isSignedIn) {
      router.push("/(auth)/sign-in");
      return;
    }
    try {
      const saved = await save.mutateAsync(next);
      setK(saved);
      tapFeedback("success");
      toast(t("saved_ok"));
      if (!k.id && saved.id) router.replace({ pathname: "/kundli/[id]", params: { id: saved.id } });
    } catch { /* error shown from save.error */ }
  };
  const onEdit = (next: Kundli) => {
    setEditing(false);
    const merged = { ...next, id: k.id };
    if (k.id) void onSave(merged); else setK(merged);
  };
  const onDelete = async () => {
    if (!isSignedIn) {
      router.push("/(auth)/sign-in");
      return;
    }
    if (!k.id || !(await confirmAsync(t("confirm_delete"), t("delete"), t("cancel")))) return;
    try { await del.mutateAsync(k.id); toast(t("kundli_deleted")); router.back(); } catch { /* shown below */ }
  };
  const actionError = save.error ?? del.error;

  const time = to12h(k.datetime_local.slice(11, 19));
  const onWhite = theme.colors.onAccent;

  return (
    <Screen testID="kundli-view">
      <Animated.View entering={FadeIn.duration(260)} style={[s.heroWrap, theme.shadowRaised]}>
        <LinearGradient colors={theme.gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.hero}>
          <View style={s.heroTop}>
            <Text variant="title" style={[s.onHero, s.flex]} numberOfLines={2}>{k.name || t("new_kundli")}</Text>
          </View>
          <View style={s.heroMeta}>
            <Icon name="calendar-outline" size={14} color={onWhite} />
            <Text variant="small" style={s.onHeroSoft}>{k.datetime_local.slice(0, 10)} · {time.time} {time.meridiem}</Text>
          </View>
          <View style={s.heroMeta}>
            <Icon name="location-outline" size={14} color={onWhite} />
            <Text variant="small" style={[s.onHeroSoft, s.flex]} numberOfLines={1}>{k.place || `${k.lat.toFixed(3)}, ${k.lon.toFixed(3)}`} · {k.tz}</Text>
          </View>
        </LinearGradient>
      </Animated.View>

      <View style={s.actions}>
        <Button testID="save-kundli" icon={k.id ? "checkmark" : "bookmark-outline"} label={k.id ? t("update") : t("save")} onPress={() => void onSave()} loading={save.isPending} style={s.flex} />
        <IconButton testID="edit-kundli" icon={editing ? "close" : "create-outline"} size={48} label={editing ? t("cancel") : t("edit")} onPress={() => setEditing((e) => !e)} />
        {k.id && <IconButton testID="delete-kundli" icon="trash-outline" tone="danger" size={48} label={t("delete")} onPress={() => void onDelete()} disabled={del.isPending} />}
      </View>
      <InlineError message={actionError ? t(errorMessageKey(actionError)) : null} />

      {editing && (
        <Animated.View entering={FadeIn.duration(220)} exiting={FadeOut.duration(140)} layout={LinearTransition}>
          <Card><BirthForm initial={k} submitLabel={t("generate")} onSubmit={onEdit} onCancel={() => setEditing(false)} /></Card>
        </Animated.View>
      )}
      <Animated.View layout={LinearTransition.springify().damping(20)}>
        <SegmentedControl<KundliTab> scroll testID="kundli-tab" value={tab} onChange={setTab}
          segments={KUNDLI_TABS.map((x) => ({ value: x, label: t(`tab_${x}`) }))} />

        <FadeSwitch id={tab}>
          {tab === "reports" ? <ReportsTab kundli={k} />
            : tab === "ask" ? <AskTab kundli={k} />
            : tab === "interp" ? (
              <QueryView query={interp} skeleton={<SkeletonCards count={4} />}>{(d) => <InterpretationTab data={d} />}</QueryView>
            ) : (
              <QueryView query={bundle} skeleton={<SkeletonChart />}>
                {(d) => tab === "chart" ? <ChartTab chart={d.chart} /> : tab === "dasha" ? <DashaTab dasha={d.dasha} /> : <SadeSatiTab data={d.sade} />}
              </QueryView>
            )}
        </FadeSwitch>
      </Animated.View>
    </Screen>
  );
}

const useStyles = makeStyles((t) => ({
  heroWrap: { borderRadius: radius.xl, marginBottom: spacing.md },
  hero: { borderRadius: radius.xl, padding: spacing.xl, gap: 6, overflow: "hidden" },
  heroTop: { flexDirection: "row", alignItems: "flex-start", gap: spacing.sm, marginBottom: 4 },
  heroMeta: { flexDirection: "row", alignItems: "center", gap: 6 },
  onHero: { color: t.colors.onAccent },
  onHeroSoft: { color: t.colors.onAccent, opacity: 0.88 },
  actions: { flexDirection: "row", alignItems: "center", gap: spacing.sm, marginBottom: spacing.md },
  flex: { flex: 1 },
}));
