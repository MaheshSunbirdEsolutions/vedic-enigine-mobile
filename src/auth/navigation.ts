import type { useRouter } from "expo-router";

type AppRouter = ReturnType<typeof useRouter>;

export type AuthRouteParams = {
  redirectTo?: string;
  previewParams?: string;
};

/** Returns the user to the main app layout (or requested preview screen) after auth completes. */
export function finishAuthNavigation(router: AppRouter, params: AuthRouteParams): void {
  if (params.previewParams) {
    try {
      const parsed = JSON.parse(params.previewParams) as Record<string, string>;
      router.replace({ pathname: "/kundli/preview", params: parsed });
      return;
    } catch {
      // Ignore malformed preview params and fall back below.
    }
  }
  if (params.redirectTo && params.redirectTo.startsWith("/")) {
    router.replace(params.redirectTo as never);
    return;
  }
  if (router.canGoBack()) {
    router.back();
    return;
  }
  router.replace("/(tabs)");
}
