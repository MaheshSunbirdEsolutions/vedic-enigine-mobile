import { Alert } from "react-native";
import * as clerk from "@clerk/expo";
import { fireEvent, screen, waitFor } from "@testing-library/react-native";
import { ApiError, errorMessageKey } from "@/api/errors";
import { HeaderActions } from "@/components/HeaderActions";
import { BirthForm } from "@/components/kundli/BirthForm";
import { AskTab } from "@/components/tabs/AskTab";
import { renderWithProviders } from "@/test/render";
import KundlisScreen from "../(tabs)/index";
import SettingsScreen from "../(tabs)/settings";
import SignInScreen from "../(auth)/sign-in";
import SignUpScreen from "../(auth)/sign-up";

const mockPush = jest.fn();
const mockReplace = jest.fn();
const mockBack = jest.fn();
const mockNavigate = jest.fn();
const mockCanGoBack = jest.fn(() => true);
let mockSearchParams: Record<string, string> = {};

jest.mock("expo-router", () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
    back: mockBack,
    navigate: mockNavigate,
    canGoBack: mockCanGoBack,
  }),
  useLocalSearchParams: () => mockSearchParams,
}));

jest.mock("@/api", () => ({
  ...jest.requireActual("@/api"),
  engineApi: {
    auth: { me: jest.fn(), updateMe: jest.fn() },
    kundlis: { list: jest.fn(), get: jest.fn(), create: jest.fn(), update: jest.fn(), remove: jest.fn() },
    astro: { chart: jest.fn(), dasha: jest.fn(), sadeSati: jest.fn(), interpret: jest.fn() },
    reports: { simple: jest.fn() },
    ask: { status: jest.fn(), ask: jest.fn() },
    meta: { places: jest.fn() },
  },
}));
const mockApi = jest.requireMock("@/api").engineApi;

const SAMPLE_KUNDLI = {
  name: "Mahesh",
  datetime_local: "1980-12-27T22:46:00",
  tz: "Asia/Kolkata",
  lat: 31.71,
  lon: 76.93,
  place: "Mandi",
};

beforeEach(() => {
  jest.clearAllMocks();
  mockSearchParams = {};
  mockCanGoBack.mockReturnValue(true);
});

describe("Auth error mapping", () => {
  it("maps 401 HTTP error to err_unauthorized", () => {
    expect(errorMessageKey(new ApiError({ kind: "http", status: 401, path: "/me" }))).toBe("err_unauthorized");
  });
});

describe("Generate kundli sign-in check", () => {
  it("redirects immediately to sign-in when signed out without calling onSubmit", async () => {
    const onSubmit = jest.fn();
    await renderWithProviders(<BirthForm onSubmit={onSubmit} />, {
      auth: { isConfigured: true, isLoaded: true, isSignedIn: false },
    });

    await fireEvent.press(screen.getByTestId("submit-birth"));

    expect(onSubmit).not.toHaveBeenCalled();
    expect(mockPush).toHaveBeenCalledWith("/(auth)/sign-in");
  });

  it("preserves valid unsaved details via previewParams when redirecting to sign-in", async () => {
    const onSubmit = jest.fn();
    await renderWithProviders(<BirthForm initial={SAMPLE_KUNDLI} onSubmit={onSubmit} />, {
      auth: { isConfigured: true, isLoaded: true, isSignedIn: false },
    });

    await fireEvent.press(screen.getByTestId("submit-birth"));

    expect(onSubmit).not.toHaveBeenCalled();
    expect(mockPush).toHaveBeenCalledWith({
      pathname: "/(auth)/sign-in",
      params: { previewParams: expect.stringContaining("1980-12-27T22:46:00") },
    });
  });

  it("allows submitting without sign-in when requireAuth={false} (Match picker)", async () => {
    const onSubmit = jest.fn();
    await renderWithProviders(<BirthForm initial={SAMPLE_KUNDLI} requireAuth={false} onSubmit={onSubmit} />, {
      auth: { isConfigured: true, isLoaded: true, isSignedIn: false },
    });

    await fireEvent.press(screen.getByTestId("submit-birth"));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    expect(mockPush).not.toHaveBeenCalled();
  });
});

describe("Protected screens and controls when signed out", () => {
  it("prompts to sign in on KundlisScreen without querying /kundlis", async () => {
    await renderWithProviders(<KundlisScreen />, {
      auth: { isConfigured: true, isLoaded: true, isSignedIn: false },
    });

    expect(screen.getByText("Sign in to view and manage your saved kundlis.")).toBeTruthy();
    expect(mockApi.kundlis.list).not.toHaveBeenCalled();

    await fireEvent.press(screen.getByText("Sign in"));
    expect(mockPush).toHaveBeenCalledWith("/(auth)/sign-in");
  });

  it("shows sign-in prompt inside AskTab when signed out", async () => {
    mockApi.ask.status.mockResolvedValue({ ai: false, model: null });
    await renderWithProviders(<AskTab kundli={SAMPLE_KUNDLI} />, {
      auth: { isConfigured: true, isLoaded: true, isSignedIn: false },
    });

    expect(screen.getByText("Sign in to ask Jyotish questions on your charts.")).toBeTruthy();
    expect(screen.queryByTestId("ask-input")).toBeNull();
  });

  it("renders HeaderActions sign-in pill when signed out", async () => {
    await renderWithProviders(<HeaderActions />, {
      auth: { isConfigured: true, isLoaded: true, isSignedIn: false },
    });
    await fireEvent.press(screen.getByTestId("header-sign-in"));
    expect(mockPush).toHaveBeenCalledWith("/(auth)/sign-in");
  });

  it("renders HeaderActions account badge when signed in", async () => {
    await renderWithProviders(<HeaderActions />, {
      auth: { isConfigured: true, isLoaded: true, isSignedIn: true, email: "ravi@example.com", fullName: "Ravi" },
    });
    expect(screen.getByTestId("header-account")).toHaveTextContent("R");
    await fireEvent.press(screen.getByTestId("header-account"));
    expect(mockNavigate).toHaveBeenCalledWith("/(tabs)/settings");
  });

  it("shows guest sign-in actions in SettingsScreen", async () => {
    await renderWithProviders(<SettingsScreen />, {
      auth: { isConfigured: true, isLoaded: true, isSignedIn: false },
    });
    await fireEvent.press(screen.getByTestId("settings-sign-in"));
    expect(mockPush).toHaveBeenCalledWith("/(auth)/sign-in");
    await fireEvent.press(screen.getByTestId("settings-sign-up"));
    expect(mockPush).toHaveBeenCalledWith("/(auth)/sign-up");
  });

  it("confirms and invokes signOut() from SettingsScreen when signed in", async () => {
    const signOut = jest.fn(async () => {});
    const alertSpy = jest.spyOn(Alert, "alert").mockImplementation((_t, _m, buttons) => {
      buttons?.find((b) => b.style === "destructive")?.onPress?.();
    });
    await renderWithProviders(<SettingsScreen />, {
      auth: { isConfigured: true, isLoaded: true, isSignedIn: true, email: "ravi@example.com", fullName: "Ravi", signOut },
    });
    expect(screen.getByText("ravi@example.com")).toBeTruthy();
    await fireEvent.press(screen.getByTestId("settings-sign-out"));
    await waitFor(() => expect(signOut).toHaveBeenCalledTimes(1));
    alertSpy.mockRestore();
  });
});

describe("Standalone SignInScreen and SignUpScreen flows", () => {
  it("signs in with password, calls finalize(), and returns to main layout", async () => {
    const signInObj = {
      status: "needs_first_factor",
      password: jest.fn(async () => {
        signInObj.status = "complete";
        return { error: null };
      }),
      emailCode: { sendCode: jest.fn(async () => ({ error: null })), verifyCode: jest.fn(async () => ({ error: null })) },
      mfa: { sendEmailCode: jest.fn(async () => ({ error: null })), verifyEmailCode: jest.fn(async () => ({ error: null })) },
      finalize: jest.fn(async () => ({ error: null })),
    };
    jest.spyOn(clerk, "useSignIn").mockReturnValue({ signIn: signInObj, errors: null, fetchStatus: "idle" } as never);
    mockSearchParams = { previewParams: JSON.stringify({ name: "Mahesh", datetime_local: "1980-12-27T22:46:00", tz: "Asia/Kolkata", lat: "31.71", lon: "76.93" }) };

    await renderWithProviders(<SignInScreen />, {
      auth: { isConfigured: true, isLoaded: true, isSignedIn: false },
    });

    await fireEvent.changeText(screen.getByTestId("auth-email"), "dev@example.com");
    await fireEvent.changeText(screen.getByTestId("auth-password"), "SecretPass123!");
    await fireEvent.press(screen.getByTestId("sign-in-submit"));

    await waitFor(() => expect(signInObj.finalize).toHaveBeenCalledTimes(1));
    expect(mockReplace).toHaveBeenCalledWith({
      pathname: "/kundli/preview",
      params: expect.objectContaining({ name: "Mahesh" }),
    });
  });

  it("signs up, sends email verification code, verifies, finalizes, and pops back", async () => {
    const signUpObj = {
      status: "missing_requirements",
      unverifiedFields: ["email_address"],
      password: jest.fn(async () => ({ error: null })),
      create: jest.fn(async () => ({ error: null })),
      verifications: {
        sendEmailCode: jest.fn(async () => ({ error: null })),
        verifyEmailCode: jest.fn(async () => {
          signUpObj.status = "complete";
          return { error: null };
        }),
      },
      finalize: jest.fn(async () => ({ error: null })),
    };
    jest.spyOn(clerk, "useSignUp").mockReturnValue({ signUp: signUpObj, errors: null, fetchStatus: "idle" } as never);

    await renderWithProviders(<SignUpScreen />, {
      auth: { isConfigured: true, isLoaded: true, isSignedIn: false },
    });

    await fireEvent.changeText(screen.getByTestId("auth-email"), "new@example.com");
    await fireEvent.changeText(screen.getByTestId("auth-password"), "StrongPass123!");
    await fireEvent.press(screen.getByTestId("sign-up-submit"));

    await waitFor(() => expect(screen.getByTestId("auth-code")).toBeTruthy());
    await fireEvent.changeText(screen.getByTestId("auth-code"), "424242");
    await fireEvent.press(screen.getByTestId("verify-code-submit"));

    await waitFor(() => expect(signUpObj.finalize).toHaveBeenCalledTimes(1));
    expect(mockBack).toHaveBeenCalledTimes(1);
  });
});
