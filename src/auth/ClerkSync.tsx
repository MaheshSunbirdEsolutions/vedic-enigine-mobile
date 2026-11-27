import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { engineApi, queryKeys } from "@/api";
import { setAuthTokenGetter } from "./tokenBridge";
import { useAppAuth } from "./useAppAuth";

/**
 * Keeps the HTTP client token getter, backend user registration (GET /me),
 * and user-scoped React Query cache synchronized with Clerk auth state.
 */
export function ClerkSync() {
  const { isConfigured, isLoaded, isSignedIn, userId, getToken } = useAppAuth();
  const queryClient = useQueryClient();
  const prevUserIdRef = useRef<string | null>(null);
  const syncedUserIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!isConfigured) {
      setAuthTokenGetter(null);
      return;
    }
    setAuthTokenGetter(isSignedIn ? getToken : null);
    return () => {
      setAuthTokenGetter(null);
    };
  }, [getToken, isConfigured, isSignedIn]);

  useEffect(() => {
    if (!isConfigured || !isLoaded) return;

    const prevUserId = prevUserIdRef.current;
    if (prevUserId && prevUserId !== userId) {
      queryClient.removeQueries({ queryKey: queryKeys.kundlis.all });
      queryClient.removeQueries({ queryKey: queryKeys.me });
    }
    prevUserIdRef.current = userId;

    if (!isSignedIn || !userId) {
      syncedUserIdRef.current = null;
      return;
    }

    if (syncedUserIdRef.current === userId) return;

    let cancelled = false;
    (async () => {
      const token = await getToken();
      if (!token || cancelled) return;
      const profile = await engineApi.auth.me();
      if (cancelled) return;
      syncedUserIdRef.current = userId;
      queryClient.setQueryData(queryKeys.me, profile);
      queryClient.invalidateQueries({ queryKey: queryKeys.kundlis.all }).catch(() => {});
    })().catch(() => {
      // Non-fatal: retry on next session update or explicit profile read.
    });

    return () => {
      cancelled = true;
    };
  }, [getToken, isConfigured, isLoaded, isSignedIn, queryClient, userId]);

  return null;
}
