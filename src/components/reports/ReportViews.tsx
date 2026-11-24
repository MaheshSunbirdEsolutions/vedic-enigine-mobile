/**
 * The 11 detailed reports, ported from web/components/Reports.tsx so the phone shows the same
 * content as the web app. Each view takes the engine payload for POST /report/<id>.
 * The 12th, the simple summary, is SimpleReportView in components/tabs.
 */
import { useState } from "react";
import { Linking, View } from "react-native";
import { Chip, DataTable, SegmentedControl, Stat, StatRow, Text } from "@/components/ui";
import { isCurrent } from "@/domain/dasha";
import { formatDate, humanize } from "@/domain/format";
import { useI18n } from "@/i18n/I18nProvider";
import { makeStyles, radius, spacing, useTheme } from "@/theme";
import {
  AfflList, BhavTable, Block, Bullets, ChartGrid, Chips, Fold, H2, H3, HealthWatch, LabelLine, LkChart, MiniChart, NakDoshas,
  Note, P, PageLinks, PlacementCard, RemedyDays, RemedyPlan, RemedySet, RinBlock, ScoreBar, rateTone, verdictTone, type Json,
} from "./parts";

const PLANETS = ["Sun", "Moon", "Mars", "Mercury", "Jupiter", "Venus", "Saturn", "Rahu", "Ketu"];
const SIGNS = ["Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo", "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"];
const ym = (s: string) => s.slice(0, 7);

// ---------- Current issues & remedies ----------
export function IssuesReport({ r }: { r: Json }) {
  const { t, T, lang } = useI18n();
  const tp = r.tithi_pravesha, ss = r.sade_sati;
  return (
    <>
      <StatRow>
        <Stat label={t("as_of")} value={formatDate(r.as_of, lang)} />
        <Stat label={t("running_now")} value={r.dasha_now.map(T).join(" / ")} />
        <Stat label={t("age_running")} value={String(r.age_running)} />
        {tp ? <Stat label={t("tp")} value={`${formatDate(tp.moment, lang)} → ${formatDate(tp.valid_until, lang)}`}>
          <Text variant="small">{t("vara_lord")}: {T(tp.vara_lord)} · {t("hora_lord")}: {T(tp.hora_lord)}</Text>
        </Stat> : null}
        <Stat label={t("tab_sade")} value={ss.sade_sati ? T(ss.phase) : ss.dhaiya ? T(ss.dhaiya) : t("no")} />
      </StatRow>
      {r.issues.map((i: Json) => (
        <Block key={i.rank} tone={i.priority === "high" ? "bad" : i.priority === "medium" ? "mixed" : "neutral"}
          title={`${i.rank}. ${i.area_name}`} right={<Chip tone={i.priority === "high" ? "bad" : i.priority === "medium" ? "mixed" : "neutral"} label={t(i.priority)} />}>
          <Note>{t("key_planet")}: {T(i.key_planet)} · {lang === "hi" ? "अंक" : "score"} {i.score}</Note>
          <ScoreBar ratio={(i.score * 7) / 100} tone={i.priority === "high" ? "bad" : i.priority === "medium" ? "mixed" : "accent"} />
          {i.house_info ? <Note>{t("this_house")} {i.house_info.house} – {i.house_info.name}: {i.house_info.meaning}</Note> : null}
          <Text weight="semibold">{t("why")}:</Text>
          <Bullets items={i.evidence.map((e: Json) => `${e.text} (${e.source})`)} />
          <Text weight="semibold">{t("key_planet")}:</Text>
          <PlacementCard pl={i.remedies.full.placement} />
          {i.other_planets?.length > 0 && <Fold summary={t("also_involved")}>{i.other_planets.map((pl: Json) => <PlacementCard key={pl.planet} pl={pl} compact />)}</Fold>}
          <Fold summary={`${t("remedies")} – ${T(i.key_planet)}`} open={i.rank <= 2}><RemedySet fs={i.remedies.full} /></Fold>
        </Block>
      ))}
      <RemedyDays days={r.remedy_days} note={r.remedy_days_note} />
      <NakDoshas list={r.nakshatra_doshas} />
      <HealthWatch rows={r.health_watch} />
      <RinBlock rin={r.rin} rules={r.upay_rules} />
      <H2>{t("natal_afflictions")}</H2>
      <AfflList list={r.natal_afflictions} />
      <Note>{r.disclaimer}</Note>
    </>
  );
}

// ---------- Dosha analysis ("what's wrong") ----------
export function DoshaReport({ r }: { r: Json }) {
  const { t } = useI18n();
  const bad = r.interpretation.filter((f: Json) => f.nature === "challenging" || f.category === "dosha");
  return (
    <>
      <AfflList list={r.afflictions} />
      <NakDoshas list={r.nakshatra_doshas || []} />
      <RemedyPlan plan={r.remedy_plan} />
      {bad.length > 0 && (
        <>
          <H2>{`${t("cat_dosha")} / ${t("cat_yoga")}`}</H2>
          {bad.map((f: Json) => <Block key={f.id} tone="bad" title={f.name}><P>{f.text}</P><Note>{t("source")}: {f.source}</Note></Block>)}
        </>
      )}
    </>
  );
}

// ---------- Full kundli ----------
export function FullReport({ r }: { r: Json }) {
  const { t, T, lang } = useI18n();
  const c = r.chart, j = r.jaimini, av = r.ashtakavarga;
  const vargas = Object.keys(c.vargas);
  const vmap = (D: string) => Object.fromEntries(Object.entries<any>(c.vargas[D].planets).map(([p, s]) => [p, SIGNS.indexOf(s)]));
  const d1 = Object.fromEntries(Object.entries<any>(c.planets).map(([p, v]) => [p, v.sign_index - 1]));
  const short = (s: string) => (lang === "en" ? s.slice(0, 3) : T(s));
  const [chartSet, setChartSet] = useState<"main" | "more">("main");
  const charts = chartSet === "main" ? ["D1", "D9", "D10"] : ["D2", "D4", "D7", "D12", "D24", "D60"];
  const planetRows = Object.entries<any>(c.planets).map(([p, v]) => ({ p, v }));
  const savTotal = av.sav.reduce((a: number, b: number) => a + b, 0);
  return (
    <>
      <SegmentedControl value={chartSet} onChange={setChartSet} segments={[{ value: "main", label: "D1 · D9 · D10" }, { value: "more", label: "D2 – D60" }]} />
      <ChartGrid>
        {charts.filter((D) => D === "D1" || c.vargas[D]).map((D) => (
          <MiniChart key={D} caption={D} lagna={D === "D1" ? c.lagna.sign_index - 1 : SIGNS.indexOf(c.vargas[D].lagna)} planets={D === "D1" ? d1 : vmap(D)} />
        ))}
      </ChartGrid>
      <H3>{t("positions")}</H3>
      <DataTable scroll rows={planetRows} rowKey={(x) => x.p} columns={[
        { key: "g", label: t("graha"), width: 90, render: (x) => <Text weight="semibold">{T(x.p)}</Text> },
        { key: "s", label: t("sign"), width: 100, render: (x) => T(x.v.sign) },
        { key: "d", label: t("degree"), width: 90, render: (x) => x.v.degree_in_sign },
        { key: "n", label: t("nakshatra"), width: 150, render: (x) => `${T(x.v.nakshatra.name)} (${x.v.nakshatra.pada})` },
        { key: "h", label: t("house"), width: 60, render: (x) => String(x.v.house) },
        { key: "y", label: t("dignity"), width: 110, render: (x) => (x.v.dignity === "n/a" ? "—" : T(x.v.dignity)) },
      ]} />
      <H3>{t("bhav_table")}</H3>
      <BhavTable rows={r.bhavas} />
      <H3>{t("planets_explained")}</H3>
      {r.placements.map((pl: Json) => <PlacementCard key={pl.planet} pl={pl} />)}
      <H3>{t("vargas_all")}</H3>
      <DataTable scroll rows={["Lagna", ...Object.keys(c.planets)]} rowKey={(p) => p} columns={[
        { key: "g", label: t("graha"), width: 80, render: (p) => <Text weight="semibold">{T(p)}</Text> },
        ...vargas.map((D) => ({ key: D, label: D, width: 54, render: (p: string) => short(p === "Lagna" ? c.vargas[D].lagna : c.vargas[D].planets[p]) })),
      ]} />
      <H3>{t("karakas")}</H3>
      <DataTable rows={Object.entries<any>(j.karakas)} rowKey={([k]) => k} columns={[
        { key: "k", label: "", flex: 0.6, render: ([k]) => <Text weight="semibold">{k}</Text> },
        { key: "p", label: t("graha"), flex: 0.8, render: ([, v]) => T(v.planet) },
        { key: "m", label: t("meaning"), flex: 1.6, render: ([, v]) => <Text variant="small">{v.meaning}</Text> },
      ]} />
      <H3>{t("arudhas")}</H3>
      <DataTable rows={Object.entries<any>(j.arudhas)} rowKey={([k]) => k} columns={[
        { key: "k", label: "", render: ([k]) => <Text weight="semibold">{k}</Text> },
        { key: "s", label: t("sign"), render: ([, v]) => T(v) },
        { key: "h", label: t("house"), render: ([k]) => String(j.arudha_houses[k]) },
      ]} />
      <H3>{t("sav")}</H3>
      <SavRow signs={av.signs.map(short)} values={av.sav} total={savTotal} />
      <H3>{t("dasha_ad")}</H3>
      {r.dasha.mahadashas.map((md: Json) => (
        <Block key={md.start} tone={isCurrent(md) ? "accent" : "neutral"} title={`${T(md.lord)} · ${formatDate(md.start, lang)} → ${formatDate(md.end, lang)}`}>
          <Note>{md.sub.map((a: Json) => `${T(a.lord)} ${ym(a.start)}`).join(" · ")}</Note>
        </Block>
      ))}
      <H2>{t("tab_interp")}</H2>
      {r.interpretation.map((f: Json) => (
        <Block key={f.id} tone={f.nature === "benefic" ? "good" : f.nature === "challenging" ? "bad" : "mixed"} title={f.name}>
          <P>{f.text}</P><Note>{t("source")}: {f.source}</Note>
        </Block>
      ))}
      <H2>{t("natal_afflictions")}</H2>
      <AfflList list={r.afflictions} />
      <RemedyPlan plan={r.remedy_plan} />
    </>
  );
}

function SavRow({ signs, values, total }: { signs: string[]; values: number[]; total: number }) {
  const s = useStyles();
  const th = useTheme();
  return (
    <View style={s.sav}>
      {signs.map((sg, i) => {
        const v = values[i];
        const color = v >= 30 ? th.colors.good : v < 25 ? th.colors.bad : th.colors.ink;
        return (
          <View key={sg + i} style={s.savCell}>
            <Text variant="label">{sg}</Text>
            <Text weight={v >= 30 || v < 25 ? "bold" : "medium"} style={{ color }}>{v}</Text>
          </View>
        );
      })}
      <View style={[s.savCell, s.savTotal]}><Text variant="label">Σ</Text><Text weight="bold">{total}</Text></View>
    </View>
  );
}

// ---------- Life areas ----------
export function LifeAreasReport({ r }: { r: Json }) {
  const { t, T } = useI18n();
  return (
    <>
      {r.areas.map((a: Json) => (
        <Block key={a.area} tone={verdictTone(a.verdict_key)} title={a.title} right={<Chip tone={verdictTone(a.verdict_key)} label={a.verdict} />}>
          <Note>{t("house")} {a.house} ({T(a.sign)}, {T(a.lord)}) · {a.varga} · {T(a.karaka)}{a.chara_karaka ? ` · ${T(a.chara_karaka)}` : ""}</Note>
          {a.house_info ? <Note>{t("this_house")} {a.house_info.name}: {a.house_info.meaning}</Note> : null}
          <Bullets items={a.points.map((p: Json) => p.text)} />
          {a.lord_placement ? <><Text weight="semibold">{t("house_lord_sits")}:</Text><PlacementCard pl={a.lord_placement} compact /></> : null}
          {a.occupants?.length > 0 && <Fold summary={`${t("planets_in_house")} (${a.occupants.length})`}>{a.occupants.map((pl: Json) => <PlacementCard key={pl.planet} pl={pl} compact />)}</Fold>}
          {a.periods.length > 0 && <LabelLine label={t("periods")}>{a.periods.map((w: Json) => `${T(w.md)}–${T(w.ad)} (${ym(w.start)} → ${ym(w.end)})`).join(" · ")}</LabelLine>}
          {a.remedy ? <Fold summary={`${t("remedies")} – ${T(a.lord)}`}><RemedySet fs={a.remedy} /></Fold> : null}
        </Block>
      ))}
      <Note>{r.areas[0]?.source}</Note>
    </>
  );
}

// ---------- Lal Kitab ----------
function LkRows({ list, annual, books }: { list: Json[]; annual: boolean; books: Json }) {
  const { t, T } = useI18n();
  return (
    <>
      {list.map((e: Json) => {
        const x = annual ? e.annual : e;
        return (
          <Block key={e.planet} tone={x.pakka_ghar ? "good" : "neutral"}
            title={`${T(e.planet)} – ${t("house")} ${x.house}${x.house_info ? ` (${x.house_info.name})` : ""}`}
            right={x.pakka_ghar ? <Chip tone="good" label={t("pakka")} /> : undefined}>
            {x.title_hi ? <Note>“{x.title_hi}”</Note> : null}
            {x.house_info ? <Note>{t("meaning")}: {x.house_info.meaning}</Note> : null}
            {x.theme ? <P>{x.theme}</P> : null}
            {x.upay?.length ? <><Text weight="semibold">{t("lk_upay")}:</Text><Bullets items={x.upay} /></> : <Note>{t("upay_pending")}</Note>}
            <Note>Lal Kitab (Arun Sanhita), p. {x.book_page} · {t("read_in_book")}:</Note>
            <PageLinks kind="lalkitab" pages={x.pdf_pages || []} books={books} />
            {e.vedic ? <Fold summary={t("vedic_view")}><PlacementCard pl={e.vedic} /></Fold> : null}
            {e.other_remedies ? <Fold summary={t("other_remedies")}><RemedySet fs={e.other_remedies} /></Fold> : null}
          </Block>
        );
      })}
    </>
  );
}

export function LalKitabReport({ r, books }: { r: Json; books: Json }) {
  const { t, T } = useI18n();
  return (
    <>
      <Note>{t("lk_note")}</Note>
      <ChartGrid>
        <LkChart caption={t("lk_chart")} houses={r.varshphal.natal_houses} />
        <LkChart caption={`${t("lk_annual")} (${t("age_running")} ${r.age})`} houses={r.varshphal.annual_houses} />
      </ChartGrid>
      <LabelLine label={t("empty_houses")}>{r.empty_houses.join(", ")}</LabelLine>
      <LkRows list={r.planets} annual={false} books={books} />
      <H3>{t("lk_quick")}</H3>
      <Bullets items={r.quick.filter(Boolean).map((q: Json) => <Text key={q.planet}><Text weight="semibold">{T(q.planet)}: </Text>{q.text}</Text>)} />
      <Note>{r.quick.find(Boolean)?.source}</Note>
      <RinBlock rin={r.rin} rules={r.rules} />
    </>
  );
}

// ---------- Varshphal ----------
export function VarshphalReport({ r, books }: { r: Json; books: Json }) {
  const { t, T } = useI18n();
  const tp = r.tithi_pravesha, tc = tp.chart;
  const d1 = Object.fromEntries(Object.entries<any>(tc.planets).map(([p, v]) => [p, v.sign_index - 1]));
  const rows = Object.entries<any>(tc.planets).map(([p, v]) => ({ p, v }));
  return (
    <>
      <H3>{t("tp")}</H3>
      <StatRow>
        <Stat label={t("start")} value={tp.moment.replace("T", " ").slice(0, 16)} />
        <Stat label={t("valid_until")} value={tp.valid_until.replace("T", " ").slice(0, 16)} />
        <Stat label={t("vara_lord")} value={T(tp.vara_lord)} />
        <Stat label={t("hora_lord")} value={T(tp.hora_lord)} />
        <Stat label={t("lagna")} value={T(tc.lagna.sign)} />
      </StatRow>
      <ChartGrid>
        <MiniChart caption={t("tp")} lagna={tc.lagna.sign_index - 1} planets={d1} />
        <LkChart caption={`${t("lk_annual")} (${t("year")} ${r.age})`} houses={r.lal_kitab.varshphal.annual_houses} />
      </ChartGrid>
      <DataTable scroll rows={rows} rowKey={(x) => x.p} columns={[
        { key: "g", label: t("graha"), width: 84, render: (x) => <Text weight="semibold">{T(x.p)}</Text> },
        { key: "h", label: `${t("house")} (TP)`, width: 80, render: (x) => String(x.v.house) },
        { key: "b", label: t("bhav"), width: 110, render: (x) => r.bhav_names?.[x.v.house]?.name ?? "" },
        { key: "s", label: t("sign"), width: 100, render: (x) => T(x.v.sign) },
        { key: "d", label: t("dignity"), width: 100, render: (x) => (x.v.dignity === "n/a" ? "—" : T(x.v.dignity)) },
        { key: "m", label: t("meaning"), width: 220, render: (x) => <Text variant="small">{r.bhav_names?.[x.v.house]?.meaning ?? ""}</Text> },
      ]} />
      {tp.placements ? <Fold summary={t("planets_explained")}>{tp.placements.map((pl: Json) => <PlacementCard key={pl.planet} pl={pl} compact />)}</Fold> : null}
      <H3>{t("lk_annual")}</H3>
      <LkRows list={r.lal_kitab.planets} annual books={books} />
    </>
  );
}

// ---------- Nakshatra & remedy muhurta ----------
export function NakshatraReport({ r }: { r: Json }) {
  const { t, T } = useI18n();
  return (
    <>
      <StatRow>
        <Stat label={t("janma_nak")} value={`${T(r.janma_nakshatra)} (${r.pada})`}><Text variant="small">{T(r.lord)}</Text></Stat>
        <Stat label={t("anujanma")} value={T(r.anujanma)} />
        <Stat label={t("trijanma")} value={T(r.trijanma)} />
        <Stat label={t("ghat_nak")} value={T(r.ghat_nakshatra)} />
      </StatRow>
      <NakDoshas list={r.birth_doshas} showEmpty />
      {r.planets_considered?.length > 0 && <Note>{t("considered")}: {r.planets_considered.map(T).join(", ")}</Note>}
      <RemedyDays days={r.remedy_days} note={r.remedy_days_note} />
      <H3>{t("taras")}</H3>
      {r.taras.map((x: Json, i: number) => (
        <Block key={i} tone={x.good === true ? "good" : x.good === false ? "bad" : "neutral"} title={`${i + 1}. ${x.tara}`}
          right={x.good === true ? <Chip tone="good" label={t("good")} /> : x.good === false ? <Chip tone="bad" label={t("avoid")} /> : undefined}>
          <Note>{x.meaning}</Note>
          <Text>{x.nakshatras.map(T).join(", ")}</Text>
        </Block>
      ))}
      <HealthWatch rows={r.health} />
      {r.placements?.length > 0 && <Fold summary={t("planets_explained")}>{r.placements.map((pl: Json) => <PlacementCard key={pl.planet} pl={pl} />)}</Fold>}
      <Note>{r.source}</Note>
    </>
  );
}

// ---------- Temples & tantra ----------
const DOSHA_KEYS = ["manglik", "kaal_sarp", "pitra", "sade_sati", "guru_chandal", "surya_grahan", "chandra_grahan", "shrapit", "vish", "angarak"];

function TempleCard({ x }: { x: Json }) {
  const { t, T } = useI18n();
  const host = (u: string) => { try { return new URL(u).hostname.replace("www.", ""); } catch { return u; } };
  return (
    <Block tone="accent" title={x.name}>
      <Note>{x.place}, {x.state}</Note>
      <Chips>
        {x.planets.map((p: string) => <Chip key={p} tone="neutral" label={T(p)} />)}
        {x.doshas.slice(0, 4).map((d: string) => <Chip key={d} tone="mixed" label={humanize(d)} />)}
      </Chips>
      <P>{x.what}</P>
      <Note>{t("when_to_go")}: {x.when} · {t("deity_label")}: {x.deity}</Note>
      {x.reasons?.length > 0 && <LabelLine label={t("why_here")}>{x.reasons.join("; ")}</LabelLine>}
      <Chips>
        {x.sources.map((u: string, i: number) => <Chip key={i} tone="neutral" label={host(u)} onPress={() => void Linking.openURL(u)} />)}
      </Chips>
    </Block>
  );
}

export function TirthaReport({ r }: { r: Json }) {
  const { t, T, lang } = useI18n();
  const [fp, setFp] = useState("");
  const [fd, setFd] = useState("");
  const list = r.directory.filter((x: Json) => (!fp || x.planets.includes(fp)) && (!fd || x.doshas.includes(fd)));
  const tn = r.tantra;
  return (
    <>
      <Note>{r.note}</Note>
      <H2>{t("temples_for_you")}</H2>
      {r.planets_considered?.length > 0 && <Note>{t("considered")}: {r.planets_considered.map(T).join(", ")}</Note>}
      {r.suggested.map((x: Json) => <TempleCard key={x.id} x={x} />)}
      {r.next_ashlesha?.length > 0 && (
        <LabelLine label={t("next_ashlesha")}>
          {r.next_ashlesha.map((a: Json) => formatDate(a.date, lang) + (a.from !== "sunrise" ? ` (${t("from_time")} ${a.from.slice(11, 16)})` : "")).join(" · ")}
        </LabelLine>
      )}

      <H2>{t("tantra_layer")}</H2>
      <Note>{t("tantra_mapping_note")}</Note>
      <H3>{t("for_you")}</H3>
      {tn.for_you.map((m: Json) => <Block key={m.planet} tone="mixed" title={`${T(m.planet)} → ${m.mahavidya}`}><Bullets items={m.items} /></Block>)}
      <H3>{t("tantra_principles")}</H3>
      <Bullets ordered items={tn.principles.map((p: Json) => `${p.text} (${t("book_page")} ${p.page})`)} />
      <Note>{tn.book}</Note>
      <H3>{t("ten_flowers")}</H3>
      <P>{tn.ten_flowers.verse}</P>
      <Chips>{tn.ten_flowers.flowers.map((f: Json) => <Chip key={f.key} tone="good" label={f.name} />)}</Chips>
      <Note>{tn.ten_flowers.source}</Note>
      <Fold summary={t("mahavidya_table")}>
        {tn.mahavidyas.map((m: Json) => (
          <Block key={m.planet} title={`${T(m.planet)} · ${m.mahavidya}`}>
            <Note>{m.essence}</Note>
            <LabelLine label={t("open_practice")}>{`${m.practice} (${m.days})`}</LabelLine>
            <LabelLine label={t("inner_flowers")}>{m.inner_flowers.join(", ")}</LabelLine>
          </Block>
        ))}
      </Fold>
      <Note>{tn.excluded_note}</Note>

      <H2>{t("temple_directory")}</H2>
      <Text variant="label">{t("planet")}</Text>
      <SegmentedControl scroll value={fp || "all"} onChange={(v) => setFp(v === "all" ? "" : v)}
        segments={[{ value: "all", label: t("all") }, ...PLANETS.map((p) => ({ value: p, label: T(p) }))]} />
      <Text variant="label">{t("dosha")}</Text>
      <SegmentedControl scroll value={fd || "all"} onChange={(v) => setFd(v === "all" ? "" : v)}
        segments={[{ value: "all", label: t("all") }, ...DOSHA_KEYS.map((d) => ({ value: d, label: humanize(d) }))]} />
      {list.length === 0 ? <Note>{t("none")}</Note> : list.map((x: Json) => <TempleCard key={x.id} x={x} />)}
    </>
  );
}

// ---------- Life-long prediction ----------
export function LifelongReport({ r }: { r: Json }) {
  const { t, T, lang } = useI18n();
  const s = useStyles();
  const th = useTheme();
  const o = r.overview, st = r.story;
  return (
    <>
      {st ? (
        <>
          <H2>{t("life_story")}</H2>
          <View style={s.timeline}>
            {st.chapters.map((c: Json) => (
              <View key={c.n} style={[s.seg, { flex: Math.max(1, c.age_to - c.age_from), backgroundColor: th.tones[rateTone(c.rating)].bg },
                c.status === "present" && { borderColor: th.colors.accent, borderWidth: 2 }]}>
                <Text variant="label" numberOfLines={1} style={{ color: th.tones[rateTone(c.rating)].fg }}>{T(c.lord)}</Text>
                <Text variant="small" numberOfLines={1}>{Math.round(c.age_from)}</Text>
              </View>
            ))}
          </View>
          {st.prologue.map((p: string, i: number) => <P key={i}>{p}</P>)}
          {st.chapters.map((c: Json) => (
            <Block key={c.n} tone={c.status === "present" ? "accent" : rateTone(c.rating)} title={c.title}
              right={<Chip tone={rateTone(c.rating)} label={c.rating_label} />}>
              <Note>
                {t("chapter")} {c.n} · {c.start.slice(0, 4)}–{c.end.slice(0, 4)} · {t("age")} {Math.round(c.age_from)}–{Math.round(c.age_to)}
                {c.status === "present" ? ` · ${t("current_period")}` : ""}
              </Note>
              {c.paragraphs.map((p: string, i: number) => <Text key={i} weight={i === 0 ? "medium" : undefined} style={s.para}>{p}</Text>)}
            </Block>
          ))}
          {st.epilogue.map((p: string, i: number) => <P key={i}>{p}</P>)}
        </>
      ) : null}
      <Fold summary={t("detailed_analysis")}>
        <H2>{t("overview")}</H2>
        <P>{o.text}</P>
        <StatRow>
          <Stat label={t("strongest")} value={o.strongest.map(T).join(", ")} />
          <Stat label={t("weakest")} value={o.weakest.map(T).join(", ")} />
        </StatRow>
        {o.yogas.length > 0 && <><Text weight="semibold">{t("yogas_present")}:</Text><Chips>{o.yogas.map((y: string) => <Chip key={y} tone="good" label={y} />)}</Chips></>}
        {o.doshas.length > 0 && <><Text weight="semibold">{t("cat_dosha")} / {t("natal_afflictions")}:</Text><Chips>{o.doshas.map((a: Json, i: number) => <Chip key={i} tone="bad" label={a.text} />)}</Chips></>}

        <H2>{t("dasha_journey")}</H2>
        {r.journey.map((m: Json) => (
          <Block key={m.lord + m.start} tone={m.current ? "accent" : rateTone(m.rating)} title={`${T(m.lord)} ${t("mahadasha")}`}
            right={<Chip tone={rateTone(m.rating)} label={m.rating_label} />}>
            <Note>{formatDate(m.start, lang)} → {formatDate(m.end, lang)} · {t("age")} {m.age_from}–{m.age_to}{m.current ? ` · ${t("current_period")}` : ""}</Note>
            <P>{m.text}</P>
            <Note>{m.reasons.join(" · ")}</Note>
            {m.best_ad ? (
              <Note>
                {t("best_period")}: {T(m.best_ad.lord)} ({ym(m.best_ad.start)} → {ym(m.best_ad.end)}) · {t("hardest_period")}: {T(m.hardest_ad.lord)} ({ym(m.hardest_ad.start)} → {ym(m.hardest_ad.end)})
              </Note>
            ) : null}
            <Fold summary={`${t("antardashas")} (${m.antardashas.length})`} open={m.current}>
              <DataTable scroll rows={m.antardashas} rowKey={(a: Json) => a.start} highlight={(a: Json) => isCurrent({ start: a.start, end: a.end })} columns={[
                { key: "l", label: "AD", width: 80, render: (a: Json) => <Text weight="semibold">{T(a.lord)}</Text> },
                { key: "s", label: t("start"), width: 100, render: (a: Json) => a.start },
                { key: "e", label: t("end"), width: 100, render: (a: Json) => a.end },
                { key: "a", label: t("age"), width: 50, render: (a: Json) => String(a.age_from) },
                { key: "r", label: t("rating"), width: 120, render: (a: Json) => <Chip tone={rateTone(a.rating)} label={a.rating_label} /> },
                { key: "m", label: t("meaning"), width: 240, render: (a: Json) => <Text variant="small">{a.themes.join("; ")}</Text> },
              ]} />
            </Fold>
          </Block>
        ))}

        <H2>{t("milestones")}</H2>
        <DataTable rows={r.milestones} rowKey={(_m: Json, i: number) => String(i)} columns={[
          { key: "a", label: t("age"), flex: 0.4, render: (m: Json) => <Text weight="semibold">{String(m.age)}</Text> },
          { key: "d", label: `${t("start")} – ${t("end")}`, flex: 1, render: (m: Json) => <Text variant="small">{m.start} – {m.end || "—"}</Text> },
          { key: "x", label: "", flex: 1.6, render: (m: Json) => m.text },
        ]} />

        <H2>{t("life_areas_summary")}</H2>
        {r.life_areas.map((a: Json) => (
          <Block key={a.area} tone={verdictTone(a.verdict_key)} title={a.title} right={<Chip tone={verdictTone(a.verdict_key)} label={a.verdict} />}>
            <Bullets items={a.points} />
            {a.periods.length > 0 && <Note>{t("windows")}: {a.periods.map((w: Json) => `${T(w.md)}–${T(w.ad)} (${ym(w.start)} → ${ym(w.end)})`).join(" · ")}</Note>}
          </Block>
        ))}
      </Fold>
      <Note>{t("method")}: {r.method}</Note>
      <Note>{r.disclaimer} {t("remedy_hint")}</Note>
    </>
  );
}

// ---------- Year-wise prediction ----------
export function YearlyReport({ r, onYear }: { r: Json; onYear: (y: number) => void }) {
  const { t, T, lang } = useI18n();
  const s = useStyles();
  const tp = r.tithi_pravesha;
  return (
    <>
      <View style={s.yearHead}>
        <Text variant="hero">{r.year}</Text>
        <Chip tone={rateTone(r.rating)} label={r.rating_label} />
      </View>
      <P>{r.summary}</P>

      <H3>{t("area_outlook")}</H3>
      {r.areas.map((a: Json) => (
        <Block key={a.area} tone={rateTone(a.rating)} title={a.title} right={<Chip tone={rateTone(a.rating)} label={a.rating_label} />}>
          <Bullets items={a.reasons} />
        </Block>
      ))}

      <H3>{t("dasha_periods_year")}</H3>
      {r.periods.map((p: Json) => (
        <Block key={p.start} tone={rateTone(p.rating)} title={`${T(p.md)} / ${T(p.ad)}`} right={<Chip tone={rateTone(p.rating)} label={p.rating_label} />}>
          <Note>{formatDate(p.start, lang)} → {formatDate(p.end, lang)}</Note>
          <P>{p.themes.join("; ")}</P>
          <Note>{p.reasons.join(" · ")}</Note>
        </Block>
      ))}

      <H3>{t("transits_year")}</H3>
      <DataTable scroll rows={r.transits} rowKey={(_x: Json, i: number) => String(i)} columns={[
        { key: "g", label: t("graha"), width: 80, render: (x: Json) => <Text weight="semibold">{T(x.planet)}</Text> },
        { key: "s", label: t("sign"), width: 100, render: (x: Json) => T(x.sign) },
        { key: "f", label: t("start"), width: 100, render: (x: Json) => x.from },
        { key: "t", label: t("end"), width: 100, render: (x: Json) => x.to },
        { key: "h", label: "", width: 260, render: (x: Json) => <View><Chip tone={x.good ? "good" : "bad"} label={String(x.house_from_moon)} /><Text variant="small">{x.text}</Text></View> },
      ]} />
      {(r.sade_sati?.sade_sati || r.sade_sati?.dhaiya) && <LabelLine label={t("tab_sade")}>{r.sade_sati.sade_sati ? T(r.sade_sati.phase) : T(r.sade_sati.dhaiya)}</LabelLine>}

      <H3>{t("month_by_month")}</H3>
      <View style={s.months}>
        {r.months.map((m: Json) => (
          <View key={m.month} style={s.month}>
            <Text variant="label">{m.month}</Text>
            <Chip tone={rateTone(m.rating)} label={m.rating_label} />
            {m.notes?.length ? <Text variant="small">{m.notes.join(" · ")}</Text> : null}
          </View>
        ))}
      </View>

      {tp ? (
        <>
          <H3>{t("tp_year")}</H3>
          <P>{formatDate(tp.moment, lang)} → {formatDate(tp.valid_until, lang)} · {t("lagna")}: {T(tp.lagna)} · {t("vara_lord")}: {T(tp.vara_lord)} ({T(tp.vara_nature)}) · {t("hora_lord")}: {T(tp.hora_lord)} ({T(tp.hora_nature)})</P>
        </>
      ) : null}
      {r.lal_kitab ? <Note>{t("lk_year")} ({t("year")} {r.lal_kitab.age}): {Object.entries<any>(r.lal_kitab.houses).map(([p, h]) => `${T(p)} ${h}`).join(" · ")}</Note> : null}

      <H3>{t("years_ahead")}</H3>
      <DataTable scroll rows={r.years} rowKey={(y: Json) => String(y.year)} highlight={(y: Json) => y.year === r.year} columns={[
        { key: "y", label: t("year"), width: 70, render: (y: Json) => <Chip tone="accent" label={String(y.year)} onPress={() => onYear(y.year)} /> },
        { key: "a", label: t("age"), width: 50, render: (y: Json) => String(y.age) },
        { key: "r", label: t("rating"), width: 120, render: (y: Json) => <Chip tone={rateTone(y.rating)} label={y.rating_label} /> },
        { key: "d", label: t("mahadasha"), width: 130, render: (y: Json) => y.dasha },
        { key: "j", label: t("jupiter_sign"), width: 100, render: (y: Json) => T(y.jupiter) },
        { key: "s", label: t("saturn_sign"), width: 100, render: (y: Json) => T(y.saturn) },
        { key: "x", label: t("tab_sade"), width: 90, render: (y: Json) => (y.sade_sati ? "✓" : y.dhaiya ? T(y.dhaiya) : "—") },
      ]} />
      <Note>{t("remedy_hint")}</Note>
    </>
  );
}

// ---------- Bhrigu Samhita ----------
export function BhriguReport({ r, books }: { r: Json; books: Json }) {
  const { t, T } = useI18n();
  return (
    <>
      <Note>{t("ocr_note")}</Note>
      <H3>{`${t("bhrigu_lagna")}: ${T(r.lagna)}`}</H3>
      {r.readings.map((x: Json) => (
        <Block key={x.planet} tone={x.found ? "accent" : "neutral"} title={`${T(x.planet)} – ${t("house")} ${x.house}`} right={<Text variant="small">p. {x.printed_page}</Text>}>
          {x.found ? (
            <><P>{x.text_hi}</P><PageLinks kind="bhrigu" pages={[x.pdf_page]} books={books} offset={8} /></>
          ) : (
            <><Note>{t("not_split")}</Note><PageLinks kind="bhrigu" pages={x.block_pdf_pages} books={books} offset={8} /></>
          )}
        </Block>
      ))}
      <Note>{r.source}</Note>
    </>
  );
}


const useStyles = makeStyles((t) => ({
  sav: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginBottom: spacing.sm },
  savCell: { width: 52, alignItems: "center", paddingVertical: 6, borderRadius: radius.sm, backgroundColor: t.colors.card, borderWidth: 0.5, borderColor: t.colors.line },
  savTotal: { backgroundColor: t.colors.accentSoft },
  timeline: { flexDirection: "row", gap: 3, marginBottom: spacing.md },
  seg: { borderRadius: radius.xs, paddingVertical: 6, paddingHorizontal: 3, alignItems: "center", minWidth: 0, borderWidth: 0, borderColor: "transparent" },
  para: { marginBottom: spacing.sm },
  yearHead: { flexDirection: "row", alignItems: "center", gap: spacing.md, marginBottom: spacing.sm },
  months: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, marginBottom: spacing.sm },
  month: { flexBasis: "47%", flexGrow: 1, padding: spacing.md, borderRadius: radius.md, backgroundColor: t.colors.card, borderWidth: 0.5, borderColor: t.colors.line, gap: 4 },
}));
