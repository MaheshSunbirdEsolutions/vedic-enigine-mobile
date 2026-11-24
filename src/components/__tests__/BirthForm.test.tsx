import { fireEvent, screen } from "@testing-library/react-native";
import { BirthForm } from "@/components/kundli/BirthForm";
import { renderWithProviders } from "@/test/render";

jest.mock("@/api", () => ({ ...jest.requireActual("@/api"), engineApi: { meta: { places: jest.fn().mockResolvedValue([]) } } }));

describe("BirthForm", () => {
  it("shows validation errors and does not submit incomplete data", async () => {
    const onSubmit = jest.fn();
    await renderWithProviders(<BirthForm onSubmit={onSubmit} />);
    await fireEvent.press(screen.getByTestId("submit-birth"));
    expect(onSubmit).not.toHaveBeenCalled();
    expect(screen.getAllByText("Please enter date and time of birth.").length).toBeGreaterThan(0);
    expect(screen.getByTestId("field-tz")).toBeTruthy(); // advanced opened to show coordinate errors
  });

  it("submits a kundli built from typed coordinates", async () => {
    const onSubmit = jest.fn();
    await renderWithProviders(<BirthForm onSubmit={onSubmit} />);
    await fireEvent.changeText(screen.getByTestId("field-name"), "Asha");
    await fireEvent.changeText(screen.getByTestId("field-date"), "1990-05-14");
    await fireEvent.changeText(screen.getByTestId("field-time"), "6:30");
    await fireEvent.press(screen.getByTestId("toggle-advanced"));
    await fireEvent.changeText(screen.getByTestId("field-lat"), "28.6139");
    await fireEvent.changeText(screen.getByTestId("field-lon"), "77.209");
    await fireEvent.changeText(screen.getByTestId("field-tz"), "Asia/Kolkata");
    await fireEvent.press(screen.getByTestId("submit-birth"));
    expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({
      name: "Asha", datetime_local: "1990-05-14T06:30:00", lat: 28.6139, lon: 77.209, tz: "Asia/Kolkata",
    }));
  });

  it("keeps the id when editing an existing kundli", async () => {
    const onSubmit = jest.fn();
    await renderWithProviders(<BirthForm initial={{ id: "k1", name: "A", datetime_local: "2000-01-01T10:00:00", tz: "UTC", lat: 1, lon: 2 }} onSubmit={onSubmit} />);
    await fireEvent.press(screen.getByTestId("submit-birth"));
    expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ id: "k1", datetime_local: "2000-01-01T10:00:00" }));
  });
});

describe("PlaceSearch inside the form", () => {
  it("searches, picks a city and fills coordinates", async () => {
    const { engineApi } = jest.requireMock("@/api");
    engineApi.meta.places.mockResolvedValue([{ name: "Mandi", country: "India", lat: 31.71194, lon: 76.93273, tz: "Asia/Kolkata" }]);
    const onSubmit = jest.fn();
    await renderWithProviders(<BirthForm onSubmit={onSubmit} />);
    await fireEvent.changeText(screen.getByTestId("place-search"), "Mand");
    await fireEvent.press(await screen.findByTestId("place-search-item"));
    expect(engineApi.meta.places).toHaveBeenCalledWith("Mand", expect.anything());
    expect(screen.getByTestId("place-search")).toHaveProp("value", "Mandi, India");
    await fireEvent.changeText(screen.getByTestId("field-date"), "1980-12-27");
    await fireEvent.changeText(screen.getByTestId("field-time"), "22:46");
    await fireEvent.press(screen.getByTestId("submit-birth"));
    expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ place: "Mandi", tz: "Asia/Kolkata", lat: 31.71194 }));
  });
});
