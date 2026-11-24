/**
 * Environment configuration. This is the only module that reads `process.env`.
 *
 * Expo inlines `EXPO_PUBLIC_*` variables at build time, so each one must be read with a
 * literal `process.env.EXPO_PUBLIC_X` expression (dynamic lookups are not inlined).
 */

export type AppEnv = "development" | "staging" | "production";

export type EnvConfig = {
  engineUrl: string;
  apiTimeoutMs: number;
  appEnv: AppEnv;
};

const DEFAULT_ENGINE_URL = "http://127.0.0.1:8000";
const DEFAULT_TIMEOUT_MS = 60_000;

/** Removes trailing slashes and validates that the value is an http(s) URL. */
export function normalizeBaseUrl(value: string | undefined | null): string | null {
  const v = (value ?? "").trim().replace(/\/+$/, "");
  if (!v) return null;
  return /^https?:\/\/[^\s/]+/i.test(v) ? v : null;
}

export function parseTimeout(value: string | undefined): number {
  const n = Number(value);
  return Number.isFinite(n) && n >= 1000 ? Math.round(n) : DEFAULT_TIMEOUT_MS;
}

export function parseAppEnv(value: string | undefined): AppEnv {
  return value === "staging" || value === "production" ? value : "development";
}

/** Builds the config from a raw variable map (exported for tests). */
export function buildEnv(raw: Record<string, string | undefined>): EnvConfig {
  return {
    engineUrl: normalizeBaseUrl(raw.EXPO_PUBLIC_ENGINE_URL) ?? DEFAULT_ENGINE_URL,
    apiTimeoutMs: parseTimeout(raw.EXPO_PUBLIC_API_TIMEOUT_MS),
    appEnv: parseAppEnv(raw.EXPO_PUBLIC_APP_ENV),
  };
}

export const env: EnvConfig = buildEnv({
  EXPO_PUBLIC_ENGINE_URL: process.env.EXPO_PUBLIC_ENGINE_URL,
  EXPO_PUBLIC_API_TIMEOUT_MS: process.env.EXPO_PUBLIC_API_TIMEOUT_MS,
  EXPO_PUBLIC_APP_ENV: process.env.EXPO_PUBLIC_APP_ENV,
});
