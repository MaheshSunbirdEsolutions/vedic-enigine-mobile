/**
 * Birth details form: react-hook-form + zod.
 *
 * - Rules live in domain/birthForm (birthFormSchema); this component only binds fields.
 * - mode "onTouched": a field shows its error after the user leaves it (or on submit).
 * - reValidateMode "onChange": once shown, an error disappears as soon as the value is valid.
 * - Picking a place fills lat/lon/zone and re-validates them, clearing the place error.
 */
import { useState } from "react";
import { Pressable, View } from "react-native";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "expo-router";
import { Controller, useForm, type FieldErrors } from "react-hook-form";
import { useAppAuth } from "@/auth/useAppAuth";
import { DateField } from "@/components/form/DateField";
import { TimeField12 } from "@/components/form/TimeField12";
import { Button, Icon, SegmentedControl, Text, TextField } from "@/components/ui";
import { birthFormSchema, defaultBirthValues, placeFields, toKundli, type BirthFormValues } from "@/domain/birthForm";
import { kundliToParams } from "@/domain/kundliParams";
import { useI18n } from "@/i18n/I18nProvider";
import { makeStyles, spacing, useTheme } from "@/theme";
import type { Ayanamsa, Gender, Kundli, NodeType } from "@/types/api";
import { PlaceSearch } from "./PlaceSearch";

export type BirthFormProps = {
  initial?: Partial<Kundli>;
  onSubmit: (k: Kundli) => void;
  submitLabel?: string;
  onCancel?: () => void;
  busy?: boolean;
  /** Require signed-in session before generating; defaults to true when creating a new kundli. */
  requireAuth?: boolean;
};

const COORD_FIELDS = ["lat", "lon", "tz"] as const;

export function BirthForm({ initial, onSubmit, submitLabel, onCancel, busy, requireAuth }: BirthFormProps) {
  const { t } = useI18n();
  const s = useStyles();
  const theme = useTheme();
  const router = useRouter();
  const { isLoaded, isSignedIn } = useAppAuth();
  const mustSignIn = requireAuth ?? !initial?.id;
  const [advanced, setAdvanced] = useState(false);
  const { control, getValues, handleSubmit, setValue, trigger, formState: { errors, isSubmitted } } = useForm<BirthFormValues>({
    resolver: zodResolver(birthFormSchema),
    defaultValues: defaultBirthValues(initial),
    mode: "onTouched",
    reValidateMode: "onChange",
  });
  const msg = (k: keyof BirthFormValues) => (errors[k]?.message ? t(errors[k]!.message!) : null);

  // Coordinates and the place summary error depend on each other: re-check them together.
  const revalidateCoords = () => { if (isSubmitted || errors.place) void trigger(["place", ...COORD_FIELDS]); };

  const onInvalid = (e: FieldErrors<BirthFormValues>) => {
    if (COORD_FIELDS.some((k) => e[k]) && !e.place) setAdvanced(true);
  };

  const onSubmitPress = () => {
    if (mustSignIn && !isSignedIn) {
      if (!isLoaded) return;
      const parsed = birthFormSchema.safeParse(getValues());
      const params = parsed.success
        ? { previewParams: JSON.stringify(kundliToParams(toKundli(parsed.data, initial?.id))) }
        : undefined;
      router.push(params ? { pathname: "/(auth)/sign-in", params } : "/(auth)/sign-in");
      return;
    }
    void handleSubmit((v) => onSubmit(toKundli(v, initial?.id)), onInvalid)();
  };

  return (
    <View testID="birth-form">
      <Controller control={control} name="name" render={({ field }) => (
        <TextField testID="field-name" label={t("name")} value={field.value} onChangeText={field.onChange} onBlur={field.onBlur}
          placeholder={t("name_ph")} error={msg("name")} />
      )} />

      <Text variant="label">{t("gender")}</Text>
      <Controller control={control} name="gender" render={({ field }) => (
        <SegmentedControl<Gender>
          value={field.value}
          onChange={field.onChange}
          segments={[{ value: "male", label: t("male") }, { value: "female", label: t("female") }, { value: "other", label: t("other") }]}
        />
      )} />

      <Controller control={control} name="date" render={({ field }) => (
        <DateField testID="field-date" label={t("dob")} value={field.value} onChange={field.onChange} onBlur={field.onBlur} error={msg("date")} />
      )} />

      <Controller control={control} name="time" render={({ field }) => (
        <Controller control={control} name="meridiem" render={({ field: mer }) => (
          <TimeField12 testID="field-time" label={t("tob")} time={field.value} meridiem={mer.value}
            onChange={(time, m) => { field.onChange(time); if (m !== mer.value) mer.onChange(m); }}
            onBlur={field.onBlur} error={msg("time")} />
        )} />
      )} />

      <Controller control={control} name="place" render={({ field }) => (
        <PlaceSearch label={t("pob")} value={field.value} error={msg("place")}
          onSelect={(p) => {
            const f = placeFields(p);
            field.onChange(f.place);
            for (const k of COORD_FIELDS) setValue(k, f[k], { shouldDirty: true, shouldValidate: !!errors[k] });
            void trigger(["place", ...COORD_FIELDS.filter((k) => errors[k])]);
          }} />
      )} />

      <Pressable onPress={() => setAdvanced((a) => !a)} accessibilityRole="button" testID="toggle-advanced">
        <View style={s.advRow}>
          <Icon name={advanced ? "chevron-down" : "chevron-forward"} size={16} color={theme.colors.muted} />
          <Text variant="muted" weight="medium">{t("advanced")}</Text>
        </View>
      </Pressable>
      {advanced && (
        <View>
          <View style={s.row}>
            {(["lat", "lon"] as const).map((k) => (
              <View key={k} style={s.flex}>
                <Controller control={control} name={k} render={({ field }) => (
                  <TextField testID={`field-${k}`} label={t(k === "lat" ? "latitude" : "longitude")} value={field.value}
                    onChangeText={(v) => { field.onChange(v); revalidateCoords(); }} onBlur={field.onBlur}
                    keyboardType="numbers-and-punctuation" error={msg(k)} />
                )} />
              </View>
            ))}
          </View>
          <Controller control={control} name="tz" render={({ field }) => (
            <TextField testID="field-tz" label={t("timezone")} value={field.value} placeholder="Asia/Kolkata" autoCapitalize="none" autoCorrect={false}
              onChangeText={(v) => { field.onChange(v); revalidateCoords(); }} onBlur={field.onBlur} error={msg("tz")} />
          )} />
          <Text variant="label">{t("ayanamsa")}</Text>
          <Controller control={control} name="ayanamsa" render={({ field }) => (
            <SegmentedControl<Ayanamsa> scroll value={field.value} onChange={field.onChange}
              segments={[{ value: "lahiri", label: "Lahiri" }, { value: "raman", label: "Raman" }, { value: "krishnamurti", label: "KP" }, { value: "true_chitra", label: "True Chitra" }]} />
          )} />
          <Text variant="label">{t("node")}</Text>
          <Controller control={control} name="node" render={({ field }) => (
            <SegmentedControl<NodeType> value={field.value} onChange={field.onChange}
              segments={[{ value: "mean", label: t("mean_node") }, { value: "true", label: t("true_node") }]} />
          )} />
          <Controller control={control} name="tags" render={({ field }) => (
            <TextField label={t("tags")} value={field.value} onChangeText={field.onChange} onBlur={field.onBlur} />
          )} />
          <Controller control={control} name="notes" render={({ field }) => (
            <TextField label={t("notes")} value={field.value} onChangeText={field.onChange} onBlur={field.onBlur} multiline />
          )} />
        </View>
      )}
      <View style={s.actions}>
        <Button testID="submit-birth" label={submitLabel ?? t("generate")} loading={busy} style={s.flex}
          onPress={onSubmitPress} />
        {onCancel && <Button label={t("cancel")} variant="secondary" onPress={onCancel} />}
      </View>
    </View>
  );
}

const useStyles = makeStyles(() => ({
  row: { flexDirection: "row", gap: spacing.sm },
  flex: { flex: 1 },
  advRow: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: spacing.md, paddingVertical: 4 },
  actions: { flexDirection: "row", gap: spacing.sm, marginTop: spacing.sm },
}));
