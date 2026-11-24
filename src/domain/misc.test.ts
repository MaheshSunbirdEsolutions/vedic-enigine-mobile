import match from "@/__fixtures__/match.json";
import type { MatchResult } from "@/types/api";
import { addToHistory, ASK_HISTORY_LIMIT, isValidQuestion } from "./ask";
import { describeBirth, localIso, nowIn, todayIn } from "./birth";
import { formatDate, formatTime, humanize } from "./format";
import { kundliFromParams, kundliToParams } from "./kundliParams";
import { isAcceptable, matchDoshas, scoreRatio } from "./match";
import { pickerToDate, pickerToTime, toPickerDate } from "./pickers";
import { dignityTone, natureTone, priorityTone, ratingTone, verdictTone } from "./tone";

describe("format", () => {
  it("formats engine dates without shifting zones", () => {
    expect(formatDate("2026-11-24T23:59:00+05:30")).toBe("24 Nov 2026");
    expect(formatDate("1962-11-15T03:19:04+05:30", "hi")).toBe("15 नव॰ 1962");
    expect(formatDate(null)).toBe("—");
    expect(formatTime("2026-11-24T06:57+05:30", "2026-11-24")).toBe("06:57");
    expect(formatTime("2026-11-25T03:31+05:30", "2026-11-24")).toBe("03:31 (25 Nov 2026)");
    expect(humanize("graha_maitri")).toBe("Graha maitri");
  });
});

describe("birth", () => {
  it("gives wall-clock time in a zone", () => {
    const at = new Date("2026-11-24T04:18:00Z");
    expect(nowIn("Asia/Kolkata", at)).toBe("2026-11-24T09:48:00");
    expect(nowIn("America/New_York", at)).toBe("2026-11-23T23:18:00");
    expect(todayIn("Asia/Kolkata", at)).toBe("2026-11-24");
    expect(nowIn("Not/AZone", at)).toBe(localIso(at));
  });
  it("describes a kundli", () => {
    expect(describeBirth({ name: "A", datetime_local: "1980-12-27T22:46:00", tz: "Asia/Kolkata", lat: 31.7, lon: 76.9, place: "Mandi" }))
      .toBe("1980-12-27 10:46 PM · Mandi");
  });
});

describe("tones", () => {
  it("maps labels to colours", () => {
    expect(ratingTone("good")).toBe("good");
    expect(ratingTone("challenging")).toBe("bad");
    expect(ratingTone("mixed")).toBe("mixed");
    expect(dignityTone("exalted")).toBe("good");
    expect(dignityTone("friend")).toBe("neutral");
    expect(natureTone("challenging")).toBe("bad");
    expect(priorityTone("high")).toBe("bad");
    expect(verdictTone("strong")).toBe("good");
    expect(verdictTone(undefined)).toBe("neutral");
  });
});

describe("match", () => {
  it("applies the 18-guna pass mark", () => {
    const m = match as MatchResult;
    expect(isAcceptable(m)).toBe(true);
    expect(isAcceptable({ total: 17.5 })).toBe(false);
    expect(matchDoshas(m)).toEqual([]);
    expect(matchDoshas({ ...m, doshas: { nadi_dosha: true, bhakoot_dosha: true } })).toEqual(["nadi_dosha", "bhakoot_dosha"]);
    expect(scoreRatio(9, 6)).toBe(1);
  });
});

describe("ask", () => {
  it("validates and caps history", () => {
    expect(isValidQuestion(" a ")).toBe(false);
    let h: ReturnType<typeof addToHistory> = [];
    for (let i = 0; i < ASK_HISTORY_LIMIT + 5; i++) h = addToHistory(h, { q: `q${i}`, lang: "en", at: String(i) });
    expect(h).toHaveLength(ASK_HISTORY_LIMIT);
    expect(h[0].q).toBe(`q${ASK_HISTORY_LIMIT + 4}`);
  });
});

describe("kundli params", () => {
  it("round-trips an unsaved kundli through route params", () => {
    const k = { name: "A", datetime_local: "1990-05-14T06:30:00", tz: "Asia/Kolkata", lat: 28.61, lon: 77.2, place: "Delhi",
      gender: "female" as const, settings: { ayanamsa: "raman" as const, node: "true" as const } };
    expect(kundliFromParams(kundliToParams(k))).toEqual(k);
  });
  it("rejects incomplete params and cleans unknown values", () => {
    expect(kundliFromParams({ dt: "1990-05-14T06:30:00", tz: "Asia/Kolkata" })).toBeNull();
    expect(kundliFromParams({ dt: "bad", tz: "x", lat: "1", lon: "2" })).toBeNull();
    const k = kundliFromParams({ dt: "1990-05-14T06:30", tz: "UTC", lat: "1", lon: "2", ay: "weird", gender: "x" });
    expect(k).toMatchObject({ datetime_local: "1990-05-14T06:30:00", gender: "", settings: { ayanamsa: "lahiri", node: "mean" } });
  });
});

describe("pickers", () => {
  it("converts between strings and Date", () => {
    const d = toPickerDate("1980-12-27", "22:46:05");
    expect(pickerToDate(d)).toBe("1980-12-27");
    expect(pickerToTime(d)).toBe("22:46:05");
    expect(pickerToTime(toPickerDate("", ""))).toBe("12:00:00");
  });
});
