import { Tabs } from "expo-router";
import { Text, type ColorValue } from "react-native";
import { useI18n } from "@/i18n/I18nProvider";
import { colors } from "@/theme";

function TabIcon({ glyph, color }: { glyph: string; color: ColorValue }) {
  return <Text style={{ color, fontSize: 18 }}>{glyph}</Text>;
}
const icon = (glyph: string) => function Icon({ color }: { color: ColorValue }) { return <TabIcon glyph={glyph} color={color} />; };

export default function TabLayout() {
  const { t } = useI18n();
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.muted,
        tabBarStyle: { backgroundColor: colors.card, borderTopColor: colors.line },
        headerStyle: { backgroundColor: colors.card },
        headerTitleStyle: { color: colors.ink, fontWeight: "600" },
        sceneStyle: { backgroundColor: colors.bg },
      }}
    >
      <Tabs.Screen name="index" options={{ title: t("nav_home"), headerTitle: "Jyotish Lab", tabBarIcon: icon("ॐ") }} />
      <Tabs.Screen name="panchang" options={{ title: t("nav_panchang"), tabBarIcon: icon("☀") }} />
      <Tabs.Screen name="match" options={{ title: t("nav_match"), tabBarIcon: icon("♥") }} />
      <Tabs.Screen name="settings" options={{ title: t("nav_settings"), tabBarIcon: icon("⚙") }} />
    </Tabs>
  );
}
