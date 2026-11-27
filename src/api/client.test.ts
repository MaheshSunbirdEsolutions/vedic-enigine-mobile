import { fakeResponse } from "@/test/render";
import { buildUrl, createHttpClient } from "./client";
import { ApiError } from "./errors";

const make = (fetchImpl: jest.Mock, timeoutMs = 1000) => createHttpClient({ getBaseUrl: () => "http://e:8000/", timeoutMs, fetchImpl });

describe("buildUrl", () => {
  it("joins base and path and encodes query, skipping empty values", () => {
    expect(buildUrl("http://e/", "/kundlis", { q: "rām & co", x: undefined, n: 2 })).toBe("http://e/kundlis?q=r%C4%81m%20%26%20co&n=2");
    expect(buildUrl("http://e", "health")).toBe("http://e/health");
  });
});

describe("http client", () => {
  it("GETs JSON", async () => {
    const f = jest.fn().mockResolvedValue(fakeResponse(200, { ok: true }));
    await expect(make(f).request("/health")).resolves.toEqual({ ok: true });
    expect(f).toHaveBeenCalledWith("http://e:8000/health", expect.objectContaining({ method: "GET", body: undefined }));
  });

  it("POSTs a JSON body with content-type", async () => {
    const f = jest.fn().mockResolvedValue(fakeResponse(201, { id: "1" }));
    await make(f).request("/kundlis", { body: { name: "A" } });
    const init = f.mock.calls[0][1];
    expect(init.method).toBe("POST");
    expect(init.headers["content-type"]).toBe("application/json");
    expect(JSON.parse(init.body)).toEqual({ name: "A" });
  });

  it("turns FastAPI validation errors into a readable ApiError", async () => {
    const f = jest.fn().mockResolvedValue(fakeResponse(422, { detail: [{ loc: ["body", "tz"], msg: "field required" }] }));
    const err = await make(f).request<unknown>("/chart", { body: {} }).then(() => { throw new Error("expected failure"); }, (e: ApiError) => e);
    expect(err).toBeInstanceOf(ApiError);
    expect(err).toMatchObject({ kind: "http", status: 422, detail: "tz: field required" });
    expect(err.isClientError).toBe(true);
    expect(err.isRetryable).toBe(false);
  });

  it("reports 5xx as retryable", async () => {
    const f = jest.fn().mockResolvedValue(fakeResponse(500, "Internal Server Error"));
    const err = await make(f).request<unknown>("/x").then(() => { throw new Error("expected failure"); }, (e: ApiError) => e);
    expect(err).toMatchObject({ kind: "http", status: 500, detail: "Internal Server Error" });
    expect(err.isRetryable).toBe(true);
  });

  it("maps a failed fetch to a network error", async () => {
    const f = jest.fn().mockRejectedValue(new TypeError("Network request failed"));
    await expect(make(f).request("/x")).rejects.toMatchObject({ kind: "network" });
  });

  it("times out", async () => {
    const f = jest.fn((_u: string, init: RequestInit) => new Promise((_r, rej) => {
      init.signal!.addEventListener("abort", () => rej(new Error("aborted")));
    }));
    await expect(make(f as unknown as jest.Mock, 20).request("/slow")).rejects.toMatchObject({ kind: "timeout" });
  });

  it("honours the caller's abort signal", async () => {
    const f = jest.fn((_u: string, init: RequestInit) => new Promise((_r, rej) => {
      init.signal!.addEventListener("abort", () => rej(new Error("aborted")));
    }));
    const ac = new AbortController();
    const p = make(f as unknown as jest.Mock).request("/x", { signal: ac.signal });
    ac.abort();
    await expect(p).rejects.toMatchObject({ kind: "aborted" });
  });

  it("flags unreadable JSON as a parse error and accepts empty bodies", async () => {
    await expect(make(jest.fn().mockResolvedValue(fakeResponse(200, "<html>"))).request("/x")).rejects.toMatchObject({ kind: "parse" });
    await expect(make(jest.fn().mockResolvedValue(fakeResponse(204, ""))).request("/x")).resolves.toBeUndefined();
  });

  it("reads the base URL on every call (Settings override)", async () => {
    let base = "http://a";
    const f = jest.fn().mockResolvedValue(fakeResponse(200, {}));
    const c = createHttpClient({ getBaseUrl: () => base, timeoutMs: 1000, fetchImpl: f });
    await c.request("/h"); base = "http://b"; await c.request("/h");
    expect(f.mock.calls.map((c) => c[0])).toEqual(["http://a/h", "http://b/h"]);
  });

  it("attaches Bearer token when getToken resolves and skips when null or failing", async () => {
    let token: string | null = "jwt-123";
    const f = jest.fn().mockResolvedValue(fakeResponse(200, {}));
    const c = createHttpClient({
      getBaseUrl: () => "http://e",
      timeoutMs: 1000,
      fetchImpl: f,
      getToken: async () => token,
    });
    await c.request("/me");
    expect(f.mock.calls[0][1].headers.authorization).toBe("Bearer jwt-123");

    token = null;
    await c.request("/health");
    expect(f.mock.calls[1][1].headers.authorization).toBeUndefined();

    const failing = createHttpClient({
      getBaseUrl: () => "http://e",
      timeoutMs: 1000,
      fetchImpl: f,
      getToken: async () => { throw new Error("token unavailable"); },
    });
    await failing.request("/health");
    expect(f.mock.calls[2][1].headers.authorization).toBeUndefined();
  });

  it("force-refreshes token with skipCache on 401 and retries once", async () => {
    const getToken = jest.fn(async (opts?: { skipCache?: boolean }) => (opts?.skipCache ? "fresh-jwt" : "stale-jwt"));
    const f = jest.fn()
      .mockResolvedValueOnce(fakeResponse(401, { detail: "Invalid or expired token" }))
      .mockResolvedValueOnce(fakeResponse(200, { ok: true }));
    const c = createHttpClient({
      getBaseUrl: () => "http://e",
      timeoutMs: 1000,
      fetchImpl: f,
      getToken,
    });

    await expect(c.request("/kundlis")).resolves.toEqual({ ok: true });
    expect(getToken).toHaveBeenNthCalledWith(1, undefined);
    expect(getToken).toHaveBeenNthCalledWith(2, { skipCache: true });
    expect(f.mock.calls[0][1].headers.authorization).toBe("Bearer stale-jwt");
    expect(f.mock.calls[1][1].headers.authorization).toBe("Bearer fresh-jwt");
  });
});
