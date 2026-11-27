import { getClerkInstance } from "@clerk/expo";
import { env } from "@/config/env";

export type GetTokenOptions = {
  skipCache?: boolean;
};

export type TokenGetter = (opts?: GetTokenOptions) => Promise<string | null>;

let activeTokenGetter: TokenGetter | null = null;

/** Registers the active Clerk React session token getter. */
export function setAuthTokenGetter(getter: TokenGetter | null): void {
  activeTokenGetter = getter;
}

const B64_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

function decodeBase64Url(segment: string): string | null {
  try {
    const clean = segment.replace(/-/g, "+").replace(/_/g, "/").replace(/=+$/, "");
    if (typeof globalThis.atob === "function") {
      return globalThis.atob(clean.padEnd(Math.ceil(clean.length / 4) * 4, "="));
    }
    let out = "";
    let bits = 0;
    let bitCount = 0;
    for (let i = 0; i < clean.length; i++) {
      const idx = B64_CHARS.indexOf(clean[i]);
      if (idx < 0) return null;
      bits = (bits << 6) | idx;
      bitCount += 6;
      if (bitCount >= 8) {
        bitCount -= 8;
        out += String.fromCharCode((bits >> bitCount) & 0xff);
      }
    }
    return out;
  } catch {
    return null;
  }
}

/** True only for well-formed JWTs whose `exp` is past or within `bufferSec` seconds. */
export function isJwtExpiringSoon(token: string, bufferSec = 10): boolean {
  const parts = token.split(".");
  if (parts.length !== 3) return false;
  const decoded = decodeBase64Url(parts[1]);
  if (!decoded) return false;
  try {
    const payload = JSON.parse(decoded) as { exp?: unknown };
    if (typeof payload.exp !== "number") return false;
    return payload.exp * 1000 <= Date.now() + bufferSec * 1000;
  } catch {
    return false;
  }
}

async function readSessionToken(opts?: GetTokenOptions): Promise<string | null> {
  if (activeTokenGetter) {
    try {
      return (await activeTokenGetter(opts)) ?? null;
    } catch {
      return null;
    }
  }
  if (!env.clerkPublishableKey) return null;
  try {
    const clerk = getClerkInstance();
    return (await clerk?.session?.getToken(opts)) ?? null;
  } catch {
    return null;
  }
}

/** Resolves a fresh Clerk session JWT, bypassing Clerk's cache if near expiry or requested. */
export async function getAuthToken(opts?: GetTokenOptions): Promise<string | null> {
  const token = await readSessionToken(opts);
  if (!opts?.skipCache && token && isJwtExpiringSoon(token)) {
    return (await readSessionToken({ skipCache: true })) ?? token;
  }
  return token;
}
