import { screen } from "@testing-library/react-native";
import { TabIcon } from "@/components/TabIcon";
import { EmptyState, SegmentedControl } from "@/components/ui";
import { renderWithProviders } from "@/test/render";

describe("app chrome", () => {
  it("marks the active bottom tab", async () => {
    await renderWithProviders(<><TabIcon name="albums" focused color="#000" /><TabIcon name="sunny" focused={false} color="#000" /></>);
    expect(screen.getByTestId("tab-icon-albums-active")).toBeTruthy();
    expect(screen.getByTestId("tab-icon-sunny")).toBeTruthy();
  });

  it("empty state shows the logo mark, not a clipped text glyph", async () => {
    await renderWithProviders(<EmptyState message="Nothing yet" />);
    expect(screen.queryByText("ॐ")).toBeNull();
    expect(screen.getByText("Nothing yet")).toBeTruthy();
  });

  it("segmented control reports the selected tab", async () => {
    await renderWithProviders(<SegmentedControl testID="seg" value="b" onChange={() => {}} segments={[{ value: "a", label: "A" }, { value: "b", label: "B" }]} />);
    expect(screen.getByTestId("seg-b")).toHaveProp("accessibilityState", { selected: true });
    expect(screen.getByTestId("seg-a")).toHaveProp("accessibilityState", { selected: false });
  });
});
