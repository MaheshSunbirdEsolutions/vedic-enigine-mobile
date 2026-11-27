/** The app-wide client instance, wired to env config and the Settings override. */
import { getAuthToken } from "@/auth/tokenBridge";
import { env } from "@/config/env";
import { getEngineUrl } from "@/state/preferences";
import { createHttpClient } from "./client";

export const http = createHttpClient({
  getBaseUrl: getEngineUrl,
  timeoutMs: env.apiTimeoutMs,
  getToken: getAuthToken,
});
