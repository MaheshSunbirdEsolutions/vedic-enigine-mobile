/** Root: providers (theme, query cache, i18n, toast, safe area), splash and the stack navigator. */
import { useEffect, useState } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import * as SystemUI from "expo-system-ui";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { ToastProvider } from "@/components/ui";
import { I18nProvider, useI18n } from "@/i18n/I18nProvider";
import { usePreferences, usePreferencesHydrated } from "@/state/preferences";
import { createQueryClient } from "@/state/queryClient";
import { navigationTheme, ThemeProvider, useTheme } from "@/theme";

export const unstable_settings = { anchor: "(tabs)" };

// Keep the native splash up until saved preferences (language, colour scheme) are restored,
// so the first frame is already in the right language and colours.
SplashScreen.preventAutoHideAsync().catch(() => {});

function RootStack() {
  const { t } = useI18n();
  const hydrated = usePreferencesHydrated();
  const theme = useTheme();
  const nav = navigationTheme(theme);

  useEffect(() => {
    // Root view colour behind screens (no white flash in dark mode).
    SystemUI.setBackgroundColorAsync(theme.colors.bg).catch(() => {});
  }, [theme]);
  useEffect(() => {
    if (hydrated) SplashScreen.hideAsync().catch(() => {});
  }, [hydrated]);

  return (
    <>
      <StatusBar style={theme.dark ? "light" : "dark"} />
      <Stack screenOptions={{ ...nav.header, headerTransparent: false, contentStyle: nav.content }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="kundli/new" options={{ title: t("new_kundli") }} />
        <Stack.Screen name="kundli/preview" options={{ title: t("new_kundli") }} />
        <Stack.Screen name="kundli/[id]" options={{ title: t("nav_home") }} />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  const [queryClient] = useState(createQueryClient);
  const colorScheme = usePreferences((s) => s.colorScheme);
  return (
    <SafeAreaProvider>
      <ThemeProvider preference={colorScheme}>
        <QueryClientProvider client={queryClient}>
          <I18nProvider>
            <ToastProvider>
              <RootStack />
            </ToastProvider>
          </I18nProvider>
        </QueryClientProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
