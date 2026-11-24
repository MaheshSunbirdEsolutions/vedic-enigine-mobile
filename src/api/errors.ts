/** A single error type for everything that can go wrong talking to the engine. */

export type ApiErrorKind = "network" | "timeout" | "aborted" | "http" | "parse";

export class ApiError extends Error {
  readonly kind: ApiErrorKind;
  readonly status?: number;
  readonly path: string;
  readonly detail?: string;

  constructor(opts: { kind: ApiErrorKind; path: string; status?: number; detail?: string; cause?: unknown }) {
    super(`${opts.path}: ${opts.kind}${opts.status ? ` ${opts.status}` : ""}${opts.detail ? ` – ${opts.detail}` : ""}`);
    this.name = "ApiError";
    this.kind = opts.kind;
    this.status = opts.status;
    this.path = opts.path;
    this.detail = opts.detail;
    if (opts.cause !== undefined) (this as { cause?: unknown }).cause = opts.cause;
  }

  /** 4xx errors will not succeed on retry. */
  get isClientError(): boolean {
    return this.kind === "http" && this.status !== undefined && this.status >= 400 && this.status < 500;
  }

  get isRetryable(): boolean {
    return this.kind === "network" || this.kind === "timeout" || (this.kind === "http" && !this.isClientError);
  }
}

export const isApiError = (e: unknown): e is ApiError => e instanceof ApiError;

/**
 * Turns a FastAPI error body into one readable line.
 * FastAPI sends `{"detail": "text"}` or `{"detail": [{"loc": [...], "msg": "..."}]}`.
 */
export function parseErrorDetail(body: string): string | undefined {
  if (!body) return undefined;
  try {
    const j = JSON.parse(body) as { detail?: unknown };
    const d = j.detail;
    if (typeof d === "string") return d;
    if (Array.isArray(d)) {
      return d
        .map((x: { loc?: unknown[]; msg?: string }) => {
          const field = Array.isArray(x.loc) ? x.loc.filter((p) => p !== "body").join(".") : "";
          return field ? `${field}: ${x.msg ?? ""}` : x.msg ?? "";
        })
        .filter(Boolean)
        .join("; ");
    }
    return d === undefined ? body.slice(0, 200) : JSON.stringify(d).slice(0, 200);
  } catch {
    return body.slice(0, 200);
  }
}

/** i18n key for a user-facing message. Screens translate it with `t()`. */
export function errorMessageKey(e: unknown): string {
  if (!isApiError(e)) return "err_unknown";
  switch (e.kind) {
    case "network":
      return "engine_down";
    case "timeout":
      return "err_timeout";
    case "aborted":
      return "err_aborted";
    case "parse":
      return "err_parse";
    case "http":
      if (e.status === 404) return "not_found";
      if (e.status === 422) return "err_validation";
      return "err_server";
  }
}
