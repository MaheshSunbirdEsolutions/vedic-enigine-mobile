/**
 * Builds self-contained printable/PDF HTML for each of the 12 report sub-tabs.
 * Pure functions, no React — tested directly in unit tests.
 */
import type { Translator } from "@/i18n/translate";
import type { Chart, Kundli, SimpleReport } from "@/types/api";
import { labelsBySign, SIGNS } from "./chart";
import { labelPositions, NORTH_LINES, NORTH_PLANET_ANCHOR, NORTH_SIGN_ANCHOR } from "./chartGeometry";
import { describeBirth } from "./birth";
import { formatDate, humanize } from "./format";

export type ReportExportKey =
  | "simple" | "daily" | "lifepred" | "yearpred" | "issues" | "wrong" | "full"
  | "life" | "varsh" | "lk" | "nak" | "tirtha" | "bhrigu";

type Json = any;

export type BuildReportHtmlParams = {
  key: ReportExportKey;
  title: string;
  kundli: Kundli;
  data: unknown;
  translator: Translator;
  chart?: Chart;
  year?: number;
};

const esc = (v: unknown): string =>
  String(v ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const ym = (s: string) => (s ? s.slice(0, 7) : "");

const tag = (label: string, tone: "good" | "bad" | "mixed" | "accent" | "neutral" = "neutral") =>
  `<span class="badge badge-${tone}">${esc(label)}</span>`;

const toneOfRating = (r?: string): "good" | "bad" | "mixed" | "neutral" =>
  r === "excellent" || r === "good" ? "good" : r === "mixed" || r === "average" ? "mixed" : r ? "bad" : "neutral";

const toneOfVerdict = (v?: string): "good" | "bad" | "mixed" | "neutral" =>
  v === "strong" ? "good" : v === "weak" ? "bad" : v ? "mixed" : "neutral";

const toneOfSeverity = (n: number): "bad" | "mixed" | "neutral" =>
  n >= 3 ? "bad" : n === 2 ? "mixed" : "neutral";

const h2 = (s: string) => `<h2>${esc(s)}</h2>`;
const h3 = (s: string) => `<h3>${esc(s)}</h3>`;
const p = (s: string, cls = "") => `<p${cls ? ` class="${cls}"` : ""}>${esc(s)}</p>`;
const note = (s: string) => (s ? `<p class="note">${esc(s)}</p>` : "");
const labelLine = (label: string, val: string) => `<p><strong>${esc(label)}:</strong> ${esc(val)}</p>`;

const bullets = (items: string[], ordered = false) => {
  if (!items.length) return "";
  const el = ordered ? "ol" : "ul";
  return `<${el}>${items.map((x) => `<li>${esc(x)}</li>`).join("")}</${el}>`;
};

const table = (headers: string[], rows: string[][]) => {
  if (!rows.length) return "";
  return `<table><thead><tr>${headers.map((h) => `<th>${esc(h)}</th>`).join("")}</tr></thead><tbody>${rows
    .map((r) => `<tr>${r.map((c) => `<td>${esc(c)}</td>`).join("")}</tr>`)
    .join("")}</tbody></table>`;
};

const statsGrid = (items: { label: string; value: string }[]) =>
  `<div class="stats">${items
    .filter((i) => i.value)
    .map((i) => `<div class="stat"><div class="stat-label">${esc(i.label)}</div><div class="stat-val">${esc(i.value)}</div></div>`)
    .join("")}</div>`;

function northChartSvg(caption: string, lagna: number, planets: Record<string, number>, tr: Translator): string {
  const bySign = labelsBySign(planets, tr.abbr);
  const items = NORTH_PLANET_ANCHOR.map((anchor, house) => {
    const sign = (lagna + house) % 12;
    const labels = bySign[sign] ?? [];
    const [sx, sy] = NORTH_SIGN_ANCHOR[house];
    const pts = labelPositions(anchor, labels.length);
    return `<text x="${sx}" y="${sy}" font-size="11" fill="#8b735b" text-anchor="middle">${sign + 1}</text>${pts
      .map(([x, y], k) => `<text x="${x}" y="${y + 4}" font-size="13" font-weight="600" fill="#2b2420" text-anchor="middle">${esc(labels[k])}</text>`)
      .join("")}`;
  }).join("");

  return `<div class="chart-card"><div class="chart-cap">${esc(caption)}</div><svg viewBox="-2 -2 404 404" width="220" height="220" xmlns="http://www.w3.org/2000/svg">
    <rect x="0" y="0" width="400" height="400" fill="#fffdf9" stroke="#c9b9a6" stroke-width="2" />
    <path d="${NORTH_LINES}" fill="none" stroke="#c9b9a6" stroke-width="1.5" />
    <text x="200" y="62" font-size="11" font-weight="700" fill="#c2571a" text-anchor="middle">${esc(tr.t("asc"))}</text>
    ${items}
  </svg></div>`;
}

function placementHtml(pl: Json, tr: Translator): string {
  if (!pl) return "";
  const house = tr.lang === "hi" ? `${pl.house}वाँ भाव (${pl.bhav})` : `${pl.house} house (${pl.bhav})`;
  return `<div class="card">
    <div class="card-head"><strong>${esc(tr.T(pl.planet))} · ${esc(house)} · ${esc(tr.T(pl.sign))} ${esc(pl.degree ?? "")}</strong>
    ${tag(tr.t(`strength_${pl.strength}`), pl.strength === "strong" ? "good" : pl.strength === "weak" ? "bad" : "neutral")}</div>
    ${p(pl.text)}
  </div>`;
}

function remedySetHtml(fs: Json, tr: Translator): string {
  if (!fs) return "";
  return `<div class="remedies">
    ${tag(tr.t(`approach_${fs.approach}`), fs.approach === "strengthen" ? "good" : "mixed")}
    ${fs.approach_text ? p(fs.approach_text) : ""}
    ${(fs.systems ?? [])
      .map(
        (sys: Json) => `<div class="subcard">
          <strong>${esc(tr.t(`sys_${sys.id}`))}</strong>
          ${sys.items?.length ? bullets(sys.items) : ""}
          ${note(sys.note ?? "")}${note(sys.source ?? "")}
        </div>`,
      )
      .join("")}
  </div>`;
}

function nakDoshasHtml(list: Json[], tr: Translator, showEmpty = false): string {
  if (!list?.length) return showEmpty ? `${h3(tr.t("nak_doshas"))}${note(tr.t("no_nak_doshas"))}` : "";
  return `${h3(tr.t("nak_doshas"))}${list
    .map(
      (x) => `<div class="card">
        <div class="card-head"><strong>${esc(x.text)}</strong>${tag(`${tr.t("severity")} ${x.severity}`, toneOfSeverity(x.severity))}</div>
        ${bullets(x.remedies ?? [])}${note(x.source ?? "")}
      </div>`,
    )
    .join("")}`;
}

function healthWatchHtml(rows: Json[], tr: Translator): string {
  if (!rows?.length) return "";
  return `${h3(tr.t("health_watch"))}${table(
    [tr.t("point"), tr.t("nakshatra"), tr.t("body_parts"), tr.t("watch_for")],
    rows.map((r) => [tr.T(r.point), tr.T(r.nakshatra), r.parts ?? "", r.watch ?? ""]),
  )}${note(`${tr.t("health_disclaimer")} · ${rows[0].source ?? ""}`)}`;
}

function remedyDaysHtml(days: Json[], noteText: string | undefined, tr: Translator): string {
  if (!days?.length) return "";
  return `${h2(tr.t("remedy_days"))}${note(noteText ?? "")}${table(
    [tr.t("date"), tr.t("weekday"), tr.t("nakshatra"), tr.t("yogas"), tr.t("tara"), tr.t("for_planet")],
    days.map((d) => [
      formatDate(d.date, tr.lang),
      d.weekday ?? "",
      `${tr.T(d.nakshatra)} (${tr.T(d.tithi)})`,
      (d.yogas ?? []).join(", "),
      d.tara ?? "",
      (d.for_planets ?? []).map(tr.T).join(", ") || "—",
    ]),
  )}`;
}

function afflHtml(list: Json[], tr: Translator): string {
  if (!list?.length) return note(tr.t("no_afflictions"));
  return ["dosha", "yuti", "position"]
    .map((cat) => {
      const xs = list.filter((a) => a.category === cat);
      if (!xs.length) return "";
      return `${h3(`${tr.t(`cat_${cat}`)} (${xs.length})`)}${xs
        .map(
          (a) => `<div class="card">
            <div class="card-head"><strong>${esc(a.text)}</strong>${tag(`${tr.t("severity")} ${a.severity}`, toneOfSeverity(a.severity))}</div>
            ${note(`${tr.t("house")}: ${(a.houses ?? []).join(", ")} · ${tr.t("affects")}: ${(a.areas ?? []).map(humanize).join(", ")}`)}
          </div>`,
        )
        .join("")}`;
    })
    .join("");
}

function rinHtml(rin: Json[], rules: Json[] | undefined, tr: Translator): string {
  const rows = rin?.length
    ? rin
        .map(
          (x) => `<div class="card">
            <strong>${esc(x.name)}</strong>
            ${labelLine(tr.t("rin_trigger"), `${(x.trigger ?? []).map(tr.T).join(", ")} → ${tr.t("house")} ${(x.houses ?? []).join("/")}`)}
            ${labelLine(tr.t("rin_sign"), x.sign ?? "")}
            ${labelLine(tr.t("family_upay"), x.upay ?? "")}
            ${note(x.source ?? "")}
          </div>`,
        )
        .join("")
    : note(tr.t("no_rin"));
  const rulesHtml = rules?.length ? `${h3(tr.t("upay_rules"))}${bullets(rules.map((r) => `${r.text} (${r.source})`))}` : "";
  return `${h2(tr.t("rin"))}${rows}${rulesHtml}`;
}

function remedyPlanHtml(plan: Json[], tr: Translator): string {
  if (!plan?.length) return "";
  return `${h2(tr.t("remedy_plan"))}${plan
    .map(
      (fs) => `<div class="card">
        <div class="card-head"><strong>${esc(tr.T(fs.planet))}</strong>${tag(`${tr.t("severity")} ${fs.severity}`, toneOfSeverity(fs.severity))}</div>
        ${labelLine(tr.t("why_afflicted"), (fs.reasons ?? []).join("; "))}
        ${placementHtml(fs.placement, tr)}
        ${remedySetHtml(fs, tr)}
      </div>`,
    )
    .join("")}`;
}

function lkRowsHtml(list: Json[], annual: boolean, tr: Translator): string {
  return (list ?? [])
    .map((e) => {
      const x = annual ? e.annual : e;
      return `<div class="card">
        <div class="card-head"><strong>${esc(tr.T(e.planet))} – ${esc(tr.t("house"))} ${esc(x.house)}${x.house_info ? ` (${esc(x.house_info.name)})` : ""}</strong>
        ${x.pakka_ghar ? tag(tr.t("pakka"), "good") : ""}</div>
        ${x.title_hi ? note(`“${x.title_hi}”`) : ""}
        ${x.house_info ? note(`${tr.t("meaning")}: ${x.house_info.meaning}`) : ""}
        ${x.theme ? p(x.theme) : ""}
        ${x.upay?.length ? `<p><strong>${esc(tr.t("lk_upay"))}:</strong></p>${bullets(x.upay)}` : note(tr.t("upay_pending"))}
      </div>`;
    })
    .join("");
}

function simpleBody(r: SimpleReport, tr: Translator): string {
  const badge = r.rating_label ? `<p>${tag(`${tr.t("simple_now")}: ${r.rating_label}`, toneOfRating(r.rating))}</p>` : "";
  const secs = (r.sections ?? [])
    .map(
      (s) => `${h2(s.title)}
        ${(s.paras ?? []).map((t) => p(t)).join("")}
        ${s.months?.length ? `<div class="chips">${s.months.map((m) => tag(`${m.label}: ${m.rating_label}`, toneOfRating(m.rating))).join(" ")}</div>` : ""}
        ${s.items?.length ? s.items.map((it) => `<div class="card">${tag(it.priority_label, it.priority === "high" ? "bad" : "mixed")} ${p(it.text)}</div>`).join("") : ""}
        ${s.plans?.length ? s.plans.map((pl) => `<div class="card"><strong>${esc(tr.T(pl.planet))} · ${esc(tr.T(pl.day))}</strong>${p(pl.why)}${bullets(pl.steps, true)}</div>`).join("") : ""}`,
    )
    .join("");
  return `${badge}${secs}${note(r.closing ?? "")}`;
}

function dailyBody(r: Json, tr: Translator): string {
  const p0 = r.panchang ?? {};
  const cb = r.chandrabala ?? {};
  const tb = r.tarabala;
  const tip = r.daily_tip;
  const tm = (s?: string) => (s ? s.slice(11, 16) : "");
  const stats = statsGrid([
    { label: `${tr.t("vara")} / ${tr.t("tithi")}`, value: `${tr.T(p0.vara)} · ${tr.T(p0.tithi?.paksha)} ${tr.T(p0.tithi?.name)}` },
    { label: tr.t("nakshatra"), value: `${tr.T(p0.nakshatra?.name)} (${tr.t("ends")} ${tm(p0.nakshatra?.ends)})` },
    { label: tr.t("chandrabala"), value: `${tr.T(cb.moon_sign)} (${cb.house_from_moon}) · ${cb.label} (${tr.t("bindus")}: ${cb.bindus})` },
    ...(tb ? [{ label: tr.t("tarabala"), value: `${tb.name} · ${tb.meaning}` }] : []),
    ...(r.dasha_now?.length ? [{ label: tr.t("running_now"), value: r.dasha_now.map(tr.T).join(" / ") }] : []),
    { label: tr.t("rahu_kaal"), value: `${tm(p0.rahu_kaal?.start)}–${tm(p0.rahu_kaal?.end)}` },
  ]);
  const tipHtml = tip
    ? `<div class="card"><strong>${esc(tr.t("daily_tip"))} · ${esc(tr.T(tip.planet))}</strong>
        ${labelLine(tr.t("lucky_colour"), tip.colour ?? "")}
        ${p(tip.practice ?? "")}
        ${note(`${tr.t("sys_mantra")}: ${tip.mantra ?? ""} · ${tr.t("daana")}: ${tip.daana ?? ""}`)}
      </div>`
    : "";
  const areasHtml = (r.areas ?? [])
    .map((a: Json) => `<div class="card"><div class="card-head"><strong>${esc(a.title)}</strong>${tag(a.rating_label, toneOfRating(a.rating))}</div>${bullets(a.reasons ?? [])}</div>`)
    .join("");
  const transitsHtml = table(
    [tr.t("graha"), tr.t("sign"), tr.t("nakshatra"), tr.t("house"), tr.t("bindus"), ""],
    (r.transits ?? []).map((x: Json) => [
      tr.T(x.planet), tr.T(x.sign), tr.T(x.nakshatra), `${x.house_from_moon}/${x.house_from_lagna ?? ""}`, String(x.bindus ?? "—"), x.text ?? "",
    ]),
  );
  return `<p>${tag(`${formatDate(r.date, tr.lang)} · ${r.rating_label}`, toneOfRating(r.rating))}</p>
    ${p(r.summary ?? "")}
    ${stats}
    <div class="card"><strong>${esc(tr.t("daily_favour"))}</strong>${bullets(r.guidance?.favour ?? [])}</div>
    <div class="card"><strong>${esc(tr.t("daily_avoid"))}</strong>${bullets(r.guidance?.avoid ?? [])}</div>
    ${tipHtml}
    ${h3(tr.t("area_outlook"))}${areasHtml}
    ${h3(tr.t("transits_today"))}${transitsHtml}
    ${note(`${tr.t("method")}: ${r.method ?? ""}`)}
    ${note(r.disclaimer ?? "")}`;
}

function lifelongBody(r: Json, tr: Translator): string {
  const st = r.story, o = r.overview;
  const storyHtml = st
    ? `${h2(tr.t("life_story"))}
      <div class="grid-4">${(st.chapters ?? [])
        .map(
          (c: Json) => `<div class="tile${c.status === "present" ? " tile-active" : ""}">
            <div class="tile-title">${esc(tr.T(c.lord))}</div>
            <div class="tile-sub">${Math.round(c.age_from)}–${Math.round(c.age_to)}</div>
          </div>`,
        )
        .join("")}</div>
      ${(st.prologue ?? []).map((x: string) => p(x)).join("")}
      ${(st.chapters ?? [])
        .map(
          (c: Json) => `<div class="card">
            <div class="card-head"><strong>${esc(c.title)}</strong>${tag(c.rating_label, toneOfRating(c.rating))}</div>
            ${note(`${tr.t("chapter")} ${c.n} · ${String(c.start).slice(0, 4)}–${String(c.end).slice(0, 4)} · ${tr.t("age")} ${Math.round(c.age_from)}–${Math.round(c.age_to)}`)}
            ${(c.paragraphs ?? []).map((x: string) => p(x)).join("")}
          </div>`,
        )
        .join("")}
      ${(st.epilogue ?? []).map((x: string) => p(x)).join("")}`
    : "";

  const overviewHtml = o
    ? `${h2(tr.t("overview"))}${p(o.text)}
      ${statsGrid([
        { label: tr.t("strongest"), value: (o.strongest ?? []).map(tr.T).join(", ") },
        { label: tr.t("weakest"), value: (o.weakest ?? []).map(tr.T).join(", ") },
      ])}
      ${o.yogas?.length ? labelLine(tr.t("yogas_present"), o.yogas.join(", ")) : ""}`
    : "";

  const journeyHtml = r.journey?.length
    ? `${h2(tr.t("dasha_journey"))}${r.journey
        .map(
          (m: Json) => `<div class="card">
            <div class="card-head"><strong>${esc(tr.T(m.lord))} ${esc(tr.t("mahadasha"))}</strong>${tag(m.rating_label, toneOfRating(m.rating))}</div>
            ${note(`${formatDate(m.start, tr.lang)} → ${formatDate(m.end, tr.lang)} · ${tr.t("age")} ${m.age_from}–${m.age_to}`)}
            ${p(m.text)}
          </div>`,
        )
        .join("")}`
    : "";

  const milesHtml = r.milestones?.length
    ? `${h2(tr.t("milestones"))}${table(
        [tr.t("age"), `${tr.t("start")} – ${tr.t("end")}`, ""],
        r.milestones.map((m: Json) => [String(m.age), `${m.start} – ${m.end || "—"}`, m.text ?? ""]),
      )}`
    : "";

  return `${storyHtml}${overviewHtml}${journeyHtml}${milesHtml}${note(r.method ?? "")}${note(r.disclaimer ?? "")}`;
}

function yearlyBody(r: Json, tr: Translator): string {
  const tp = r.tithi_pravesha;
  return `${statsGrid([
    { label: tr.t("year"), value: String(r.year) },
    { label: tr.t("rating"), value: r.rating_label ?? "" },
    { label: tr.t("age"), value: r.age != null ? String(r.age) : "" },
  ])}${p(r.summary ?? "")}
  ${h3(tr.t("area_outlook"))}${(r.areas ?? [])
    .map((a: Json) => `<div class="card"><div class="card-head"><strong>${esc(a.title)}</strong>${tag(a.rating_label, toneOfRating(a.rating))}</div>${bullets(a.reasons ?? [])}</div>`)
    .join("")}
  ${h3(tr.t("dasha_periods_year"))}${(r.periods ?? [])
    .map((x: Json) => `<div class="card"><div class="card-head"><strong>${esc(tr.T(x.md))} / ${esc(tr.T(x.ad))}</strong>${tag(x.rating_label, toneOfRating(x.rating))}</div>${note(`${formatDate(x.start, tr.lang)} → ${formatDate(x.end, tr.lang)}`)}${p((x.themes ?? []).join("; "))}</div>`)
    .join("")}
  ${h3(tr.t("transits_year"))}${table(
    [tr.t("graha"), tr.t("sign"), tr.t("start"), tr.t("end"), tr.t("house")],
    (r.transits ?? []).map((x: Json) => [tr.T(x.planet), tr.T(x.sign), x.from, x.to, `${x.house_from_moon} · ${x.text}`]),
  )}
  ${h3(tr.t("month_by_month"))}${table(
    [tr.lang === "hi" ? "माह" : "Month", tr.t("rating"), tr.t("notes")],
    (r.months ?? []).map((m: Json) => [m.month, m.rating_label, (m.notes ?? []).join(" · ")]),
  )}
  ${tp ? `${h3(tr.t("tp_year"))}${p(`${formatDate(tp.moment, tr.lang)} → ${formatDate(tp.valid_until, tr.lang)} · ${tr.t("lagna")}: ${tr.T(tp.lagna)}`)}` : ""}
  ${h3(tr.t("years_ahead"))}${table(
    [tr.t("year"), tr.t("age"), tr.t("rating"), tr.t("mahadasha"), tr.t("jupiter_sign"), tr.t("saturn_sign")],
    (r.years ?? []).map((y: Json) => [String(y.year), String(y.age), y.rating_label, y.dasha, tr.T(y.jupiter), tr.T(y.saturn)]),
  )}`;
}

function issuesBody(r: Json, tr: Translator): string {
  const tp = r.tithi_pravesha, ss = r.sade_sati;
  return `${statsGrid([
    { label: tr.t("as_of"), value: formatDate(r.as_of, tr.lang) },
    { label: tr.t("running_now"), value: (r.dasha_now ?? []).map(tr.T).join(" / ") },
    { label: tr.t("age_running"), value: String(r.age_running ?? "") },
    { label: tr.t("tab_sade"), value: ss?.sade_sati ? tr.T(ss.phase) : ss?.dhaiya ? tr.T(ss.dhaiya) : tr.t("no") },
    ...(tp ? [{ label: tr.t("tp"), value: `${formatDate(tp.moment, tr.lang)} → ${formatDate(tp.valid_until, tr.lang)}` }] : []),
  ])}${(r.issues ?? [])
    .map(
      (i: Json) => `<div class="card">
        <div class="card-head"><strong>${i.rank}. ${esc(i.area_name)}</strong>${tag(tr.t(i.priority), i.priority === "high" ? "bad" : i.priority === "medium" ? "mixed" : "neutral")}</div>
        ${note(`${tr.t("key_planet")}: ${tr.T(i.key_planet)} · ${i.score}`)}
        ${bullets((i.evidence ?? []).map((e: Json) => `${e.text} (${e.source})`))}
        ${remedySetHtml(i.remedies?.full, tr)}
      </div>`,
    )
    .join("")}
  ${remedyDaysHtml(r.remedy_days, r.remedy_days_note, tr)}
  ${nakDoshasHtml(r.nakshatra_doshas, tr)}
  ${healthWatchHtml(r.health_watch, tr)}
  ${rinHtml(r.rin, r.upay_rules, tr)}
  ${h2(tr.t("natal_afflictions"))}${afflHtml(r.natal_afflictions, tr)}
  ${note(r.disclaimer ?? "")}`;
}

function doshaBody(r: Json, tr: Translator): string {
  const bad = (r.interpretation ?? []).filter((f: Json) => f.nature === "challenging" || f.category === "dosha");
  return `${h2(tr.t("natal_afflictions"))}${afflHtml(r.afflictions, tr)}
    ${nakDoshasHtml(r.nakshatra_doshas, tr)}
    ${remedyPlanHtml(r.remedy_plan, tr)}
    ${bad.length ? `${h2(`${tr.t("cat_dosha")} / ${tr.t("cat_yoga")}`)}${bad.map((f: Json) => `<div class="card"><strong>${esc(f.name)}</strong>${p(f.text)}${note(`${tr.t("source")}: ${f.source}`)}</div>`).join("")}` : ""}`;
}

function fullBody(r: Json, tr: Translator): string {
  const c = r.chart, j = r.jaimini, av = r.ashtakavarga;
  const vmap = (D: string) => Object.fromEntries(Object.entries<Json>(c.vargas[D].planets).map(([k, s]) => [k, SIGNS.indexOf(s)]));
  const d1 = Object.fromEntries(Object.entries<Json>(c.planets).map(([k, v]) => [k, v.sign_index - 1]));
  const chartsHtml = `<div class="charts">${(["D1", "D9", "D10"] as const)
    .filter((D) => D === "D1" || c.vargas?.[D])
    .map((D) => northChartSvg(D, D === "D1" ? c.lagna.sign_index - 1 : SIGNS.indexOf(c.vargas[D].lagna), D === "D1" ? d1 : vmap(D), tr))
    .join("")}</div>`;
  const planetRows = Object.entries<Json>(c.planets).map(([k, v]) => [
    tr.T(k), tr.T(v.sign), v.degree_in_sign, `${tr.T(v.nakshatra.name)} (${v.nakshatra.pada})`, String(v.house), v.dignity === "n/a" ? "—" : tr.T(v.dignity),
  ]);
  const bhavRows = (r.bhavas ?? []).map((b: Json) => [
    String(b.house), b.name ?? "", b.meaning ?? "", tr.T(b.sign), `${tr.T(b.lord)} → ${b.lord_in}`, (b.occupants ?? []).map(tr.T).join(", ") || "—",
  ]);
  const savTotal = (av?.sav ?? []).reduce((a: number, b: number) => a + b, 0);

  return `${chartsHtml}
    ${h3(tr.t("positions"))}${table([tr.t("graha"), tr.t("sign"), tr.t("degree"), tr.t("nakshatra"), tr.t("house"), tr.t("dignity")], planetRows)}
    ${h3(tr.t("bhav_table"))}${table(["#", tr.t("bhav"), tr.t("meaning"), tr.t("sign"), tr.t("lord_in"), tr.t("occupants")], bhavRows)}
    ${h3(tr.t("planets_explained"))}${(r.placements ?? []).map((pl: Json) => placementHtml(pl, tr)).join("")}
    ${j?.karakas ? `${h3(tr.t("karakas"))}${table(["", tr.t("graha"), tr.t("meaning")], Object.entries<Json>(j.karakas).map(([k, v]) => [k, tr.T(v.planet), v.meaning]))}` : ""}
    ${av?.sav ? `${h3(tr.t("sav"))}${table([...(av.signs ?? []).map(tr.T), "Σ"], [[...(av.sav ?? []).map(String), String(savTotal)]])}` : ""}
    ${r.dasha?.mahadashas ? `${h3(tr.t("dasha_ad"))}${r.dasha.mahadashas.map((md: Json) => `<div class="card"><strong>${esc(tr.T(md.lord))} · ${esc(formatDate(md.start, tr.lang))} → ${esc(formatDate(md.end, tr.lang))}</strong>${note((md.sub ?? []).map((a: Json) => `${tr.T(a.lord)} ${ym(a.start)}`).join(" · "))}</div>`).join("")}` : ""}
    ${h2(tr.t("tab_interp"))}${(r.interpretation ?? []).map((f: Json) => `<div class="card"><strong>${esc(f.name)}</strong>${p(f.text)}${note(`${tr.t("source")}: ${f.source}`)}</div>`).join("")}
    ${h2(tr.t("natal_afflictions"))}${afflHtml(r.afflictions, tr)}
    ${remedyPlanHtml(r.remedy_plan, tr)}`;
}

function lifeAreasBody(r: Json, tr: Translator): string {
  return `${(r.areas ?? [])
    .map(
      (a: Json) => `<div class="card">
        <div class="card-head"><strong>${esc(a.title)}</strong>${tag(a.verdict, toneOfVerdict(a.verdict_key))}</div>
        ${note(`${tr.t("house")} ${a.house} (${tr.T(a.sign)}, ${tr.T(a.lord)}) · ${a.varga} · ${tr.T(a.karaka)}`)}
        ${bullets((a.points ?? []).map((x: Json) => x.text))}
        ${a.periods?.length ? labelLine(tr.t("periods"), a.periods.map((w: Json) => `${tr.T(w.md)}–${tr.T(w.ad)} (${ym(w.start)} → ${ym(w.end)})`).join(" · ")) : ""}
      </div>`,
    )
    .join("")}${note(r.areas?.[0]?.source ?? "")}`;
}

function varshphalBody(r: Json, tr: Translator): string {
  const tp = r.tithi_pravesha, tc = tp.chart;
  const d1 = Object.fromEntries(Object.entries<Json>(tc.planets).map(([k, v]) => [k, v.sign_index - 1]));
  const annualHouses = Object.fromEntries(Object.entries<number>(r.lal_kitab.varshphal.annual_houses).map(([k, h]) => [k, h - 1]));
  const rows = Object.entries<Json>(tc.planets).map(([k, v]) => [
    tr.T(k), String(v.house), r.bhav_names?.[v.house]?.name ?? "", tr.T(v.sign), v.dignity === "n/a" ? "—" : tr.T(v.dignity), r.bhav_names?.[v.house]?.meaning ?? "",
  ]);
  return `${h3(tr.t("tp"))}${statsGrid([
    { label: tr.t("start"), value: tp.moment.replace("T", " ").slice(0, 16) },
    { label: tr.t("valid_until"), value: tp.valid_until.replace("T", " ").slice(0, 16) },
    { label: tr.t("vara_lord"), value: tr.T(tp.vara_lord) },
    { label: tr.t("hora_lord"), value: tr.T(tp.hora_lord) },
    { label: tr.t("lagna"), value: tr.T(tc.lagna.sign) },
  ])}
  <div class="charts">${northChartSvg(tr.t("tp"), tc.lagna.sign_index - 1, d1, tr)}${northChartSvg(`${tr.t("lk_annual")} (${tr.t("year")} ${r.age})`, 0, annualHouses, tr)}</div>
  ${table([tr.t("graha"), `${tr.t("house")} (TP)`, tr.t("bhav"), tr.t("sign"), tr.t("dignity"), tr.t("meaning")], rows)}
  ${h3(tr.t("lk_annual"))}${lkRowsHtml(r.lal_kitab.planets, true, tr)}`;
}

function lalKitabBody(r: Json, tr: Translator): string {
  const natal = Object.fromEntries(Object.entries<number>(r.varshphal.natal_houses).map(([k, h]) => [k, h - 1]));
  const annual = Object.fromEntries(Object.entries<number>(r.varshphal.annual_houses).map(([k, h]) => [k, h - 1]));
  return `${note(tr.t("lk_note"))}
    <div class="charts">${northChartSvg(tr.t("lk_chart"), 0, natal, tr)}${northChartSvg(`${tr.t("lk_annual")} (${tr.t("age_running")} ${r.age})`, 0, annual, tr)}</div>
    ${labelLine(tr.t("empty_houses"), (r.empty_houses ?? []).join(", "))}
    ${lkRowsHtml(r.planets, false, tr)}
    ${r.quick?.length ? `${h3(tr.t("lk_quick"))}${bullets(r.quick.filter(Boolean).map((q: Json) => `${tr.T(q.planet)}: ${q.text}`))}` : ""}
    ${rinHtml(r.rin, r.rules, tr)}`;
}

function nakshatraBody(r: Json, tr: Translator): string {
  return `${statsGrid([
    { label: tr.t("janma_nak"), value: `${tr.T(r.janma_nakshatra)} (${r.pada}) · ${tr.T(r.lord)}` },
    { label: tr.t("anujanma"), value: tr.T(r.anujanma) },
    { label: tr.t("trijanma"), value: tr.T(r.trijanma) },
    { label: tr.t("ghat_nak"), value: tr.T(r.ghat_nakshatra) },
  ])}
  ${nakDoshasHtml(r.birth_doshas, tr, true)}
  ${remedyDaysHtml(r.remedy_days, r.remedy_days_note, tr)}
  ${h3(tr.t("taras"))}${(r.taras ?? [])
    .map((x: Json, i: number) => `<div class="card"><strong>${i + 1}. ${esc(x.tara)}</strong>${note(x.meaning ?? "")}${p((x.nakshatras ?? []).map(tr.T).join(", "))}</div>`)
    .join("")}
  ${healthWatchHtml(r.health, tr)}
  ${note(r.source ?? "")}`;
}

function tirthaBody(r: Json, tr: Translator): string {
  const tn = r.tantra;
  const templeCard = (x: Json) => `<div class="card">
    <strong>${esc(x.name)}</strong>${note(`${x.place}, ${x.state}`)}
    ${p(x.what ?? "")}${note(`${tr.t("when_to_go")}: ${x.when} · ${tr.t("deity_label")}: ${x.deity}`)}
  </div>`;
  return `${note(r.note ?? "")}
    ${h2(tr.t("temples_for_you"))}${(r.suggested ?? []).map(templeCard).join("")}
    ${h2(tr.t("tantra_layer"))}${(tn?.for_you ?? []).map((m: Json) => `<div class="card"><strong>${esc(tr.T(m.planet))} → ${esc(m.mahavidya)}</strong>${bullets(m.items ?? [])}</div>`).join("")}
    ${tn?.principles?.length ? `${h3(tr.t("tantra_principles"))}${bullets(tn.principles.map((x: Json) => `${x.text} (${tr.t("book_page")} ${x.page})`), true)}` : ""}
    ${tn?.ten_flowers ? `${h3(tr.t("ten_flowers"))}${p(tn.ten_flowers.verse ?? "")}${note((tn.ten_flowers.flowers ?? []).map((f: Json) => f.name).join(" · "))}` : ""}
    ${h2(tr.t("temple_directory"))}${(r.directory ?? []).map(templeCard).join("")}`;
}

function bhriguBody(r: Json, tr: Translator): string {
  return `${note(tr.t("ocr_note"))}${h3(`${tr.t("bhrigu_lagna")}: ${tr.T(r.lagna)}`)}
    ${(r.readings ?? [])
      .map(
        (x: Json) => `<div class="card">
          <div class="card-head"><strong>${esc(tr.T(x.planet))} – ${esc(tr.t("house"))} ${esc(x.house)}</strong>${note(`p. ${x.printed_page}`)}</div>
          ${x.found ? p(x.text_hi ?? "") : note(tr.t("not_split"))}
        </div>`,
      )
      .join("")}${note(r.source ?? "")}`;
}

const FORMATTERS: Record<ReportExportKey, (data: Json, tr: Translator) => string> = {
  simple: simpleBody,
  daily: dailyBody,
  lifepred: lifelongBody,
  yearpred: yearlyBody,
  issues: issuesBody,
  wrong: doshaBody,
  full: fullBody,
  life: lifeAreasBody,
  varsh: varshphalBody,
  lk: lalKitabBody,
  nak: nakshatraBody,
  tirtha: tirthaBody,
  bhrigu: bhriguBody,
};

/** Generates a complete HTML document for printing or PDF export of one report sub-tab. */
export function buildReportHtml({ key, title, kundli, data, translator: tr, chart, year }: BuildReportHtmlParams): string {
  const fullTitle = key === "varsh" && (data as Json)?.year ? `${title} ${(data as Json).year}` : key === "yearpred" && year ? `${title} ${year}` : title;
  const chartMeta = chart
    ? `${tr.t("lagna")}: ${tr.T(chart.lagna.sign)} · ${tr.t("moon_sign")}: ${tr.T(chart.planets.Moon.sign)} · ${tr.t("nakshatra")}: ${tr.T(chart.planets.Moon.nakshatra.name)}`
    : "";
  const body = FORMATTERS[key](data, tr);

  return `<!DOCTYPE html>
<html lang="${esc(tr.lang)}">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${esc(kundli.name)} – ${esc(fullTitle)}</title>
  <style>
    @page { margin: 14mm; }
    * { box-sizing: border-box; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    body { margin: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Noto Sans Devanagari", sans-serif; color: #2b2420; background: #ffffff; font-size: 13px; line-height: 1.5; }
    .header { background: #faf7f2; border: 1px solid #e8e0d6; border-left: 4px solid #c2571a; border-radius: 8px; padding: 14px 16px; margin-bottom: 16px; }
    .brand { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.6px; color: #c2571a; margin-bottom: 4px; }
    h1 { margin: 0 0 4px 0; font-size: 20px; color: #2b2420; }
    h2 { margin: 18px 0 8px 0; font-size: 16px; color: #a4431a; border-bottom: 1px solid #e8e0d6; padding-bottom: 4px; page-break-after: avoid; }
    h3 { margin: 14px 0 6px 0; font-size: 14px; color: #2b2420; page-break-after: avoid; }
    p { margin: 4px 0 8px 0; }
    .meta { font-size: 12px; color: #7a6f66; margin: 2px 0; }
    .note { font-size: 11.5px; color: #7a6f66; margin: 4px 0 8px 0; }
    ul, ol { margin: 4px 0 10px 0; padding-left: 18px; }
    li { margin-bottom: 3px; }
    .card { border: 1px solid #e8e0d6; border-radius: 8px; padding: 10px 12px; margin-bottom: 10px; background: #fffdfb; break-inside: avoid; }
    .subcard { border: 1px solid #f1ebe4; border-radius: 6px; padding: 8px 10px; margin-top: 6px; background: #faf7f2; break-inside: avoid; }
    .card-head { display: flex; justify-content: space-between; align-items: flex-start; gap: 8px; margin-bottom: 4px; }
    .badge { display: inline-block; font-size: 11px; font-weight: 600; padding: 2px 8px; border-radius: 999px; white-space: nowrap; }
    .badge-good { background: #e3f2e8; color: #2f7d4f; }
    .badge-bad { background: #f8e3e3; color: #b23b3b; }
    .badge-mixed { background: #fbf0d6; color: #9a6b00; }
    .badge-accent { background: #fbeadf; color: #c2571a; }
    .badge-neutral { background: #f0ece6; color: #7a6f66; }
    .stats { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 12px; }
    .stat { flex: 1 1 130px; border: 1px solid #e8e0d6; border-radius: 6px; padding: 8px 10px; background: #faf7f2; }
    .stat-label { font-size: 11px; color: #7a6f66; font-weight: 600; }
    .stat-val { font-size: 13px; font-weight: 600; margin-top: 2px; }
    .grid-4 { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 12px; }
    .tile { flex: 1 1 22%; border: 1px solid #e8e0d6; border-radius: 6px; padding: 6px 8px; text-align: center; background: #faf7f2; }
    .tile-active { border: 1.5px solid #c2571a; background: #fbeadf; }
    .tile-title { font-size: 12px; font-weight: 600; color: #2b2420; }
    .tile-sub { font-size: 11px; color: #7a6f66; }
    .charts { display: flex; flex-wrap: wrap; gap: 12px; margin: 10px 0 14px 0; }
    .chart-card { border: 1px solid #e8e0d6; border-radius: 8px; padding: 8px; background: #ffffff; text-align: center; break-inside: avoid; }
    .chart-cap { font-size: 11.5px; font-weight: 600; color: #7a6f66; margin-bottom: 4px; }
    table { width: 100%; border-collapse: collapse; margin: 6px 0 12px 0; font-size: 12px; }
    th, td { border: 1px solid #e8e0d6; padding: 6px 8px; text-align: left; vertical-align: top; }
    th { background: #faf7f2; font-weight: 600; color: #7a6f66; }
    .chips { display: flex; flex-wrap: wrap; gap: 6px; margin: 6px 0; }
  </style>
</head>
<body>
  <div class="header">
    <div class="brand">Jyotish Lab</div>
    <h1>${esc(fullTitle)}</h1>
    <div class="meta"><strong>${esc(kundli.name)}</strong> · ${esc(describeBirth(kundli))}</div>
    ${chartMeta ? `<div class="meta">${esc(chartMeta)}</div>` : ""}
  </div>
  ${body}
</body>
</html>`;
}
