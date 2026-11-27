import { getClerkInstance } from "@clerk/expo";
import { env } from "@/config/env";

export type TokenGetter = () => Promise<string | null>;

let activeTokenGetter: TokenGetter | null = null;

/** Registers the active Clerk React session token getter. */
export function setAuthTokenGetter(getter: TokenGetter | null): void {
  activeTokenGetter = getter;
}

/** Resolves the current Clerk session JWT, or null when signed out/unconfigured. */
export async function getAuthToken(): Promise<string | null> {
  if (activeTokenGetter) {
    try {
      return (await activeTokenGetter()) ?? null;
    } catch {
      return null;
    }
  }
  if (!env.clerkPublishableKey) return null;
  try {
    const clerk = getClerkInstance();
    return (await clerk?.session?.getToken()) ?? null;
  } catch {
    return null;
  }
}
