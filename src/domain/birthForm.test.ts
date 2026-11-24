import { applyPlace, initialFormValues, isValidDate, normalizeTime, validateBirthForm } from "./birthForm";

const place = { name: "Mandi", country: "India", lat: 31.71, lon: 76.93, tz: "Asia/Kolkata" };
const filled = () => applyPlace({ ...initialFormValues(), name: " Mahesh ", date: "1980-12-27", time: "22:46" }, place);

describe("birth form", () => {
  it("validates dates including leap years", () => {
    expect(isValidDate("2024-02-29")).toBe(true);
    expect(isValidDate("2023-02-29")).toBe(false);
    expect(isValidDate("1990-13-01")).toBe(false);
    expect(isValidDate("27-12-1980")).toBe(false);
  });

  it("normalizes times to HH:MM:SS", () => {
    expect(normalizeTime("6:05")).toBe("06:05:00");
    expect(normalizeTime("22:46:07")).toBe("22:46:07");
    expect(normalizeTime("24:00")).toBeNull();
    expect(normalizeTime("abc")).toBeNull();
  });

  it("builds a kundli from valid input", () => {
    const r = validateBirthForm(filled());
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.kundli).toMatchObject({
      name: "Mahesh", datetime_local: "1980-12-27T22:46:00", tz: "Asia/Kolkata", lat: 31.71, lon: 76.93,
      place: "Mandi", settings: { ayanamsa: "lahiri", node: "mean" },
    });
    expect(r.kundli.id).toBeUndefined();
  });

  it("keeps the id when editing and names unnamed charts by date", () => {
    const r = validateBirthForm({ ...filled(), name: "" }, "abc");
    expect(r.ok && r.kundli.id).toBe("abc");
    expect(r.ok && r.kundli.name).toBe("1980-12-27 22:46");
  });

  it("reports missing date/time and place with i18n keys", () => {
    const r = validateBirthForm(initialFormValues());
    expect(r).toEqual({ ok: false, errors: expect.objectContaining({ date: "err_dt", time: "err_dt", place: "err_place", tz: "err_tz" }) });
  });

  it("rejects out-of-range coordinates and bad zones", () => {
    const r = validateBirthForm({ ...filled(), lat: "95", tz: "India time" });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errors).toMatchObject({ lat: "err_lat", tz: "err_tz", place: "err_place" });
    const bad = validateBirthForm({ ...filled(), date: "1990/01/01", time: "25:00" });
    expect(!bad.ok && bad.errors).toMatchObject({ date: "err_date_format", time: "err_time_format" });
    expect(validateBirthForm({ ...filled(), tz: "UTC" }).ok).toBe(true);
  });

  it("prefills from an existing kundli", () => {
    const v = initialFormValues({ name: "A", datetime_local: "2000-01-02T03:04:05", tz: "Europe/London", lat: 51.5, lon: -0.1, place: "London" });
    expect(v).toMatchObject({ date: "2000-01-02", time: "03:04:05", lat: "51.5", lon: "-0.1", tz: "Europe/London" });
    expect(v.place?.name).toBe("London");
  });
});
