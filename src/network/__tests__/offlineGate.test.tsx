import { BackHandler } from "react-native";
import * as Network from "expo-network";
import { fireEvent, screen, waitFor } from "@testing-library/react-native";
import { OfflineGate } from "@/components/OfflineGate";
import { renderWithProviders } from "@/test/render";
import { isNetworkOffline, useNetworkStatus } from "../useNetworkStatus";

function NetworkHarness() {
  const { offline, checking, stillOffline, refresh } = useNetworkStatus();
  if (!offline) return null;
  return <OfflineGate checking={checking} stillOffline={stillOffline} onRefresh={() => void refresh()} />;
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe("isNetworkOffline", () => {
  it("treats unknown initial state as online and explicit disconnect/unreachable as offline", () => {
    expect(isNetworkOffline(null)).toBe(false);
    expect(isNetworkOffline({})).toBe(false);
    expect(isNetworkOffline({ isConnected: true, isInternetReachable: true, type: Network.NetworkStateType.WIFI })).toBe(false);
    expect(isNetworkOffline({ isConnected: false, isInternetReachable: false, type: Network.NetworkStateType.NONE })).toBe(true);
    expect(isNetworkOffline({ isConnected: true, isInternetReachable: false, type: Network.NetworkStateType.WIFI })).toBe(true);
  });
});

describe("OfflineGate and useNetworkStatus", () => {
  it("shows blocking offline screen, keeps blocking on failed refresh, and clears once back online", async () => {
    const backSpy = jest.spyOn(BackHandler, "addEventListener");
    (Network.getNetworkStateAsync as jest.Mock)
      .mockResolvedValueOnce({ type: Network.NetworkStateType.NONE, isConnected: false, isInternetReachable: false })
      .mockResolvedValueOnce({ type: Network.NetworkStateType.NONE, isConnected: false, isInternetReachable: false })
      .mockResolvedValueOnce({ type: Network.NetworkStateType.WIFI, isConnected: true, isInternetReachable: true });

    await renderWithProviders(<NetworkHarness />);

    expect(await screen.findByTestId("offline-gate")).toBeTruthy();
    expect(backSpy).toHaveBeenCalledWith("hardwareBackPress", expect.any(Function));
    const backHandler = backSpy.mock.calls.at(-1)?.[1] as (() => boolean | null | undefined) | undefined;
    expect(backHandler?.()).toBe(true);

    // Refresh while still offline shows feedback and keeps blocking.
    await fireEvent.press(screen.getByTestId("offline-refresh"));
    expect(await screen.findByText("Still offline. Check your connection and try again.")).toBeTruthy();
    expect(screen.getByTestId("offline-gate")).toBeTruthy();

    // Refresh once reconnected clears the gate.
    await fireEvent.press(screen.getByTestId("offline-refresh"));
    await waitFor(() => expect(screen.queryByTestId("offline-gate")).toBeNull());

    backSpy.mockRestore();
  });
});
