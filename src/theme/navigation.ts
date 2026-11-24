import { motion } from "./tokens";
import type { Theme } from "./theme";

/** Header, tab bar and transition options for Expo Router navigators. */
export const navigationTheme = (t: Theme) => ({
  header: {
    headerStyle: { backgroundColor: t.colors.bg },
    headerTintColor: t.colors.accent,
    headerTitleStyle: { color: t.colors.ink, fontFamily: t.fonts.display, fontSize: 19 },
    headerShadowVisible: false,
  },
  stack: {
    animation: "ios_from_right" as const,
    animationDuration: motion.slow,
    gestureEnabled: true,
  },
  tabBar: {
    tabBarActiveTintColor: t.colors.accent,
    tabBarInactiveTintColor: t.colors.muted,
    tabBarStyle: { backgroundColor: t.colors.card, borderTopColor: t.colors.line, borderTopWidth: 0.5, paddingTop: 8 },
    tabBarLabelStyle: { fontFamily: t.fonts.semibold, fontSize: 10, lineHeight: Math.round(14 * t.fonts.lineScale), marginTop: 2 },
    tabBarAllowFontScaling: false,
    animation: "shift" as const,
  },
  content: { backgroundColor: t.colors.bg },
});
