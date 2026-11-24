/**
 * Date or time input: a typed field (works everywhere, including web) plus a native
 * picker button on iOS/Android.
 */
import { useState } from "react";
import { Platform, StyleSheet, View } from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Button, TextField } from "@/components/ui";
import { pickerToDate, pickerToTime, toPickerDate } from "@/domain/pickers";
import { useI18n } from "@/i18n/I18nProvider";

export function DateTimeField({ mode, label, date, time, onChange, error, testID }: {
  mode: "date" | "time";
  label: string;
  date: string;
  time: string;
  onChange: (value: string) => void;
  error?: string | null;
  testID?: string;
}) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const native = Platform.OS === "ios" || Platform.OS === "android";
  const value = mode === "date" ? date : time;
  return (
    <View>
      <View style={styles.row}>
        <View style={styles.flex}>
          <TextField testID={testID} label={label} value={value} onChangeText={onChange} error={error}
            placeholder={t(mode === "date" ? "date_ph" : "time_ph")} autoCorrect={false}
            keyboardType="numbers-and-punctuation" maxLength={mode === "date" ? 10 : 8} />
        </View>
        {native && (
          <Button variant="light" label={t(mode === "date" ? "pick_date" : "pick_time")} onPress={() => setOpen(true)} style={styles.pick} />
        )}
      </View>
      {native && open && (
        <DateTimePicker
          value={toPickerDate(date, time)}
          mode={mode}
          is24Hour
          display={Platform.OS === "ios" ? "spinner" : "default"}
          onValueChange={(_e, d) => { setOpen(Platform.OS === "ios"); onChange(mode === "date" ? pickerToDate(d) : pickerToTime(d)); }}
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
