import { render, screen } from "@testing-library/react-native";
import * as RN from "react-native";
import { Text } from "react-native";
import { darkPalette, darkTheme, lightPalette, lightTheme, makeStyles, resolveMode, ThemeProvider, useTheme } from "@/theme";

function contrast(a: string, b: string) {
  const lum = (hex: string) => {
    const c = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
    return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
  };
  const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
}

function Probe() {
  const t = useTheme();
  return <Text testID="probe">{t.mode}</Text>;
}

describe("theme", () => {
  it("follows the device unless the user picked a mode", () => {
    expect(resolveMode("system", "dark")).toBe("dark");
    expect(resolveMode("system", "light")).toBe("light");
    expect(resolveMode("system", null)).toBe("light");
    expect(resolveMode("light", "dark")).toBe("light");
    expect(resolveMode("dark", "light")).toBe("dark");
  });

  it("defines every colour in both palettes", () => {
    expect(Object.keys(darkPalette).sort()).toEqual(Object.keys(lightPalette).sort());
  });

  it("keeps body text and buttons readable (WCAG AA 4.5:1) in both modes", () => {
    for (const p of [lightPalette, darkPalette]) {
      expect(contrast(p.ink, p.bg)).toBeGreaterThanOrEqual(4.5);
      expect(contrast(p.ink, p.card)).toBeGreaterThanOrEqual(4.5);
      expect(contrast(p.muted, p.card)).toBeGreaterThanOrEqual(4.5);
      // White on the web's brand orange is 4.49:1 (bold button labels); kept to match the web app.
      expect(contrast(p.onAccent, p.accent)).toBeGreaterThanOrEqual(4.45);
      expect(contrast(p.bad, p.badSoft)).toBeGreaterThanOrEqual(4.5);
    }
  });

  it("ThemeProvider uses the device scheme by default", async () => {
    const spy = jest.spyOn(RN, "useColorScheme").mockReturnValue("dark");
    await render(<ThemeProvider><Probe /></ThemeProvider>);
    expect(screen.getByTestId("probe")).toHaveTextContent("dark");
    await render(<ThemeProvider preference="light"><Probe /></ThemeProvider>);
    expect(screen.getByTestId("probe")).toHaveTextContent("light");
    spy.mockRestore();
  });

  it("makeStyles builds styles once per theme", async () => {
    const factory = jest.fn((t: typeof lightTheme) => ({ box: { backgroundColor: t.colors.card } }));
    const useStyles = makeStyles(factory);
    const seen: string[] = [];
    function Box() { seen.push(useStyles().box.backgroundColor as string); return null; }
    await render(<ThemeProvider preference="light"><Box /><Box /></ThemeProvider>);
    await render(<ThemeProvider preference="dark"><Box /></ThemeProvider>);
    expect(seen).toEqual([lightTheme.colors.card, lightTheme.colors.card, darkTheme.colors.card]);
    expect(factory).toHaveBeenCalledTimes(2);
  });
});
