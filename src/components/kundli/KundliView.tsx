/**
 * The kundli screen body: header with save/edit/delete, tab strip and tab content.
 * Used for saved kundlis (/kundli/[id]) and unsaved ones (/kundli/preview).
 */
import { useState } from "react";
import { StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";
import { errorMessageKey } from "@/api";
import { AskTab } from "@/components/tabs/AskTab";
import { ChartTab } from "@/components/tabs/ChartTab";
import { DashaTab } from "@/components/tabs/DashaTab";
import { InterpretationTab } from "@/components/tabs/InterpretationTab";
import { ReportsTab } from "@/components/tabs/ReportsTab";
import { SadeSatiTab } from "@/components/tabs/SadeSatiTab";
import { Button, Card, Chip, InlineError, QueryView, Screen, SegmentedControl, SkeletonCards, SkeletonChart, Text, confirmAsync, useToast } from "@/components/ui";
import { describeBirth } from "@/domain/birth";
import { useChartBundle, useInterpretation } from "@/hooks/useAstro";
import { useDeleteKundli, useSaveKundli } from "@/hooks/useKundlis";
import { useI18n } from "@/i18n/I18nProvider";
import { spacing } from "@/theme";
import type { Kundli } from "@/types/api";
import { BirthForm } from "./BirthForm";

export const KUNDLI_TABS = ["chart", "dasha", "interp", "sade", "reports", "ask"] as const;
export type KundliTab = (typeof KUNDLI_TABS)[number];

export function KundliView({ initial }: { initial: Kundli }) {
  const { t, lang } = useI18n();
  const router = useRouter();
  const toast = useToast();
  const [k, setK] = useState<Kundli>(initial);
  const [tab, setTab] = useState<KundliTab>("chart");
  const [editing, setEditing] = useState(false);
  const bundle = useChartBundle(k);
  const interp = useInterpretation(k, lang, tab === "interp");
  const save = useSaveKundli();
  const del = useDeleteKundli();

  const onSave = async (next: Kundli = k) => {
    try {
      const saved = await save.mutateAsync(next);
      setK(saved);
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
    if (!k.id || !(await confirmAsync(t("confirm_delete"), t("delete"), t("cancel")))) return;
    try { await del.mutateAsync(k.id); toast(t("kundli_deleted")); router.back(); } catch { /* shown below */ }
  };
  const actionError = save.error ?? del.error;

  return (
    <Screen testID="kundli-view">
      <View style={styles.header}>
        <Text variant="title">{k.name || t("new_kundli")}</Text>
        <Text variant="small">{t("born")}: {describeBirth(k)} · {k.tz}</Text>
        {!k.id && <Chip tone="mixed" label={t("unsaved")} />}
        <View style={styles.actions}>
          <Button testID="save-kundli" label={k.id ? t("update") : t("save")} onPress={() => void onSave()} loading={save.isPending} />
          <Button testID="edit-kundli" variant="light" label={t("edit")} onPress={() => setEditing((e) => !e)} />
          {k.id && <Button testID="delete-kundli" variant="danger" label={t("delete")} onPress={() => void onDelete()} loading={del.isPending} />}
        </View>
        <InlineError message={actionError ? t(errorMessageKey(actionError)) : null} />
      </View>
      {editing && (
        <Card><BirthForm initial={k} submitLabel={t("generate")} onSubmit={onEdit} onCancel={() => setEditing(false)} /></Card>
      )}
      <SegmentedControl<KundliTab> scroll testID="kundli-tab" value={tab} onChange={setTab}
        segments={KUNDLI_TABS.map((x) => ({ value: x, label: t(`tab_${x}`) }))} />

      {tab === "reports" ? <ReportsTab kundli={k} />
        : tab === "ask" ? <AskTab kundli={k} />
        : tab === "interp" ? (
          <QueryView query={interp} skeleton={<SkeletonCards count={4} />}>{(d) => <InterpretationTab data={d} />}</QueryView>
        ) : (
          <QueryView query={bundle} skeleton={<SkeletonChart />}>
            {(d) => tab === "chart" ? <ChartTab chart={d.chart} /> : tab === "dasha" ? <DashaTab dasha={d.dasha} /> : <SadeSatiTab data={d.sade} />}
          </QueryView>
        )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { marginBottom: spacing.md, gap: 4 },
  actions: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, marginTop: spacing.sm },
});
