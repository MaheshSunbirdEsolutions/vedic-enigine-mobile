/**
 * Root: fonts, providers (query cache, i18n, theme, keyboard, toast, safe area), splash,
 * and the stack navigator with slide transitions and the language switch in every header.
 */
import { useEffect, useState, type ReactNode } from "react";
import { ClerkProvider } from "@clerk/expo";
import { tokenCache } from "@clerk/expo/token-cache";
import { Fraunces_600SemiBold } from "@expo-google-fonts/fraunces";
import { Mukta_400Regular, Mukta_500Medium, Mukta_600SemiBold, Mukta_700Bold } from "@expo-google-fonts/mukta";
import {
  PlusJakartaSans_400Regular, PlusJakartaSans_500Medium, PlusJakartaSans_600SemiBold, PlusJakartaSans_700Bold,
} from "@expo-google-fonts/plus-jakarta-sans";
import { QueryClientProvider } from "@tanstack/react-query";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import * as SystemUI from "expo-system-ui";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { ClerkSync } from "@/auth/ClerkSync";
import { ClerkAppAuthProvider } from "@/auth/useAppAuth";
import { HeaderActions } from "@/components/HeaderActions";
import { ToastProvider } from "@/components/ui";
import { env } from "@/config/env";
import { I18nProvider, useI18n } from "@/i18n/I18nProvider";
import { usePreferences, usePreferencesHydrated } from "@/state/preferences";
import { createQueryClient } from "@/state/queryClient";
import { navigationTheme, ThemeProvider, useTheme } from "@/theme";

export const unstable_settings = { anchor: "(tabs)" };

// Keep the native splash up until fonts and saved preferences (language, colour scheme) are
// ready, so the first frame already has the right type, language and colours.
SplashScreen.preventAutoHideAsync().catch(() => {});

const FONTS = {
  Fraunces_600SemiBold,
  PlusJakartaSans_400Regular, PlusJakartaSans_500Medium, PlusJakartaSans_600SemiBold, PlusJakartaSans_700Bold,
  Mukta_400Regular, Mukta_500Medium, Mukta_600SemiBold, Mukta_700Bold,
};

const headerRight = () => <HeaderActions />;

/** Theme follows the saved colour preference and the current language's script. */
function ThemedApp({ children }: { children: ReactNode }) {
  const colorScheme = usePreferences((s) => s.colorScheme);
  const { lang } = useI18n();
  return <ThemeProvider preference={colorScheme} script={lang === "hi" ? "devanagari" : "latin"}>{children}</ThemeProvider>;
}

function RootStack({ ready }: { ready: boolean }) {
  const { t } = useI18n();
  const theme = useTheme();
  const nav = navigationTheme(theme);

  useEffect(() => {
    // Root view colour behind screens (no white flash in dark mode).
    SystemUI.setBackgroundColorAsync(theme.colors.bg).catch(() => {});
  }, [theme]);
  useEffect(() => {
    if (ready) SplashScreen.hideAsync().catch(() => {});
  }, [ready]);

  // Wait until fonts and saved preferences are ready before mounting screens, so Yoga never
  // measures and caches text bounds with the fallback system font on Android.
  if (!ready) return null;

  return (
    <>
      <StatusBar style={theme.dark ? "light" : "dark"} />
      <Stack screenOptions={{ ...nav.header, ...nav.stack, headerRight, contentStyle: nav.content, headerBackButtonDisplayMode: "minimal" }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="(auth)/sign-in" options={{ headerShown: false }} />
        <Stack.Screen name="(auth)/sign-up" options={{ headerShown: false }} />
        <Stack.Screen name="oauth-native-callback" options={{ headerShown: false, animation: "none" }} />
        <Stack.Screen name="kundli/new" options={{ title: t("new_kundli") }} />
        <Stack.Screen name="kundli/preview" options={{ title: t("new_kundli") }} />
        <Stack.Screen name="kundli/[id]" options={{ title: t("nav_home") }} />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  const [queryClient] = useState(createQueryClient);
  const [fontsLoaded, fontError] = useFonts(FONTS);
  const hydrated = usePreferencesHydrated();
  // A font that fails to load falls back to the system font; it never blocks the app.
  const ready = hydrated && (fontsLoaded || !!fontError);

  const tree = (
    <QueryClientProvider client={queryClient}>
      <ClerkSync />
      <I18nProvider>
        <ThemedApp>
          <ToastProvider>
            <RootStack ready={ready} />
          </ToastProvider>
        </ThemedApp>
      </I18nProvider>
    </QueryClientProvider>
  );

  return (
    <SafeAreaProvider>
      <KeyboardProvider>
        {env.clerkPublishableKey ? (
          <ClerkProvider publishableKey={env.clerkPublishableKey} tokenCache={tokenCache}>
            <ClerkAppAuthProvider>{tree}</ClerkAppAuthProvider>
          </ClerkProvider>
        ) : (
          tree
        )}
      </KeyboardProvider>
    </SafeAreaProvider>
  );
}
