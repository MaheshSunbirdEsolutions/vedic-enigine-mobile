/** Extracts a readable message from Clerk Core 3 / API error objects. */
export function formatClerkError(err: unknown, fallback: string): string {
  if (!err) return fallback;
  if (typeof err === "string" && err.trim()) return err;
  if (typeof err === "object") {
    const obj = err as {
      longMessage?: string;
      message?: string;
      errors?: { longMessage?: string; message?: string }[];
    };
    const first = obj.errors?.[0];
    if (first?.longMessage) return first.longMessage;
    if (first?.message) return first.message;
    if (obj.longMessage) return obj.longMessage;
    if (obj.message) return obj.message;
  }
  return fallback;
}
