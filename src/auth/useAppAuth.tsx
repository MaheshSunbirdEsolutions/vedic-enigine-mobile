import { createContext, createElement, useContext, useMemo, type ReactNode } from "react";
import { useAuth, useUser } from "@clerk/expo";

import type { GetTokenOptions } from "./tokenBridge";

export type AppAuthState = {
  isConfigured: boolean;
  isLoaded: boolean;
  isSignedIn: boolean;
  userId: string | null;
  email: string | null;
  fullName: string | null;
  getToken: (opts?: GetTokenOptions) => Promise<string | null>;
  signOut: () => Promise<void>;
};

const FALLBACK_AUTH: AppAuthState = {
  isConfigured: false,
  isLoaded: true,
  isSignedIn: false,
  userId: null,
  email: null,
  fullName: null,
  getToken: async () => null,
  signOut: async () => {},
};

export const AppAuthContext = createContext<AppAuthState | null>(null);

/** Bridges Clerk hooks into AppAuthContext (must render inside ClerkProvider). */
export function ClerkAppAuthProvider({ children }: { children: ReactNode }) {
  const { isLoaded, isSignedIn, userId, getToken, signOut } = useAuth();
  const { user } = useUser();

  const value = useMemo<AppAuthState>(() => {
    const email = user?.primaryEmailAddress?.emailAddress ?? user?.emailAddresses?.[0]?.emailAddress ?? null;
    const fullName = user?.fullName ?? null;
    return {
      isConfigured: true,
      isLoaded,
      isSignedIn: !!isSignedIn,
      userId: userId ?? null,
      email,
      fullName,
      getToken: async (opts) => (await getToken(opts)) ?? null,
      signOut: async () => {
        await signOut();
      },
    };
  }, [getToken, isLoaded, isSignedIn, signOut, user, userId]);

  return createElement(AppAuthContext.Provider, { value }, children);
}

/** Provides explicit auth state for tests or unconfigured environments. */
export function StaticAuthProvider({ value, children }: { value?: Partial<AppAuthState>; children: ReactNode }) {
  const merged = useMemo<AppAuthState>(() => ({ ...FALLBACK_AUTH, ...value }), [value]);
  return createElement(AppAuthContext.Provider, { value: merged }, children);
}

export function useAppAuth(): AppAuthState {
  return useContext(AppAuthContext) ?? FALLBACK_AUTH;
}
