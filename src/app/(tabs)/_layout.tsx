import { Tabs } from "expo-router";
import { Text, type ColorValue } from "react-native";
import { useI18n } from "@/i18n/I18nProvider";
import { navigationTheme, useTheme } from "@/theme";

function TabIcon({ glyph, color }: { glyph: string; color: ColorValue }) {
  return <Text style={{ color, fontSize: 18 }}>{glyph}</Text>;
}
const icon = (glyph: string) => function Icon({ color }: { color: ColorValue }) { return <TabIcon glyph={glyph} color={color} />; };

export default function TabLayout() {
  const { t } = useI18n();
  const nav = navigationTheme(useTheme());
  return (
    <Tabs screenOptions={{ ...nav.tabBar, ...nav.header, sceneStyle: nav.content }}>
      <Tabs.Screen name="index" options={{ title: t("nav_home"), headerTitle: "Jyotish Lab", tabBarIcon: icon("ॐ") }} />
      <Tabs.Screen name="panchang" options={{ title: t("nav_panchang"), tabBarIcon: icon("☀") }} />
      <Tabs.Screen name="match" options={{ title: t("nav_match"), tabBarIcon: icon("♥") }} />
      <Tabs.Screen name="settings" options={{ title: t("nav_settings"), tabBarIcon: icon("⚙") }} />
    </Tabs>
  );
}
