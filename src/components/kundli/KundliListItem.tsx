import { memo } from "react";
import { View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Icon, PressableScale, Text } from "@/components/ui";
import { to12h } from "@/domain/time12";
import { makeStyles, radius, spacing, useTheme } from "@/theme";
import type { Kundli } from "@/types/api";

const initials = (name: string) =>
  name.trim().split(/\s+/).filter((w) => /\p{L}/u.test(w[0] ?? "")).slice(0, 2).map((w) => w[0]!.toUpperCase()).join("") || "?";

export const KundliListItem = memo(function KundliListItem({ k, onPress, onLongPress }: {
  k: Kundli; onPress: () => void; onLongPress?: () => void;
}) {
  const s = useStyles();
  const t = useTheme();
  const time = to12h(k.datetime_local.slice(11, 19));
  return (
    <PressableScale onPress={onPress} onLongPress={onLongPress} delayLongPress={350} accessibilityRole="button"
      accessibilityLabel={k.name} accessibilityHint="Long press to delete" testID={`kundli-${k.id}`} scaleTo={0.98}
      style={[s.item, t.shadow]}>
      <LinearGradient colors={t.gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.avatar}>
        <Text weight="bold" style={s.initial}>{initials(k.name)}</Text>
      </LinearGradient>
      <View style={s.who}>
        <Text variant="subheading" numberOfLines={1}>{k.name}</Text>
        <View style={s.meta}>
          <Icon name="calendar-outline" size={13} color={t.colors.muted} />
          <Text variant="small" numberOfLines={1}>{k.datetime_local.slice(0, 10)} · {time.time} {time.meridiem}</Text>
        </View>
        {k.place ? (
          <View style={s.meta}>
            <Icon name="location-outline" size={13} color={t.colors.muted} />
            <Text variant="small" numberOfLines={1} style={s.flex}>{k.place}{k.tags ? ` · ${k.tags}` : ""}</Text>
          </View>
        ) : null}
      </View>
      <Icon name="chevron-forward" size={18} color={t.colors.muted} />
    </PressableScale>
  );
});

const useStyles = makeStyles((t) => ({
  item: {
    flexDirection: "row", alignItems: "center", gap: spacing.md, padding: spacing.md, marginBottom: spacing.sm + 2,
    backgroundColor: t.colors.card, borderRadius: radius.lg, borderWidth: t.dark ? 1 : 0.5, borderColor: t.dark ? t.colors.line : t.colors.lineSoft,
  },
  avatar: { width: 46, height: 46, borderRadius: 23, alignItems: "center", justifyContent: "center" },
  initial: { color: t.colors.onAccent, fontSize: 16 },
  who: { flex: 1, minWidth: 0, gap: 2 },
  meta: { flexDirection: "row", alignItems: "center", gap: 5 },
  flex: { flex: 1 },
}));
