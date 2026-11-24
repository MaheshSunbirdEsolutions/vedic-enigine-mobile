import type { HttpClient } from "../client";
import type { ReportRequest, SimpleReport } from "@/types/api";

type Opt = { signal?: AbortSignal };

/** Report ids as the engine names them: POST /report/{id}. */
export type ReportId =
  | "simple" | "lifelong" | "yearly" | "issues" | "full" | "life-areas"
  | "varshphal" | "lal-kitab" | "nakshatra" | "tirtha" | "bhrigu";

export const reportEndpoints = (c: HttpClient) => ({
  simple: (r: ReportRequest, o: Opt = {}) => c.request<SimpleReport>("/report/simple", { body: r, signal: o.signal }),
  /** The detailed reports (payloads are rendered by components/reports). */
  raw: <T = unknown>(id: ReportId, r: ReportRequest, o: Opt = {}) =>
    c.request<T>(`/report/${id}`, { body: r, signal: o.signal }),
  /** How many scanned book pages the engine has (Lal Kitab, Bhrigu Samhita). */
  bookStatus: (o: Opt = {}) => c.request<{ lalkitab: number; bhrigu: number }>("/books/status", { signal: o.signal }),
});
