import { ApiError } from "@/api/errors";
import { env } from "@/config/env";
import { getEngineUrl, usePreferences } from "./preferences";
import { shouldRetry } from "./queryClient";

describe("preferences", () => {
  it("falls back to the env engine URL and honours an override", () => {
    expect(getEngineUrl()).toBe(env.engineUrl);
    usePreferences.getState().setEngineUrlOverride("http://10.0.2.2:8000");
    expect(getEngineUrl()).toBe("http://10.0.2.2:8000");
    usePreferences.getState().setEngineUrlOverride(null);
    expect(getEngineUrl()).toBe(env.engineUrl);
  });
  it("switches language and chart style", () => {
    usePreferences.getState().setLang("hi");
    usePreferences.getState().setChartStyle("south");
    expect(usePreferences.getState()).toMatchObject({ lang: "hi", chartStyle: "south" });
  });
});

describe("retry policy", () => {
  it("never retries client errors, retries transient ones twice", () => {
    expect(shouldRetry(0, new ApiError({ kind: "http", status: 404, path: "/" }))).toBe(false);
    expect(shouldRetry(0, new ApiError({ kind: "network", path: "/" }))).toBe(true);
    expect(shouldRetry(2, new ApiError({ kind: "timeout", path: "/" }))).toBe(false);
  });
});
