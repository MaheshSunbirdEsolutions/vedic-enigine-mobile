import type { HttpClient } from "./client";
import { createEngineApi } from "./index";
import { birthKey, queryKeys } from "./queryKeys";

const birth = { datetime_local: "1990-05-14T06:30:00", tz: "Asia/Kolkata", lat: 28.6, lon: 77.2 };

function fakeClient() {
  const request = jest.fn().mockResolvedValue({});
  return { client: { request } as unknown as HttpClient, request };
}

describe("engine endpoints", () => {
  it("builds the documented requests", async () => {
    const { client, request } = fakeClient();
    const api = createEngineApi(client);
    await api.kundlis.list("ram");
    await api.kundlis.get("a/b");
    await api.kundlis.update("1", { ...birth, name: "X" });
    await api.kundlis.remove("1");
    await api.astro.dasha(birth, "2026-01-01T00:00:00");
    await api.astro.match(birth, birth);
    await api.reports.simple({ ...birth, lang: "hi", at: "2026-01-01T00:00:00" });
    await api.ask.ask({ ...birth, lang: "en", at: "x", question: "q?", use_ai: true });
    await api.meta.places("mandi");

    const calls = request.mock.calls.map(([path, o]) => [path, o]);
    expect(calls[0]).toEqual(["/kundlis", expect.objectContaining({ query: { q: "ram" } })]);
    expect(calls[1][0]).toBe("/kundlis/a%2Fb");
    expect(calls[2]).toEqual(["/kundlis/1", expect.objectContaining({ method: "PUT" })]);
    expect(calls[3]).toEqual(["/kundlis/1", { method: "DELETE" }]);
    expect(calls[4][1].body).toMatchObject({ levels: 3, at: "2026-01-01T00:00:00", tz: "Asia/Kolkata" });
    expect(calls[5][1].body).toEqual({ groom: birth, bride: birth });
    expect(calls[6]).toEqual(["/report/simple", expect.objectContaining({ body: expect.objectContaining({ lang: "hi" }) })]);
    expect(calls[7][1].timeoutMs).toBe(120000); // AI answers get a longer timeout
    expect(calls[8]).toEqual(["/places", expect.objectContaining({ query: { q: "mandi", limit: 10 } })]);
  });
});

describe("query keys", () => {
  it("change when any calculation input changes", () => {
    const a = queryKeys.chartBundle(birth);
    expect(queryKeys.chartBundle({ ...birth })).toEqual(a);
    expect(queryKeys.chartBundle({ ...birth, settings: { ayanamsa: "raman", node: "mean" } })).not.toEqual(a);
    expect(birthKey(birth)).toContain("lahiri");
  });
});
