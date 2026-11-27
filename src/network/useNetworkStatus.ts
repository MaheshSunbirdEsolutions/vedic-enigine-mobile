import { useCallback, useEffect, useState } from "react";
import { AppState } from "react-native";
import * as Network from "expo-network";

/** Returns true once native state explicitly reports no connectivity or unreachable internet. */
export function isNetworkOffline(state: Network.NetworkState | null | undefined): boolean {
  if (!state) return false;
  return (
    state.isConnected === false ||
    state.isInternetReachable === false ||
    state.type === Network.NetworkStateType.NONE
  );
}

/**
 * Tracks live device network connectivity across the app, re-checking when the app
 * returns to the foreground or when the user taps Refresh on the offline screen.
 */
export function useNetworkStatus() {
  const [state, setState] = useState<Network.NetworkState | null>(null);
  const [checking, setChecking] = useState(false);
  const [stillOffline, setStillOffline] = useState(false);

  const offline = isNetworkOffline(state);

  useEffect(() => {
    let active = true;

    const applyState = (next: Network.NetworkState) => {
      if (!active) return;
      setState(next);
      if (!isNetworkOffline(next)) {
        setStillOffline(false);
      }
    };

    const checkOnce = async () => {
      try {
        applyState(await Network.getNetworkStateAsync());
      } catch {
        // Ignore transient native read errors; keep current status.
      }
    };

    void checkOnce();
    const netSub = Network.addNetworkStateListener(applyState);
    const appSub = AppState.addEventListener("change", (nextAppState) => {
      if (nextAppState === "active") {
        void checkOnce();
      }
    });

    return () => {
      active = false;
      netSub.remove();
      appSub.remove();
    };
  }, []);

  const refresh = useCallback(async () => {
    setChecking(true);
    setStillOffline(false);
    try {
      const next = await Network.getNetworkStateAsync();
      setState(next);
      const nextOffline = isNetworkOffline(next);
      setStillOffline(nextOffline);
      return !nextOffline;
    } catch {
      setStillOffline(true);
      return false;
    } finally {
      setChecking(false);
    }
  }, []);

  return { state, offline, checking, stillOffline, refresh };
}
