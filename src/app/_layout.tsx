/** Root: providers (query cache, i18n, toast, safe area) and the stack navigator. */
import { useState } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { ToastProvider } from "@/components/ui";
import { I18nProvider, useI18n } from "@/i18n/I18nProvider";
import { createQueryClient } from "@/state/queryClient";
import { colors } from "@/theme";

export const unstable_settings = { anchor: "(tabs)" };

function RootStack() {
  const { t } = useI18n();
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.card },
        headerTintColor: colors.accent,
        headerTitleStyle: { color: colors.ink, fontWeight: "600" },
        headerTransparent: false,
        contentStyle: { backgroundColor: colors.bg },
      }}
    >
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="kundli/new" options={{ title: t("new_kundli") }} />
      <Stack.Screen name="kundli/preview" options={{ title: t("new_kundli") }} />
      <Stack.Screen name="kundli/[id]" options={{ title: t("nav_home") }} />
    </Stack>
  );
}

export default function RootLayout() {
  const [queryClient] = useState(createQueryClient);
  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <I18nProvider>
          <ToastProvider>
            <StatusBar style="dark" />
            <RootStack />
          </ToastProvider>
        </I18nProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
