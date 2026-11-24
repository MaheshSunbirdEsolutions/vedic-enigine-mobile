import { Tabs } from "expo-router";
import { LanguageSwitch } from "@/components/LanguageSwitch";
import { TabIcon } from "@/components/TabIcon";
import { tapFeedback } from "@/components/ui";
import { useI18n } from "@/i18n/I18nProvider";
import { navigationTheme, useTheme } from "@/theme";

const headerRight = () => <LanguageSwitch />;

export default function TabLayout() {
  const { t } = useI18n();
  const nav = navigationTheme(useTheme());
  return (
    <Tabs
      screenOptions={{ ...nav.tabBar, ...nav.header, headerRight, sceneStyle: nav.content }}
      screenListeners={{ tabPress: () => tapFeedback("selection") }}
    >
      <Tabs.Screen name="index" options={{
        title: t("nav_home"), headerTitle: "Jyotish Lab",
        tabBarIcon: ({ focused, color }) => <TabIcon name="albums" focused={focused} color={color} />,
      }} />
      <Tabs.Screen name="panchang" options={{
        title: t("nav_panchang"),
        tabBarIcon: ({ focused, color }) => <TabIcon name="sunny" focused={focused} color={color} />,
      }} />
      <Tabs.Screen name="match" options={{
        title: t("nav_match"),
        tabBarIcon: ({ focused, color }) => <TabIcon name="heart" focused={focused} color={color} />,
      }} />
      <Tabs.Screen name="settings" options={{
        title: t("nav_settings"),
        tabBarIcon: ({ focused, color }) => <TabIcon name="settings" focused={focused} color={color} />,
      }} />
    </Tabs>
  );
}
