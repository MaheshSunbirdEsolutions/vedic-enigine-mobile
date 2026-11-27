import { useState } from "react";
import { Pressable, View } from "react-native";
import { BirthForm } from "@/components/kundli/BirthForm";
import { Button, Card, Text } from "@/components/ui";
import type { IconName } from "@/components/ui";
import { describeBirth } from "@/domain/birth";
import { useI18n } from "@/i18n/I18nProvider";
import { makeStyles, radius, spacing } from "@/theme";
import type { Kundli } from "@/types/api";

/** Pick a person for matching: one of the saved kundlis, or new birth details. */
export function PersonPicker({ title, icon, saved, value, onChange, testID }: {
  title: string; icon?: IconName; saved: Kundli[]; value: Kundli | null; onChange: (k: Kundli | null) => void; testID?: string;
}) {
  const styles = useStyles();
  const { t } = useI18n();
  const [mode, setMode] = useState<"closed" | "saved" | "manual">("closed");
  return (
    <Card icon={icon} title={title} testID={testID}>
      {value ? <Text testID={`${testID}-value`}>{value.name} · <Text variant="small">{describeBirth(value)}</Text></Text>
        : <Text variant="muted">{t("person_pick")}</Text>}
      <View style={styles.actions}>
        <Button
          testID={testID ? `${testID}-saved` : undefined}
          variant="secondary"
          icon="albums-outline"
          label={t("choose_saved")}
          onPress={() => setMode(mode === "saved" ? "closed" : "saved")}
          disabled={!saved.length}
          style={[styles.btn, mode === "saved" && styles.btnActive]}
        />
        <Button
          testID={testID ? `${testID}-manual` : undefined}
          variant="secondary"
          icon="add"
          label={t("new_kundli")}
          onPress={() => setMode(mode === "manual" ? "closed" : "manual")}
          style={[styles.btn, mode === "manual" && styles.btnActive]}
        />
      </View>
      {mode === "saved" && saved.map((k) => (
        <Pressable key={k.id} onPress={() => { onChange(k); setMode("closed"); }} accessibilityRole="button"
          style={[styles.option, value?.id === k.id && styles.on]}>
          <Text>{k.name} <Text variant="small">· {k.datetime_local.slice(0, 10)}</Text></Text>
        </Pressable>
      ))}
      {mode === "manual" && (
        <BirthForm submitLabel="OK" requireAuth={false} onSubmit={(k) => { onChange(k); setMode("closed"); }} onCancel={() => setMode("closed")} />
      )}
    </Card>
  );
}

const useStyles = makeStyles((t) => ({
  actions: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, marginVertical: spacing.sm },
  btn: { flexGrow: 1, borderWidth: 1, borderColor: "transparent" },
  btnActive: { backgroundColor: t.colors.accentSoft, borderColor: t.colors.accent },
  option: { padding: spacing.md, borderRadius: radius.sm, borderWidth: 1, borderColor: t.colors.line, marginBottom: 6 },
  on: { backgroundColor: t.colors.accentSoft, borderColor: t.colors.accent },
}));
