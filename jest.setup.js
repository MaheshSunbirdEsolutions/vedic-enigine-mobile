/* global jest */
jest.mock("@react-native-async-storage/async-storage", () =>
  require("@react-native-async-storage/async-storage/jest/async-storage-mock"),
);

jest.mock("react-native-keyboard-controller", () => require("react-native-keyboard-controller/jest"));

jest.mock("expo-web-browser", () => ({
  maybeCompleteAuthSession: jest.fn(),
  warmUpAsync: jest.fn(async () => {}),
  coolDownAsync: jest.fn(async () => {}),
}));

jest.mock("expo-auth-session", () => ({
  makeRedirectUri: jest.fn(() => "jyotishlab://oauth-native-callback"),
}));

jest.mock("@clerk/expo/token-cache", () => ({
  tokenCache: {},
}));

jest.mock("@clerk/expo/experimental", () => ({
  useSSO: jest.fn(() => ({
    startSSOFlow: jest.fn(async () => ({ createdSessionId: null })),
  })),
}));

jest.mock("@clerk/expo", () => ({
  ClerkProvider: ({ children }) => children,
  getClerkInstance: jest.fn(() => ({
    session: { getToken: jest.fn(async () => "test-token") },
  })),
  useAuth: jest.fn(() => ({
    isLoaded: true,
    isSignedIn: true,
    userId: "user_test",
    getToken: jest.fn(async () => "test-token"),
    signOut: jest.fn(async () => {}),
  })),
  useUser: jest.fn(() => ({
    isLoaded: true,
    isSignedIn: true,
    user: {
      id: "user_test",
      fullName: "Test User",
      primaryEmailAddress: { emailAddress: "test@example.com" },
      emailAddresses: [{ emailAddress: "test@example.com" }],
    },
  })),
  useSignIn: jest.fn(() => ({
    signIn: {
      status: "needs_first_factor",
      password: jest.fn(async () => ({ error: null })),
      emailCode: {
        sendCode: jest.fn(async () => ({ error: null })),
        verifyCode: jest.fn(async () => ({ error: null })),
      },
      mfa: {
        sendEmailCode: jest.fn(async () => ({ error: null })),
        verifyEmailCode: jest.fn(async () => ({ error: null })),
      },
      finalize: jest.fn(async () => ({ error: null })),
    },
    errors: null,
    fetchStatus: "idle",
  })),
  useSignUp: jest.fn(() => ({
    signUp: {
      status: "missing_requirements",
      unverifiedFields: ["email_address"],
      password: jest.fn(async () => ({ error: null })),
      create: jest.fn(async () => ({ error: null })),
      verifications: {
        sendEmailCode: jest.fn(async () => ({ error: null })),
        verifyEmailCode: jest.fn(async () => ({ error: null })),
      },
      finalize: jest.fn(async () => ({ error: null })),
    },
    errors: null,
    fetchStatus: "idle",
  })),
}));
