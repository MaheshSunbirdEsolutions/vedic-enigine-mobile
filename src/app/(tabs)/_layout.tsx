import { Tabs } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BrandTitle } from "@/components/BrandTitle";
import { HeaderActions } from "@/components/HeaderActions";
import { TabIcon } from "@/components/TabIcon";
import { tapFeedback } from "@/components/ui";
import { useI18n } from "@/i18n/I18nProvider";
import { navigationTheme, useTheme } from "@/theme";

const headerRight = () => <HeaderActions />;
const brandTitle = () => <BrandTitle />;

export default function TabLayout() {
  const { t } = useI18n();
  const nav = navigationTheme(useTheme());
  // Keep the bar above the phone's gesture bar / 3-button navigation (Android edge-to-edge, iOS home indicator).
  const insets = useSafeAreaInsets();
  // 66 = pill icon (30) + label line (17–19) + padding; the device inset is added on top.
  const bottomPad = Math.max(insets.bottom, 8);
  const tabBarStyle = [nav.tabBar.tabBarStyle, { height: 66 + bottomPad, paddingBottom: bottomPad }];
  return (
    <Tabs
      screenOptions={{ ...nav.tabBar, tabBarStyle, ...nav.header, headerRight, sceneStyle: nav.content }}
      screenListeners={{ tabPress: () => tapFeedback("selection") }}
    >
      <Tabs.Screen name="index" options={{
        title: t("nav_home"), headerTitle: brandTitle,
        tabBarIcon: ({ focused, color }) => <TabIcon name="albums" focused={focused} color={color} />,
      }} />
      <Tabs.Screen name="horoscope" options={{
        title: t("nav_horoscope"),
        tabBarIcon: ({ focused, color }) => <TabIcon name="sparkles" focused={focused} color={color} />,
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
