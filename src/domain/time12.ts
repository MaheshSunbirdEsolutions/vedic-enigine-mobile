/** 12-hour clock helpers. The engine always receives 24-hour "HH:MM:SS". */
export type Meridiem = "AM" | "PM";

const pad = (n: number) => String(n).padStart(2, "0");

/** "hh:mm" or "hh:mm:ss" with hh 1–12. */
export const TIME12_RE = /^(0?[1-9]|1[0-2]):([0-5]\d)(?::([0-5]\d))?$/;

export const isValidTime12 = (s: string) => TIME12_RE.test(s.trim());

/** "22:46:00" → { time: "10:46", meridiem: "PM" } (seconds kept when not zero). */
export function to12h(hhmmss: string): { time: string; meridiem: Meridiem } {
  const m = /^(\d{1,2}):(\d{2})(?::(\d{2}))?$/.exec(hhmmss.trim());
  if (!m) return { time: "", meridiem: "AM" };
  const h = +m[1], sec = m[3] && m[3] !== "00" ? `:${m[3]}` : "";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return { time: `${pad(h12)}:${m[2]}${sec}`, meridiem: h >= 12 ? "PM" : "AM" };
}

/** ("10:46", "PM") → "22:46:00"; null when the time is not a valid 12-hour time. */
export function to24h(time: string, meridiem: Meridiem): string | null {
  const m = TIME12_RE.exec(time.trim());
  if (!m) return null;
  const h12 = +m[1];
  const h = meridiem === "AM" ? (h12 === 12 ? 0 : h12) : (h12 === 12 ? 12 : h12 + 12);
  return `${pad(h)}:${m[2]}:${m[3] ?? "00"}`;
}
