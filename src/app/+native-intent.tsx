const OAUTH_CALLBACK_SEGMENT = "oauth-native-callback";

function isOAuthCallbackPath(rawPath: string): boolean {
  try {
    const parsed = new URL(rawPath, "https://app.local");
    return (
      parsed.hostname === OAUTH_CALLBACK_SEGMENT ||
      parsed.pathname === `/${OAUTH_CALLBACK_SEGMENT}` ||
      parsed.pathname.endsWith(`/${OAUTH_CALLBACK_SEGMENT}`)
    );
  } catch {
    return rawPath.split(/[?#]/)[0]?.endsWith(OAUTH_CALLBACK_SEGMENT) ?? false;
  }
}

/**
 * Intercepts native OAuth deep links before Expo Router renders `+not-found`
 * while `openAuthSessionAsync` / Clerk SSO finishes activating the session.
 */
export function redirectSystemPath({ path, initial }: { path: string; initial: boolean }): string | null {
  try {
    if (typeof path !== "string") {
      return "/";
    }
    if (isOAuthCallbackPath(path)) {
      return initial ? "/" : null;
    }
    return path;
  } catch {
    return "/";
  }
}
