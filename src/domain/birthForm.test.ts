import { defaultBirthValues, isValidDate, placeFields, validateBirthForm, type BirthFormValues } from "./birthForm";
import { isValidTime12, to12h, to24h } from "./time12";

const place = { name: "Mandi", country: "India", lat: 31.71, lon: 76.93, tz: "Asia/Kolkata" };
const filled = (): BirthFormValues => ({ ...defaultBirthValues(), ...placeFields(place), name: " Mahesh ", date: "1980-12-27", time: "10:46", meridiem: "PM" });

describe("12-hour time", () => {
  it("converts both ways, including midnight and noon", () => {
    expect(to24h("10:46", "PM")).toBe("22:46:00");
    expect(to24h("12:05", "AM")).toBe("00:05:00");
    expect(to24h("12:30", "PM")).toBe("12:30:00");
    expect(to24h("6:30:15", "AM")).toBe("06:30:15");
    expect(to24h("13:00", "PM")).toBeNull();
    expect(to12h("22:46:00")).toEqual({ time: "10:46", meridiem: "PM" });
    expect(to12h("00:05:00")).toEqual({ time: "12:05", meridiem: "AM" });
    expect(to12h("12:00:07")).toEqual({ time: "12:00:07", meridiem: "PM" });
  });
  it("accepts only 1–12 hours", () => {
    expect(isValidTime12("9:05")).toBe(true);
    expect(isValidTime12("00:30")).toBe(false);
    expect(isValidTime12("22:46")).toBe(false);
  });
});

describe("birth form schema", () => {
  it("validates dates including leap years", () => {
    expect(isValidDate("2024-02-29")).toBe(true);
    expect(isValidDate("2023-02-29")).toBe(false);
    expect(isValidDate("1990-13-01")).toBe(false);
  });

  it("builds a kundli with 24-hour time from valid input", () => {
    const r = validateBirthForm(filled());
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.kundli).toMatchObject({
      name: "Mahesh", gender: "other", datetime_local: "1980-12-27T22:46:00", tz: "Asia/Kolkata", lat: 31.71, lon: 76.93,
      place: "Mandi", settings: { ayanamsa: "lahiri", node: "mean" },
    });
    expect(r.kundli.id).toBeUndefined();
  });

  it("keeps the id when editing and names unnamed charts by date and time", () => {
    const r = validateBirthForm({ ...filled(), name: "" }, "abc");
    expect(r.ok && r.kundli.id).toBe("abc");
    expect(r.ok && r.kundli.name).toBe("1980-12-27 10:46 PM");
  });

  it("separates 'required' from 'wrong format' messages", () => {
    const empty = validateBirthForm(defaultBirthValues());
    expect(!empty.ok && empty.errors).toMatchObject({ date: "err_dt", time: "err_dt", place: "err_place", tz: "err_tz", lat: "err_lat" });
    const bad = validateBirthForm({ ...filled(), date: "1990/01/01", time: "22:46" });
    expect(!bad.ok && bad.errors).toMatchObject({ date: "err_date_format", time: "err_time_format" });
  });

  it("rejects out-of-range coordinates and bad zones; UTC is fine", () => {
    const r = validateBirthForm({ ...filled(), lat: "95", tz: "India time" });
    expect(!r.ok && r.errors).toMatchObject({ lat: "err_lat", tz: "err_tz", place: "err_place" });
    expect(validateBirthForm({ ...filled(), tz: "UTC" }).ok).toBe(true);
  });

  it("prefills an existing kundli in 12-hour form", () => {
    const v = defaultBirthValues({ name: "A", datetime_local: "2000-01-02T15:04:05", tz: "Europe/London", lat: 51.5, lon: -0.1, place: "London" });
    expect(v).toMatchObject({ date: "2000-01-02", time: "03:04:05", meridiem: "PM", gender: "other", lat: "51.5", lon: "-0.1", tz: "Europe/London" });
    expect(v.place?.name).toBe("London");
  });
});
