/** Saved kundlis: search, list, pull to refresh, long-press to delete, + new. */
import { useCallback, useState } from "react";
import { FlatList, RefreshControl, View } from "react-native";
import { useRouter } from "expo-router";
import { KundliListItem } from "@/components/kundli/KundliListItem";
import { Button, EmptyState, ErrorState, SkeletonList, Text, TextField, confirmAsync, useToast } from "@/components/ui";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { useDeleteKundli, useKundliList } from "@/hooks/useKundlis";
import { useI18n } from "@/i18n/I18nProvider";
import { makeStyles, spacing, useTheme } from "@/theme";
import type { Kundli } from "@/types/api";

export default function KundlisScreen() {
  const styles = useStyles();
  const { colors } = useTheme();
  const { t } = useI18n();
  const router = useRouter();
  const toast = useToast();
  const [search, setSearch] = useState("");
  const list = useKundliList(useDebouncedValue(search, 250));
  const del = useDeleteKundli();

  const open = useCallback((k: Kundli) => router.push({ pathname: "/kundli/[id]", params: { id: k.id! } }), [router]);
  const remove = useCallback(async (k: Kundli) => {
    if (!k.id || !(await confirmAsync(`${t("confirm_delete")}\n${k.name}`, t("delete"), t("cancel")))) return;
    del.mutate(k.id, { onSuccess: () => toast(t("kundli_deleted")) });
  }, [del, t, toast]);

  const header = (
    <View>
      <View style={styles.titleRow}>
        <Text variant="title" style={styles.flex}>{t("saved_kundlis")}</Text>
        <Button testID="new-kundli" label={`+ ${t("new_kundli")}`} onPress={() => router.push("/kundli/new")} />
      </View>
      <TextField testID="kundli-search" value={search} onChangeText={setSearch} placeholder={t("search")} autoCorrect={false} clearButtonMode="while-editing" />
      {list.isError && <ErrorState error={list.error} onRetry={() => void list.refetch()} />}
    </View>
  );

  return (
    <FlatList
      testID="kundli-list"
      style={styles.root}
      contentContainerStyle={styles.content}
      data={list.data ?? []}
      keyExtractor={(k) => k.id ?? k.datetime_local}
      renderItem={({ item }) => <KundliListItem k={item} onPress={() => open(item)} onLongPress={() => void remove(item)} />}
      ListHeaderComponent={header}
      ListEmptyComponent={
        list.isPending ? <SkeletonList /> : list.isError ? undefined : (
          <EmptyState message={search.trim() ? t("no_results") : t("no_saved")}
            action={search.trim() ? undefined : { label: t("new_kundli"), onPress: () => router.push("/kundli/new") }} />
        )
      }
      refreshControl={<RefreshControl refreshing={list.isRefetching && !list.isPending} onRefresh={() => void list.refetch()} tintColor={colors.accent} colors={[colors.accent]} />}
      keyboardShouldPersistTaps="handled"
    />
  );
}

const useStyles = makeStyles((t) => ({
  root: { flex: 1, backgroundColor: t.colors.bg },
  content: { padding: spacing.lg, paddingBottom: 48 },
  titleRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm, marginBottom: spacing.md },
  flex: { flex: 1 },
}));
