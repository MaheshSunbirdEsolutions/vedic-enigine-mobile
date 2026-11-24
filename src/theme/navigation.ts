import type { Theme } from "./theme";

/** Header / tab bar colours for Expo Router navigators. */
export const navigationTheme = (t: Theme) => ({
  header: {
    headerStyle: { backgroundColor: t.colors.card },
    headerTintColor: t.colors.accent,
    headerTitleStyle: { color: t.colors.ink, fontWeight: "600" as const },
    headerShadowVisible: !t.dark,
  },
  tabBar: {
    tabBarActiveTintColor: t.colors.accent,
    tabBarInactiveTintColor: t.colors.muted,
    tabBarStyle: { backgroundColor: t.colors.card, borderTopColor: t.colors.line },
  },
  content: { backgroundColor: t.colors.bg },
});
