/** Conversions between form strings and Date objects used by native pickers. */
import { localIso } from "./birth";
import { to24h } from "./time12";

/** Builds a device-local Date from "YYYY-MM-DD" and "HH:MM[:SS]" (invalid parts → sensible defaults). */
export function toPickerDate(date: string, time: string): Date {
  const d = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  const t = /^(\d{1,2}):(\d{2})(?::(\d{2}))?$/.exec(time);
  const base = d ? new Date(+d[1], +d[2] - 1, +d[3]) : new Date(1990, 0, 1);
  if (t) base.setHours(+t[1], +t[2], t[3] ? +t[3] : 0, 0);
  else base.setHours(12, 0, 0, 0);
  return base;
}

export const pickerToDate = (d: Date) => localIso(d).slice(0, 10);
export const pickerToTime = (d: Date) => localIso(d).slice(11, 19);

/** Date for the native picker from "YYYY-MM-DD" and a 12-hour time. */
export function toPickerDate12(date: string, time12: string, meridiem: "AM" | "PM"): Date {
  return toPickerDate(date, to24h(time12, meridiem) ?? "");
}
