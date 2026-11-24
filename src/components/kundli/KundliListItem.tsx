import { memo } from "react";
import { Pressable, View } from "react-native";
import { Text } from "@/components/ui";
import { describeBirth } from "@/domain/birth";
import { makeStyles, radius, spacing } from "@/theme";
import type { Kundli } from "@/types/api";

export const KundliListItem = memo(function KundliListItem({ k, onPress, onLongPress }: {
  k: Kundli; onPress: () => void; onLongPress?: () => void;
}) {
  const styles = useStyles();
  return (
    <Pressable onPress={onPress} onLongPress={onLongPress} accessibilityRole="button" testID={`kundli-${k.id}`}
      style={({ pressed }) => [styles.item, pressed && styles.pressed]}>
      <View style={styles.avatar}><Text style={styles.initial}>{(k.name || "?").slice(0, 1).toUpperCase()}</Text></View>
      <View style={styles.who}>
        <Text variant="subheading" numberOfLines={1}>{k.name}</Text>
        <Text variant="small" numberOfLines={1}>{describeBirth(k)}{k.tags ? ` · ${k.tags}` : ""}</Text>
      </View>
      <Text style={styles.chev}>›</Text>
    </Pressable>
  );
});

const useStyles = makeStyles((t) => ({
  item: {
    flexDirection: "row", alignItems: "center", gap: spacing.md, padding: spacing.md, marginBottom: spacing.sm,
    backgroundColor: t.colors.card, borderRadius: radius.md, borderWidth: 1, borderColor: t.colors.line,
  },
  pressed: { backgroundColor: t.colors.panel },
  avatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: t.colors.accent, alignItems: "center", justifyContent: "center" },
  initial: { color: t.colors.onAccent, fontWeight: "700" },
  who: { flex: 1, minWidth: 0 },
  chev: { fontSize: 24, color: t.colors.muted },
}));
