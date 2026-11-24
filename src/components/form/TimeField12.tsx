/**
 * 12-hour time input: "hh:mm" + AM/PM, and the native clock in 12-hour mode on iOS/Android.
 * The form stores 12-hour text and the meridiem; conversion to 24-hour happens in domain/time12.
 */
import { useState } from "react";
import { Platform, StyleSheet, View } from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Button, SegmentedControl, TextField } from "@/components/ui";
import { toPickerDate12 } from "@/domain/pickers";
import { to12h, type Meridiem } from "@/domain/time12";
import { useI18n } from "@/i18n/I18nProvider";
import { useTheme } from "@/theme";

export type TimeField12Props = {
  label: string;
  time: string;
  meridiem: Meridiem;
  onChange: (time: string, meridiem: Meridiem) => void;
  onBlur?: () => void;
  error?: string | null;
  testID?: string;
};

export function TimeField12({ label, time, meridiem, onChange, onBlur, error, testID }: TimeField12Props) {
  const { t } = useI18n();
  const theme = useTheme();
  const [open, setOpen] = useState(false);
  const native = Platform.OS === "ios" || Platform.OS === "android";
  return (
    <View>
      <View style={styles.row}>
        <View style={styles.flex}>
          <TextField testID={testID} label={label} value={time} onChangeText={(s) => onChange(s, meridiem)} onBlur={onBlur}
            error={error} placeholder={t("time_ph12")} autoCorrect={false} keyboardType="numbers-and-punctuation" maxLength={8} />
        </View>
        <View style={styles.ampm}>
          <SegmentedControl<Meridiem> testID={testID ? `${testID}-meridiem` : undefined} value={meridiem}
            onChange={(m) => onChange(time, m)} segments={[{ value: "AM", label: "AM" }, { value: "PM", label: "PM" }]} />
        </View>
      </View>
      {native && <Button variant="light" label={t("pick_time")} onPress={() => setOpen(true)} style={styles.pick} />}
      {native && open && (
        <DateTimePicker
          value={toPickerDate12("2000-01-01", time, meridiem)}
          mode="time"
          is24Hour={false}
          display={Platform.OS === "ios" ? "spinner" : "clock"}
          themeVariant={theme.dark ? "dark" : "light"}
          accentColor={theme.colors.accent}
          onValueChange={(_e, d) => {
            setOpen(Platform.OS === "ios");
            const p = to12h(`${d.getHours()}:${String(d.getMinutes()).padStart(2, "0")}:00`);
            onChange(p.time, p.meridiem);
            onBlur?.();
          }}
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
  ampm: { width: 120, marginTop: 22 },
  pick: { alignSelf: "flex-start", marginTop: -4, marginBottom: 12 },
});
