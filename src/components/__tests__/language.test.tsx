import { act, fireEvent, render, screen, waitFor } from "@testing-library/react-native";
import { QueryClientProvider } from "@tanstack/react-query";
import { Text } from "react-native";
import en from "@/__fixtures__/i18n_en.json";
import hi from "@/__fixtures__/i18n_hi.json";
import { LanguageSwitch } from "@/components/LanguageSwitch";
import { keepAcrossLanguage } from "@/hooks/useAstro";
import { I18nProvider, useI18n } from "@/i18n/I18nProvider";
import { usePreferences } from "@/state/preferences";
import { testQueryClient } from "@/test/render";

jest.mock("@/api", () => ({
  ...jest.requireActual("@/api"),
  engineApi: { meta: { i18n: jest.fn((lang: string) => Promise.resolve(lang === "hi" ? require("@/__fixtures__/i18n_hi.json") : require("@/__fixtures__/i18n_en.json"))) } },
}));
const mockI18n = jest.requireMock("@/api").engineApi.meta.i18n as jest.Mock;

function Probe() {
  const { t, lang } = useI18n();
  return <Text testID="probe">{lang}:{t("tab_chart")}</Text>;
}

describe("language switch", () => {
  beforeEach(() => { usePreferences.setState({ lang: "en" }); mockI18n.mockClear(); });

  it("prefetches both languages and switches without showing raw keys", async () => {
    await render(
      <QueryClientProvider client={testQueryClient()}>
        <I18nProvider><LanguageSwitch /><Probe /></I18nProvider>
      </QueryClientProvider>,
    );
    await waitFor(() => expect(screen.getByTestId("probe")).toHaveTextContent(`en:${en.ui.tab_chart}`));
    expect(mockI18n.mock.calls.map((c) => c[0]).sort()).toEqual(expect.arrayContaining(["en", "hi"]));

    await fireEvent.press(screen.getByTestId("header-lang-hi"));
    await act(async () => { await new Promise((r) => setTimeout(r, 400)); });
    await waitFor(() => expect(screen.getByTestId("probe")).toHaveTextContent(`hi:${hi.ui.tab_chart}`));
    expect(screen.getByTestId("probe")).not.toHaveTextContent("tab_chart");
    expect(usePreferences.getState().lang).toBe("hi");
  });
});

describe("keepAcrossLanguage", () => {
  const birth = ["1980-12-27T22:46:00", "Asia/Kolkata", 31.7, 76.9, "lahiri", "mean"];
  it("keeps data only when nothing but the language changed", () => {
    const prev = { queryKey: ["interpret", "en", ...birth] };
    expect(keepAcrossLanguage("old", prev, ["interpret", "hi", ...birth], 1)).toBe("old");
    expect(keepAcrossLanguage("old", prev, ["interpret", "hi", "2000-01-01T00:00:00", ...birth.slice(1)], 1)).toBeUndefined();
    expect(keepAcrossLanguage(undefined, prev, ["interpret", "hi", ...birth], 1)).toBeUndefined();
  });
});
