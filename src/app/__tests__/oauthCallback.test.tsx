import { act } from "@testing-library/react-native";
import * as WebBrowser from "expo-web-browser";
import { redirectSystemPath } from "../+native-intent";
import OAuthNativeCallbackScreen from "../oauth-native-callback";
import * as appAuth from "@/auth/useAppAuth";
import { renderWithProviders } from "@/test/render";

const mockReplace = jest.fn();
jest.mock("expo-router", () => ({
  useRouter: () => ({ replace: mockReplace }),
}));

const initialCompleteAuthSessionCalls = (WebBrowser.maybeCompleteAuthSession as jest.Mock).mock.calls.length;

beforeEach(() => {
  jest.clearAllMocks();
});

describe("redirectSystemPath (+native-intent)", () => {
  it.each([
    "jyotishlab://oauth-native-callback?rotating_token_nonce=abc123",
    "jyotishlab:///oauth-native-callback?code=xyz",
    "exp://192.168.1.10:8081/--/oauth-native-callback?rotating_token_nonce=abc",
    "/oauth-native-callback?foo=bar",
  ])("returns null for warm OAuth callback %s so Expo Router does not navigate to +not-found", (path) => {
    expect(redirectSystemPath({ path, initial: false })).toBeNull();
  });

  it("redirects cold-start OAuth callback links to root", () => {
    expect(
      redirectSystemPath({
        path: "jyotishlab://oauth-native-callback?rotating_token_nonce=abc123",
        initial: true,
      }),
    ).toBe("/");
  });

  it("preserves normal deep links untouched", () => {
    expect(redirectSystemPath({ path: "jyotishlab://kundli/k1", initial: false })).toBe("jyotishlab://kundli/k1");
    expect(redirectSystemPath({ path: "/kundli/new", initial: true })).toBe("/kundli/new");
    expect(redirectSystemPath({ path: "/?next=oauth-native-callback", initial: false })).toBe(
      "/?next=oauth-native-callback",
    );
  });

  it("falls back to root on non-string input without throwing", () => {
    expect(redirectSystemPath({ path: undefined as unknown as string, initial: false })).toBe("/");
  });
});

describe("OAuthNativeCallbackScreen", () => {
  it("completes auth session at module load and replaces to dashboard when signed in", async () => {
    jest.useFakeTimers();
    jest.spyOn(appAuth, "useAppAuth").mockReturnValue({
      isConfigured: true,
      isLoaded: true,
      isSignedIn: true,
      userId: "u1",
      email: "test@example.com",
      fullName: "Test",
      getToken: jest.fn(async () => "tok"),
      signOut: jest.fn(async () => {}),
    });

    try {
      await renderWithProviders(<OAuthNativeCallbackScreen />);
      expect(initialCompleteAuthSessionCalls).toBeGreaterThanOrEqual(1);
      await act(async () => {
        jest.advanceTimersByTime(10);
      });
      expect(mockReplace).toHaveBeenCalledWith("/(tabs)");
    } finally {
      jest.useRealTimers();
      jest.restoreAllMocks();
    }
  });

  it("waits until auth is ready before falling back to dashboard", async () => {
    jest.useFakeTimers();
    jest.spyOn(appAuth, "useAppAuth").mockReturnValue({
      isConfigured: true,
      isLoaded: false,
      isSignedIn: false,
      userId: null,
      email: null,
      fullName: null,
      getToken: jest.fn(async () => null),
      signOut: jest.fn(async () => {}),
    });

    try {
      await renderWithProviders(<OAuthNativeCallbackScreen />);
      await act(async () => {
        jest.advanceTimersByTime(1000);
      });
      expect(mockReplace).not.toHaveBeenCalled();
    } finally {
      jest.useRealTimers();
      jest.restoreAllMocks();
    }
  });
});
