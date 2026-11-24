/**
 * Contract tests: call a running Vedic Engine and check that its responses still have the
 * shape the app depends on. Skipped unless ENGINE_URL is set.
 *
 *   ENGINE_URL=http://127.0.0.1:8000 npm run test:contract
 *
 * Saved kundlis are created and deleted again; nothing else is written.
 */
import { createHttpClient } from "./client";
import { createEngineApi } from "./index";

const url = process.env.ENGINE_URL;
const d = url ? describe : describe.skip;

const birth = { datetime_local: "1980-12-27T22:46:00", tz: "Asia/Kolkata", lat: 31.7087, lon: 76.932, settings: { ayanamsa: "lahiri" as const, node: "mean" as const } };
const at = "2026-11-24T10:00:00";

d("engine contract", () => {
  const api = createEngineApi(createHttpClient({ getBaseUrl: () => url!, timeoutMs: 120_000, fetchImpl: fetch }));
  jest.setTimeout(180_000);

  it("health and i18n", async () => {
    expect(await api.meta.health()).toEqual({ ok: true });
    for (const lang of ["en", "hi"] as const) {
      const b = await api.meta.i18n(lang);
      expect(Object.keys(b.ui).length).toBeGreaterThan(100);
      for (const k of ["tab_chart", "saved_kundlis", "asc", "rashi", "simple_now"]) expect(b.ui[k]).toBeTruthy();
      if (lang === "hi") expect(b.abbr).toHaveProperty("Saturn"); // English abbreviations live in the app
    }
  });

  it("chart", async () => {
    const c = await api.astro.chart(birth);
    expect(c.lagna).toEqual(expect.objectContaining({ sign: expect.any(String), sign_index: expect.any(Number), degree_in_sign: expect.any(String) }));
    expect(Object.keys(c.planets)).toEqual(expect.arrayContaining(["Sun", "Moon", "Rahu", "Ketu"]));
    expect(c.planets.Moon.nakshatra).toEqual(expect.objectContaining({ name: expect.any(String), pada: expect.any(Number) }));
    expect(c.houses).toHaveLength(12);
    expect(c.vargas.D9.planets).toHaveProperty("Sun");
    expect(typeof c.doshas.manglik.present).toBe("boolean");
  });

  it("dasha, sade sati, interpretation", async () => {
    const dd = await api.astro.dasha(birth, at);
    expect(dd.current).toHaveLength(3);
    expect(dd.mahadashas[0].sub?.[0].sub?.[0]).toEqual(expect.objectContaining({ lord: expect.any(String), start: expect.any(String) }));
    const s = await api.astro.sadeSati(birth);
    expect(s.now).toEqual(expect.objectContaining({ saturn_sign: expect.any(String), sade_sati: expect.any(Boolean) }));
    const i = await api.astro.interpret(birth, "hi");
    expect(i.findings[0]).toEqual(expect.objectContaining({ id: expect.any(String), category: expect.any(String), nature: expect.any(String) }));
  });

  it("panchang, match, places", async () => {
    const p = await api.astro.panchang({ day: "2026-11-24", tz: "Asia/Kolkata", lat: 31.7, lon: 76.9 });
    expect(p.tithi).toEqual(expect.objectContaining({ name: expect.any(String), ends: expect.any(String) }));
    expect(p.rahu_kaal.start).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/);
    const m = await api.astro.match(birth, { ...birth, datetime_local: "1985-03-10T08:00:00" });
    expect(m.max).toBe(36);
    expect(Object.keys(m.kootas)).toHaveLength(8);
    const places = await api.meta.places("mandi");
    expect(places[0]).toEqual(expect.objectContaining({ name: "Mandi", tz: "Asia/Kolkata" }));
  });

  it("simple report and offline ask", async () => {
    const r = await api.reports.simple({ ...birth, lang: "en", at });
    expect(r.sections.map((s) => s.id)).toEqual(expect.arrayContaining(["now", "year", "months", "remedies"]));
    const a = await api.ask.ask({ ...birth, lang: "en", at, question: "When will I get a promotion?", use_ai: false });
    expect(a.mode).toBe("offline");
    expect(a.sections.length).toBeGreaterThan(0);
    expect(typeof (await api.ask.status()).ai).toBe("boolean");
  });

  it("saved kundli lifecycle and error mapping", async () => {
    const created = await api.kundlis.create({ ...birth, name: "Contract test" });
    expect(created.id).toBeTruthy();
    try {
      const updated = await api.kundlis.update(created.id!, { ...birth, name: "Contract test 2" });
      expect(updated.name).toBe("Contract test 2");
      expect((await api.kundlis.list("Contract test 2")).some((k) => k.id === created.id)).toBe(true);
    } finally {
      await api.kundlis.remove(created.id!);
    }
    await expect(api.kundlis.get(created.id!)).rejects.toMatchObject({ kind: "http", status: 404, detail: "kundli not found" });
    await expect(api.astro.chart({ ...birth, tz: "" } as never)).rejects.toMatchObject({ kind: "http" });
  });
});
