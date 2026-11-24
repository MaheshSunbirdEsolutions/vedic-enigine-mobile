import { fireEvent, screen, waitFor } from "@testing-library/react-native";
import { BirthForm } from "@/components/kundli/BirthForm";
import { renderWithProviders } from "@/test/render";

jest.mock("@/api", () => ({ ...jest.requireActual("@/api"), engineApi: { meta: { places: jest.fn().mockResolvedValue([]) } } }));

describe("BirthForm (react-hook-form + zod)", () => {
  it("shows validation errors and does not submit incomplete data", async () => {
    const onSubmit = jest.fn();
    await renderWithProviders(<BirthForm onSubmit={onSubmit} />);
    await fireEvent.press(screen.getByTestId("submit-birth"));
    await waitFor(() => expect(screen.getAllByText("Please enter date and time of birth.")).toHaveLength(2));
    expect(screen.getByText(/Please choose a birth place/)).toBeTruthy();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("hides each error as soon as that field becomes valid", async () => {
    await renderWithProviders(<BirthForm onSubmit={jest.fn()} />);
    await fireEvent.press(screen.getByTestId("submit-birth"));
    await waitFor(() => expect(screen.getAllByText("Please enter date and time of birth.")).toHaveLength(2));

    await fireEvent.changeText(screen.getByTestId("field-date"), "1990-05");
    await waitFor(() => expect(screen.getByText("Use the format YYYY-MM-DD.")).toBeTruthy());
    await fireEvent.changeText(screen.getByTestId("field-date"), "1990-05-14");
    await waitFor(() => expect(screen.queryByText("Use the format YYYY-MM-DD.")).toBeNull());
    expect(screen.getAllByText("Please enter date and time of birth.")).toHaveLength(1); // only time left

    await fireEvent.changeText(screen.getByTestId("field-time"), "6:30");
    await waitFor(() => expect(screen.queryByText("Please enter date and time of birth.")).toBeNull());

    await fireEvent.press(screen.getByTestId("toggle-advanced"));
    await fireEvent.changeText(screen.getByTestId("field-lat"), "28.6139");
    await fireEvent.changeText(screen.getByTestId("field-lon"), "77.209");
    await fireEvent.changeText(screen.getByTestId("field-tz"), "Asia/Kolkata");
    await waitFor(() => expect(screen.queryByText(/Please choose a birth place/)).toBeNull());
    expect(screen.queryByText("Between -90 and 90.")).toBeNull();
  });

  it("submits 12-hour input as 24-hour local time", async () => {
    const onSubmit = jest.fn();
    await renderWithProviders(<BirthForm onSubmit={onSubmit} />);
    await fireEvent.changeText(screen.getByTestId("field-name"), "Asha");
    await fireEvent.changeText(screen.getByTestId("field-date"), "1990-05-14");
    await fireEvent.changeText(screen.getByTestId("field-time"), "6:30");
    await fireEvent.press(screen.getByTestId("field-time-meridiem-PM"));
    await fireEvent.press(screen.getByTestId("toggle-advanced"));
    await fireEvent.changeText(screen.getByTestId("field-lat"), "28.6139");
    await fireEvent.changeText(screen.getByTestId("field-lon"), "77.209");
    await fireEvent.changeText(screen.getByTestId("field-tz"), "Asia/Kolkata");
    await fireEvent.press(screen.getByTestId("submit-birth"));
    await waitFor(() => expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({
      name: "Asha", datetime_local: "1990-05-14T18:30:00", lat: 28.6139, lon: 77.209, tz: "Asia/Kolkata",
    })));
  });

  it("keeps the id and shows existing time in 12-hour form when editing", async () => {
    const onSubmit = jest.fn();
    await renderWithProviders(<BirthForm initial={{ id: "k1", name: "A", datetime_local: "2000-01-01T22:00:00", tz: "UTC", lat: 1, lon: 2 }} onSubmit={onSubmit} />);
    expect(screen.getByTestId("field-time")).toHaveProp("value", "10:00");
    await fireEvent.press(screen.getByTestId("submit-birth"));
    await waitFor(() => expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ id: "k1", datetime_local: "2000-01-01T22:00:00" })));
  });
});

describe("PlaceSearch inside the form", () => {
  it("searches, picks a city and fills coordinates (clearing the place error)", async () => {
    const { engineApi } = jest.requireMock("@/api");
    engineApi.meta.places.mockResolvedValue([{ name: "Mandi", country: "India", lat: 31.71194, lon: 76.93273, tz: "Asia/Kolkata" }]);
    const onSubmit = jest.fn();
    await renderWithProviders(<BirthForm onSubmit={onSubmit} />);
    await fireEvent.press(screen.getByTestId("submit-birth"));
    await waitFor(() => expect(screen.getByText(/Please choose a birth place/)).toBeTruthy());
    await fireEvent.changeText(screen.getByTestId("place-search"), "Mand");
    await fireEvent.press(await screen.findByTestId("place-search-item"));
    expect(engineApi.meta.places).toHaveBeenCalledWith("Mand", expect.anything());
    expect(screen.getByTestId("place-search")).toHaveProp("value", "Mandi, India");
    await waitFor(() => expect(screen.queryByText(/Please choose a birth place/)).toBeNull());
    await fireEvent.changeText(screen.getByTestId("field-date"), "1980-12-27");
    await fireEvent.changeText(screen.getByTestId("field-time"), "10:46");
    await fireEvent.press(screen.getByTestId("field-time-meridiem-PM"));
    await fireEvent.press(screen.getByTestId("submit-birth"));
    await waitFor(() => expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({
      place: "Mandi", tz: "Asia/Kolkata", lat: 31.71194, datetime_local: "1980-12-27T22:46:00",
    })));
  });
});
