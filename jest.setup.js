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

jest.mock("expo-network", () => ({
  NetworkStateType: {
    NONE: "NONE",
    UNKNOWN: "UNKNOWN",
    WIFI: "WIFI",
    CELLULAR: "CELLULAR",
  },
  getNetworkStateAsync: jest.fn(async () => ({
    type: "WIFI",
    isConnected: true,
    isInternetReachable: true,
  })),
  addNetworkStateListener: jest.fn(() => ({ remove: jest.fn() })),
  useNetworkState: jest.fn(() => ({
    type: "WIFI",
    isConnected: true,
    isInternetReachable: true,
  })),
}));

jest.mock("expo-notifications", () => ({
  DEFAULT_ACTION_IDENTIFIER: "expo.modules.notifications.actions.DEFAULT",
  AndroidImportance: { DEFAULT: 5, HIGH: 6, MAX: 7 },
  SchedulableTriggerInputTypes: { DAILY: "daily", DATE: "date" },
  setNotificationHandler: jest.fn(),
  setNotificationChannelAsync: jest.fn(async () => null),
  getPermissionsAsync: jest.fn(async () => ({ status: "granted", granted: true, canAskAgain: true })),
  requestPermissionsAsync: jest.fn(async () => ({ status: "granted", granted: true, canAskAgain: true })),
  getExactAlarmPermissionsAsync: jest.fn(async () => ({ status: "granted", granted: true, canAskAgain: true })),
  requestExactAlarmPermissionsAsync: jest.fn(async () => ({ status: "granted", granted: true, canAskAgain: true })),
  scheduleNotificationAsync: jest.fn(async () => "daily-horoscope-reminder"),
  getNextTriggerDateAsync: jest.fn(async () => Date.now() + 60_000),
  cancelScheduledNotificationAsync: jest.fn(async () => {}),
  useLastNotificationResponse: jest.fn(() => null),
  clearLastNotificationResponse: jest.fn(),
  clearLastNotificationResponseAsync: jest.fn(async () => {}),
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
