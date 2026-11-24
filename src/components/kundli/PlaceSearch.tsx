/** City search against the engine's offline GeoNames list. Results appear inline below the field. */
import { useState } from "react";
import { ActivityIndicator, Pressable, View } from "react-native";
import { Text, TextField } from "@/components/ui";
import { MIN_PLACE_QUERY, usePlaceSearch } from "@/hooks/usePlaceSearch";
import { useI18n } from "@/i18n/I18nProvider";
import { makeStyles, radius, spacing, useTheme } from "@/theme";
import type { Place } from "@/types/api";

export const placeLabel = (p: Place) => `${p.name}${p.country ? `, ${p.country}` : ""}`;

export function PlaceSearch({ value, onSelect, label, placeholder, error, testID = "place-search" }: {
  value: Place | null; onSelect: (p: Place) => void; label?: string; placeholder?: string; error?: string | null; testID?: string;
}) {
  const styles = useStyles();
  const { colors } = useTheme();
  const { t } = useI18n();
  // While typing we show the draft; otherwise the chosen place (so a new `value` always shows).
  const [draft, setDraft] = useState<string | null>(null);
  const text = draft ?? (value ? placeLabel(value) : "");
  const open = draft !== null;
  const q = usePlaceSearch(text, open);

  const pick = (p: Place) => { onSelect(p); setDraft(null); };
  const typed = text.split(",")[0].trim().length >= MIN_PLACE_QUERY;

  return (
    <View>
      <TextField testID={testID} label={label} value={text} placeholder={placeholder ?? t("place_ph")} error={error}
        autoCorrect={false} autoCapitalize="words"
        onChangeText={setDraft} />
      {open && typed && (
        <View style={styles.list}>
          {q.isFetching && !q.data ? <ActivityIndicator color={colors.accent} style={styles.pad} /> : null}
          {q.isError ? <Text variant="small" style={styles.pad}>{t("engine_down")}</Text> : null}
          {q.data?.length === 0 ? <Text variant="small" style={styles.pad}>{t("no_places")}</Text> : null}
          {q.data?.map((p) => (
            <Pressable key={`${p.name}-${p.lat}-${p.lon}`} onPress={() => pick(p)} accessibilityRole="button"
              testID={`${testID}-item`} style={({ pressed }) => [styles.item, pressed && styles.pressed]}>
              <Text>{p.name} <Text variant="small">{p.country} · {p.tz}</Text></Text>
            </Pressable>
          ))}
        </View>
      )}
      {value && !open ? (
        <Text variant="small" style={styles.info}>{value.lat.toFixed(4)}°, {value.lon.toFixed(4)}° · {value.tz}</Text>
      ) : null}
    </View>
  );
}

const useStyles = makeStyles((t) => ({
  list: { borderWidth: 1, borderColor: t.colors.line, borderRadius: radius.sm, backgroundColor: t.colors.card, marginTop: -spacing.sm, marginBottom: spacing.md },
  item: { paddingHorizontal: spacing.md, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: t.colors.lineSoft },
  pressed: { backgroundColor: t.colors.accentSoft },
  pad: { padding: spacing.md },
  info: { marginTop: -spacing.sm, marginBottom: spacing.md },
}));
