import { Platform, StyleSheet } from "react-native";
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

  it("segmented control keeps compact labels visible above the thumb on Android", async () => {
    const prevOs = Platform.OS;
    Object.defineProperty(Platform, "OS", { value: "android", configurable: true });
    try {
      await renderWithProviders(<SegmentedControl size="sm" testID="lang" value="en" onChange={() => {}} segments={[{ value: "en", label: "EN" }, { value: "hi", label: "हि" }]} />);
      const enItem = screen.getByTestId("lang-en");
      const flat = StyleSheet.flatten(enItem.props.style);
      expect(flat.zIndex).toBe(1);
      expect(screen.getByText("EN")).toHaveProp("allowFontScaling", false);
    } finally {
      Object.defineProperty(Platform, "OS", { value: prevOs, configurable: true });
    }
  });
});
