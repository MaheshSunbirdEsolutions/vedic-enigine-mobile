import { useEffect } from "react";
import { ActivityIndicator, View } from "react-native";
import { useRouter } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { useAppAuth } from "@/auth/useAppAuth";
import { useTheme } from "@/theme";

WebBrowser.maybeCompleteAuthSession();

const FALLBACK_REDIRECT_MS = 250;

/**
 * Fallback route for `/oauth-native-callback` (e.g. web redirects or direct navigation)
 * so Expo Router never flashes the Unmatched Route screen after Google SSO.
 */
export default function OAuthNativeCallbackScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { isConfigured, isLoaded, isSignedIn } = useAppAuth();
  const ready = !isConfigured || isLoaded;

  useEffect(() => {
    if (!ready) return;
    const delay = isSignedIn ? 0 : FALLBACK_REDIRECT_MS;
    const timer = setTimeout(() => {
      router.replace("/(tabs)");
    }, delay);
    return () => clearTimeout(timer);
  }, [ready, isSignedIn, router]);

  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: theme.colors.bg }}>
      <ActivityIndicator size="large" color={theme.colors.accent} />
    </View>
  );
}
