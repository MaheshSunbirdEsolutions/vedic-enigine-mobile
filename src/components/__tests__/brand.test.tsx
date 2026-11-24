import { screen } from "@testing-library/react-native";
import { BRAND_NAME, BrandTitle } from "@/components/BrandTitle";
import { Fab } from "@/components/ui";
import { renderWithProviders } from "@/test/render";

describe("brand and floating button", () => {
  it.each(["en", "hi"] as const)("keeps the brand name unchanged in %s", async (lang) => {
    await renderWithProviders(<BrandTitle />, { lang });
    expect(screen.getByText(BRAND_NAME)).toBeTruthy();
  });

  it("keeps the FAB label on one line", async () => {
    await renderWithProviders(<Fab icon="add" label="नई कुंडली" onPress={() => {}} testID="fab" />, { lang: "hi" });
    expect(screen.getByText("नई कुंडली")).toHaveProp("numberOfLines", 1);
  });
});
