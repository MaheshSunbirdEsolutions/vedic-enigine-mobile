import type { HttpClient } from "../client";
import type { Kundli } from "@/types/api";

type Opt = { signal?: AbortSignal };

/** Saved kundlis (SQLite store on the engine). */
export const kundliEndpoints = (c: HttpClient) => ({
  list: (q = "", o: Opt = {}) => c.request<Kundli[]>("/kundlis", { query: { q }, signal: o.signal }),
  get: (id: string, o: Opt = {}) => c.request<Kundli>(`/kundlis/${encodeURIComponent(id)}`, { signal: o.signal }),
  create: (k: Kundli) => c.request<Kundli>("/kundlis", { method: "POST", body: k }),
  update: (id: string, k: Kundli) => c.request<Kundli>(`/kundlis/${encodeURIComponent(id)}`, { method: "PUT", body: k }),
  remove: (id: string) => c.request<{ deleted: string }>(`/kundlis/${encodeURIComponent(id)}`, { method: "DELETE" }),
});
