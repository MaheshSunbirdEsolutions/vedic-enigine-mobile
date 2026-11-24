/** Date input: typed "YYYY-MM-DD" (works everywhere, including web) plus a native calendar on iOS/Android. */
import { useState } from "react";
import { Platform, StyleSheet, View } from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Button, TextField } from "@/components/ui";
import { pickerToDate, toPickerDate } from "@/domain/pickers";
import { useI18n } from "@/i18n/I18nProvider";
import { useTheme } from "@/theme";

export type DateFieldProps = {
  label: string;
  value: string;
  onChange: (v: string) => void;
  onBlur?: () => void;
  error?: string | null;
  testID?: string;
};

export function DateField({ label, value, onChange, onBlur, error, testID }: DateFieldProps) {
  const { t } = useI18n();
  const theme = useTheme();
  const [open, setOpen] = useState(false);
  const native = Platform.OS === "ios" || Platform.OS === "android";
  return (
    <View>
      <View style={styles.row}>
        <View style={styles.flex}>
          <TextField testID={testID} label={label} value={value} onChangeText={onChange} onBlur={onBlur} error={error}
            placeholder={t("date_ph")} autoCorrect={false} keyboardType="numbers-and-punctuation" maxLength={10} />
        </View>
        {native && <Button variant="secondary" label={t("pick_date")} onPress={() => setOpen(true)} style={styles.pick} />}
      </View>
      {native && open && (
        <DateTimePicker
          value={toPickerDate(value, "12:00")}
          mode="date"
          display={Platform.OS === "ios" ? "inline" : "default"}
          themeVariant={theme.dark ? "dark" : "light"}
          accentColor={theme.colors.accent}
          onValueChange={(_e, d) => { setOpen(Platform.OS === "ios"); onChange(pickerToDate(d)); onBlur?.(); }}
          onDismiss={() => setOpen(false)}
        />
      )}
      {native && open && Platform.OS === "ios" && <Button variant="ghost" label="OK" onPress={() => setOpen(false)} />}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "flex-start", gap: 8 },
  flex: { flex: 1 },
  pick: { marginTop: 22 },
});
