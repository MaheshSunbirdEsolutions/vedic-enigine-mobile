/**
 * Birth details form. All state rules and validation are in domain/birthForm;
 * this component only binds fields to them.
 */
import { useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { Button, SegmentedControl, Text, TextField } from "@/components/ui";
import { applyPlace, initialFormValues, validateBirthForm, type BirthFormErrors, type BirthFormValues } from "@/domain/birthForm";
import { useI18n } from "@/i18n/I18nProvider";
import { colors, spacing } from "@/theme";
import type { Ayanamsa, Gender, Kundli, NodeType } from "@/types/api";
import { DateTimeField } from "./DateTimeField";
import { PlaceSearch } from "./PlaceSearch";

export type BirthFormProps = {
  initial?: Partial<Kundli>;
  onSubmit: (k: Kundli) => void;
  submitLabel?: string;
  onCancel?: () => void;
  busy?: boolean;
};

export function BirthForm({ initial, onSubmit, submitLabel, onCancel, busy }: BirthFormProps) {
  const { t } = useI18n();
  const [v, setV] = useState<BirthFormValues>(() => initialFormValues(initial));
  const [errors, setErrors] = useState<BirthFormErrors>({});
  const [advanced, setAdvanced] = useState(false);
  const set = <K extends keyof BirthFormValues>(k: K, value: BirthFormValues[K]) => setV((x) => ({ ...x, [k]: value }));

  const submit = () => {
    const r = validateBirthForm(v, initial?.id);
    if (!r.ok) {
      setErrors(r.errors);
      if (r.errors.lat || r.errors.lon || r.errors.tz) setAdvanced(true);
      return;
    }
    setErrors({});
    onSubmit(r.kundli);
  };
  const e = (k: keyof BirthFormErrors) => (errors[k] ? t(errors[k]!) : null);

  return (
    <View testID="birth-form">
      <TextField testID="field-name" label={t("name")} value={v.name} onChangeText={(s) => set("name", s)} placeholder={t("name_ph")} />
      <Text variant="label">{t("gender")}</Text>
      <SegmentedControl<Gender | "none">
        value={v.gender || "none"}
        onChange={(g) => set("gender", g === "none" ? "" : g)}
        segments={[{ value: "none", label: "—" }, { value: "male", label: t("male") }, { value: "female", label: t("female") }, { value: "other", label: t("other") }]}
      />
      <DateTimeField testID="field-date" mode="date" label={t("dob")} date={v.date} time={v.time} onChange={(s) => set("date", s)} error={e("date")} />
      <DateTimeField testID="field-time" mode="time" label={t("tob")} date={v.date} time={v.time} onChange={(s) => set("time", s)} error={e("time")} />
      <PlaceSearch label={t("pob")} value={v.place} onSelect={(p) => setV((x) => applyPlace(x, p))} error={e("place")} />

      <Pressable onPress={() => setAdvanced((a) => !a)} accessibilityRole="button" testID="toggle-advanced">
        <Text variant="muted" style={styles.adv}>{advanced ? "▾" : "▸"} {t("advanced")}</Text>
      </Pressable>
      {advanced && (
        <View>
          <View style={styles.row}>
            <View style={styles.flex}><TextField testID="field-lat" label={t("latitude")} value={v.lat} onChangeText={(s) => set("lat", s)} keyboardType="numbers-and-punctuation" error={e("lat")} /></View>
            <View style={styles.flex}><TextField testID="field-lon" label={t("longitude")} value={v.lon} onChangeText={(s) => set("lon", s)} keyboardType="numbers-and-punctuation" error={e("lon")} /></View>
          </View>
          <TextField testID="field-tz" label={t("timezone")} value={v.tz} onChangeText={(s) => set("tz", s)} placeholder="Asia/Kolkata" autoCapitalize="none" autoCorrect={false} error={e("tz")} />
          <Text variant="label">{t("ayanamsa")}</Text>
          <SegmentedControl<Ayanamsa> scroll value={v.ayanamsa} onChange={(a) => set("ayanamsa", a)}
            segments={[{ value: "lahiri", label: "Lahiri" }, { value: "raman", label: "Raman" }, { value: "krishnamurti", label: "KP" }, { value: "true_chitra", label: "True Chitra" }]} />
          <Text variant="label">{t("node")}</Text>
          <SegmentedControl<NodeType> value={v.node} onChange={(n) => set("node", n)}
            segments={[{ value: "mean", label: t("mean_node") }, { value: "true", label: t("true_node") }]} />
          <TextField label={t("tags")} value={v.tags} onChangeText={(s) => set("tags", s)} />
          <TextField label={t("notes")} value={v.notes} onChangeText={(s) => set("notes", s)} multiline />
        </View>
      )}
      <View style={styles.actions}>
        <Button testID="submit-birth" label={submitLabel ?? t("generate")} onPress={submit} loading={busy} style={styles.flex} />
        {onCancel && <Button label={t("cancel")} variant="light" onPress={onCancel} />}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", gap: spacing.sm },
  flex: { flex: 1 },
  adv: { color: colors.muted, marginBottom: spacing.md },
  actions: { flexDirection: "row", gap: spacing.sm, marginTop: spacing.sm },
});
