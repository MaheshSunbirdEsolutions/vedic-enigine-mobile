import { buildEnv, normalizeBaseUrl, parseAppEnv, parseTimeout } from "./env";

describe("env", () => {
  it("uses defaults when nothing is set", () => {
    expect(buildEnv({})).toEqual({
      engineUrl: "https://vedic-engine-eight.vercel.app/engine",
      apiTimeoutMs: 60000,
      appEnv: "development",
      clerkPublishableKey: null,
    });
  });
  it("normalizes URLs and rejects non-http values", () => {
    expect(normalizeBaseUrl(" https://engine.example.com/// ")).toBe("https://engine.example.com");
    expect(normalizeBaseUrl("ftp://x")).toBeNull();
    expect(normalizeBaseUrl("192.168.1.2:8000")).toBeNull();
    expect(buildEnv({ EXPO_PUBLIC_ENGINE_URL: "nonsense" }).engineUrl).toBe("https://vedic-engine-eight.vercel.app/engine");
  });
  it("parses timeout and app env defensively", () => {
    expect(parseTimeout("15000")).toBe(15000);
    expect(parseTimeout("5")).toBe(60000);
    expect(parseTimeout("abc")).toBe(60000);
    expect(parseAppEnv("production")).toBe("production");
    expect(parseAppEnv("prod")).toBe("development");
  });
  it("parses Clerk publishable key defensively", () => {
    expect(buildEnv({ EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY: " pk_test_abc123 " }).clerkPublishableKey).toBe("pk_test_abc123");
    expect(buildEnv({ EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY: "pk_live_xyz" }).clerkPublishableKey).toBe("pk_live_xyz");
    expect(buildEnv({ EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY: "sk_test_secret" }).clerkPublishableKey).toBeNull();
    expect(buildEnv({ EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY: "   " }).clerkPublishableKey).toBeNull();
  });
});
