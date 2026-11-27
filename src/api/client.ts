/**
 * HTTP client for the Vedic Engine: base URL, JSON encoding, timeouts, cancellation and
 * typed errors. Endpoint modules (./endpoints) build on `request`; UI code never calls
 * `fetch` directly.
 */
import { ApiError, parseErrorDetail } from "./errors";

export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export type RequestOptions = {
  method?: HttpMethod;
  body?: unknown;
  query?: Record<string, string | number | undefined | null>;
  signal?: AbortSignal;
  timeoutMs?: number;
};

export type TokenProvider = (opts?: { skipCache?: boolean }) => Promise<string | null> | string | null;

export type HttpClientConfig = {
  getBaseUrl: () => string;
  timeoutMs: number;
  fetchImpl?: typeof fetch;
  getToken?: TokenProvider;
};

export type HttpClient = { request: <T>(path: string, opts?: RequestOptions) => Promise<T> };

export function buildUrl(base: string, path: string, query?: RequestOptions["query"]): string {
  const url = `${base.replace(/\/+$/, "")}/${path.replace(/^\/+/, "")}`;
  if (!query) return url;
  const qs = Object.entries(query)
    .filter(([, v]) => v !== undefined && v !== null)
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
    .join("&");
  return qs ? `${url}?${qs}` : url;
}

export function createHttpClient(config: HttpClientConfig): HttpClient {
  const doFetch = config.fetchImpl ?? ((...a: Parameters<typeof fetch>) => fetch(...a));

  async function resolveToken(opts?: { skipCache?: boolean }): Promise<string | null> {
    if (!config.getToken) return null;
    try {
      return (await config.getToken(opts)) ?? null;
    } catch {
      return null;
    }
  }

  async function request<T>(path: string, opts: RequestOptions = {}): Promise<T> {
    const hasBody = opts.body !== undefined;
    const method = opts.method ?? (hasBody ? "POST" : "GET");
    const url = buildUrl(config.getBaseUrl(), path, opts.query);

    // One controller for both the timeout and the caller's signal (e.g. React Query cancel).
    const controller = new AbortController();
    let timedOut = false;
    const timer = setTimeout(() => {
      timedOut = true;
      controller.abort();
    }, opts.timeoutMs ?? config.timeoutMs);
    const onAbort = () => controller.abort();
    if (opts.signal) {
      if (opts.signal.aborted) controller.abort();
      else opts.signal.addEventListener("abort", onAbort);
    }

    const performFetch = (authToken: string | null) =>
      doFetch(url, {
        method,
        headers: {
          accept: "application/json",
          ...(hasBody ? { "content-type": "application/json" } : {}),
          ...(authToken ? { authorization: `Bearer ${authToken}` } : {}),
        },
        body: hasBody ? JSON.stringify(opts.body) : undefined,
        signal: controller.signal,
      });

    let res: Response;
    try {
      const token = config.getToken ? await resolveToken() : null;
      if (controller.signal.aborted) {
        throw new Error("aborted");
      }
      res = await performFetch(token);
      if (res.status === 401 && config.getToken && !controller.signal.aborted) {
        const refreshed = await resolveToken({ skipCache: true });
        if (refreshed && refreshed !== token && !controller.signal.aborted) {
          res = await performFetch(refreshed);
        }
      }
    } catch (cause) {
      const kind = timedOut ? "timeout" : controller.signal.aborted ? "aborted" : "network";
      throw new ApiError({ kind, path, cause });
    } finally {
      clearTimeout(timer);
      opts.signal?.removeEventListener("abort", onAbort);
    }

    const text = await res.text().catch(() => "");
    if (!res.ok) {
      throw new ApiError({ kind: "http", path, status: res.status, detail: parseErrorDetail(text) });
    }
    if (!text) return undefined as T;
    try {
      return JSON.parse(text) as T;
    } catch (cause) {
      throw new ApiError({ kind: "parse", path, status: res.status, detail: text.slice(0, 120), cause });
    }
  }

  return { request };
}
