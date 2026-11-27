import { getAuthToken, isJwtExpiringSoon, setAuthTokenGetter } from "./tokenBridge";

function toBase64Url(json: string): string {
  return btoa(json).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fakeJwt(expEpochSec: number): string {
  const header = toBase64Url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const payload = toBase64Url(JSON.stringify({ sub: "user_1", exp: expEpochSec }));
  return `${header}.${payload}.sig`;
}

afterEach(() => {
  setAuthTokenGetter(null);
});

describe("tokenBridge", () => {
  it("detects near-expiry or expired JWTs while ignoring opaque test tokens", () => {
    const now = Math.floor(Date.now() / 1000);
    expect(isJwtExpiringSoon("test-token")).toBe(false);
    expect(isJwtExpiringSoon(fakeJwt(now + 45))).toBe(false);
    expect(isJwtExpiringSoon(fakeJwt(now + 5))).toBe(true);
    expect(isJwtExpiringSoon(fakeJwt(now - 30))).toBe(true);
  });

  it("proactively skips cache when cached JWT is near expiry", async () => {
    const now = Math.floor(Date.now() / 1000);
    const stale = fakeJwt(now + 2);
    const fresh = fakeJwt(now + 60);
    const getter = jest.fn(async (opts?: { skipCache?: boolean }) => (opts?.skipCache ? fresh : stale));
    setAuthTokenGetter(getter);

    await expect(getAuthToken()).resolves.toBe(fresh);
    expect(getter).toHaveBeenNthCalledWith(1, undefined);
    expect(getter).toHaveBeenNthCalledWith(2, { skipCache: true });
  });
});
