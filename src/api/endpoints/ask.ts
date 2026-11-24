import type { HttpClient } from "../client";
import type { AskRequest, AskResponse, AskStatus } from "@/types/api";

/** Questions & answers. AI answers can take a while, so they get a longer timeout. */
export const askEndpoints = (c: HttpClient) => ({
  status: (o: { signal?: AbortSignal } = {}) => c.request<AskStatus>("/ask/status", { signal: o.signal }),
  ask: (r: AskRequest) => c.request<AskResponse>("/ask", { body: r, timeoutMs: r.use_ai ? 120_000 : undefined }),
});
