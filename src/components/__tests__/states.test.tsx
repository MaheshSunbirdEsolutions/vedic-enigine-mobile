import { fireEvent, screen } from "@testing-library/react-native";
import { ApiError } from "@/api/errors";
import { QueryView } from "@/components/ui";
import { Text } from "@/components/ui/Text";
import { renderWithProviders } from "@/test/render";

type Q = Parameters<typeof QueryView<string[]>>[0]["query"];
const base = { data: undefined, error: null, isPending: false, isError: false, refetch: jest.fn() } as unknown as Q;

describe("QueryView", () => {
  it("shows a shimmer skeleton while loading", async () => {
    await renderWithProviders(<QueryView query={{ ...base, isPending: true }}>{() => <Text>data</Text>}</QueryView>);
    expect(screen.getByTestId("skeleton-cards")).toBeTruthy();
    expect(screen.queryByText("data")).toBeNull();
  });

  it("shows a translated error with a working retry", async () => {
    const refetch = jest.fn();
    await renderWithProviders(
      <QueryView query={{ ...base, isError: true, error: new ApiError({ kind: "network", path: "/" }), refetch }}>{() => null}</QueryView>,
    );
    expect(screen.getByText(/Cannot reach the Vedic Engine/)).toBeTruthy();
    await fireEvent.press(screen.getByTestId("error-state-retry"));
    expect(refetch).toHaveBeenCalled();
  });

  it("shows the empty state when the data is empty", async () => {
    await renderWithProviders(
      <QueryView query={{ ...base, data: [] }} isEmpty={(d) => d.length === 0} empty="Nothing here">{() => <Text>list</Text>}</QueryView>,
    );
    expect(screen.getByText("Nothing here")).toBeTruthy();
  });

  it("renders children with data", async () => {
    await renderWithProviders(<QueryView query={{ ...base, data: ["a"] }}>{(d) => <Text>{d.join()}</Text>}</QueryView>);
    expect(screen.getByText("a")).toBeTruthy();
  });

  it("shows HTTP error details from the engine", async () => {
    await renderWithProviders(
      <QueryView query={{ ...base, isError: true, error: new ApiError({ kind: "http", status: 422, path: "/", detail: "tz: invalid" }) }}>{() => null}</QueryView>,
    );
    expect(screen.getByText("tz: invalid")).toBeTruthy();
  });
});
