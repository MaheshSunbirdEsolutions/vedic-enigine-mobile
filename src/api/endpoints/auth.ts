import type { HttpClient } from "../client";

export type UserProfile = {
  id: string;
  email: string | null;
  full_name: string | null;
  preferred_lang: "en" | "hi";
  created_at?: string;
  updated_at?: string;
};

type Opt = { signal?: AbortSignal };

/** Authenticated user profile endpoints (/me). */
export const authEndpoints = (c: HttpClient) => ({
  me: (o: Opt = {}) => c.request<UserProfile>("/me", { signal: o.signal }),
  updateMe: (patch: { full_name?: string | null; preferred_lang?: "en" | "hi" }) =>
    c.request<UserProfile>("/me", { method: "PATCH", body: patch }),
});
