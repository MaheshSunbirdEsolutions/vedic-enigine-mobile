/**
 * Building blocks shared by every report (mobile port of web/components/Explain.tsx and the
 * helpers in Reports.tsx): planet placement in plain words, the multi-system remedy set,
 * collapsible sections that follow "Expand all", bhav table, remedy days, nakshatra doshas,
 * health watch, afflictions, rin (karmic debts) and links to scanned book pages.
 *
 * Report payloads are large and evolve with the engine, so they are typed loosely (`Json`);
 * the contract test checks the fields these components rely on.
 */
import { useState, type ReactNode } from "react";
import { Linking, View } from "react-native";
import Animated, { FadeIn, useAnimatedStyle, withTiming } from "react-native-reanimated";
import { KundliChart } from "@/components/kundli/KundliChart";
import { Card, Chip, DataTable, Icon, PressableScale, Text } from "@/components/ui";
import { labelsBySign } from "@/domain/chart";
import { formatDate, humanize } from "@/domain/format";
import type { Tone } from "@/domain/tone";
import { useI18n } from "@/i18n/I18nProvider";
import { getEngineUrl } from "@/state/preferences";
import { makeStyles, motion, radius, spacing, useTheme } from "@/theme";

export type Json = any;

export const rateTone = (k?: string): Tone => (k === "excellent" || k === "good" ? "good" : k === "mixed" ? "mixed" : k ? "bad" : "neutral");
export const verdictTone = (k?: string): Tone => (k === "strong" ? "good" : k === "moderate" ? "mixed" : "bad");
export const sevTone = (n: number): Tone => (n >= 3 ? "bad" : n === 2 ? "mixed" : "neutral");
const strengthTone = (s: string): Tone => (s === "strong" ? "good" : s === "weak" ? "bad" : "neutral");
const ordEn = (n: number) => (n === 1 ? "1st" : n === 2 ? "2nd" : n === 3 ? "3rd" : `${n}th`);

// ---------- text helpers ----------

export function H2({ children }: { children: ReactNode }) {
  return <Text variant="title" style={useStyles().h2}>{children}</Text>;
}
export function H3({ children }: { children: ReactNode }) {
  return <Text variant="heading" style={useStyles().h3}>{children}</Text>;
}
export function P({ children, muted }: { children: ReactNode; muted?: boolean }) {
  return <Text variant={muted ? "muted" : "body"} style={useStyles().p}>{children}</Text>;
}
export function Note({ children }: { children: ReactNode }) {
  return <Text variant="small" style={useStyles().note}>{children}</Text>;
}
/** "Label: value" line with a bold label. */
export function LabelLine({ label, children }: { label: string; children: ReactNode }) {
  return <Text style={useStyles().p}><Text weight="semibold">{label}: </Text>{children}</Text>;
}
export function Bullets({ items, ordered }: { items: ReactNode[]; ordered?: boolean }) {
  const s = useStyles();
  return (
    <View style={s.list}>
      {items.map((x, i) => (
        <View key={i} style={s.li}>
          <Text style={s.bullet}>{ordered ? `${i + 1}.` : "•"}</Text>
          <Text style={s.flex}>{x}</Text>
        </View>
      ))}
    </View>
  );
}
export function Chips({ children }: { children: ReactNode }) {
  return <View style={useStyles().chips}>{children}</View>;
}

/** Coloured-edge card used for findings, issues and planets. */
export function Block({ tone = "neutral", title, right, children }: { tone?: Tone; title?: ReactNode; right?: ReactNode; children?: ReactNode }) {
  const s = useStyles();
  return (
    <Card tone={tone} style={s.block}>
      {title ? <View style={s.blockHead}><Text variant="subheading" style={s.flex}>{title}</Text>{right}</View> : null}
      {children}
    </Card>
  );
}

/** Progress-style bar for scores. */
export function ScoreBar({ ratio, tone = "accent" }: { ratio: number; tone?: Tone }) {
  const s = useStyles();
  const t = useTheme();
  return (
    <View style={s.barTrack}>
      <View style={[s.barFill, { width: `${Math.max(0, Math.min(1, ratio)) * 100}%`, backgroundColor: t.tones[tone].fg }]} />
    </View>
  );
}

// ---------- collapsible ----------

/** Collapsible section; opens by default when `open` is set. */
export function Fold({ summary, children, open }: { summary: ReactNode; children: ReactNode; open?: boolean }) {
  const s = useStyles();
  const t = useTheme();
  const [mine, setMine] = useState<boolean | null>(null);
  const shown = mine ?? !!open;
  const chevron = useAnimatedStyle(() => ({ transform: [{ rotate: withTiming(shown ? "90deg" : "0deg", { duration: motion.fast }) }] }));
  return (
    <View style={s.fold}>
      <PressableScale onPress={() => setMine(!shown)} haptic="selection" scaleTo={0.99} accessibilityRole="button" accessibilityState={{ expanded: shown }} style={s.foldHead}>
        <Animated.View style={chevron}><Icon name="chevron-forward" size={16} color={t.colors.accent} /></Animated.View>
        <Text weight="semibold" style={[s.foldText, s.flex]}>{summary}</Text>
      </PressableScale>
      {shown ? <Animated.View entering={FadeIn.duration(180)}>{children}</Animated.View> : null}
    </View>
  );
}

// ---------- shared report pieces ----------

/** "Saturn · 2nd house (Dhana bhav) · Virgo 12°" with strength and the explanation. */
export function PlacementCard({ pl, compact = false }: { pl: Json; compact?: boolean }) {
  const { t, T, lang } = useI18n();
  const s = useStyles();
  const house = lang === "hi" ? `${pl.house}वाँ भाव (${pl.bhav})` : `${ordEn(pl.house)} house (${pl.bhav})`;
  return (
    <Block tone={pl.strength === "weak" ? "bad" : pl.strength === "strong" ? "good" : "mixed"}
      title={`${T(pl.planet)} · ${house} · ${T(pl.sign)} ${pl.degree ?? ""}`}>
      <Chips>
        <Chip tone={strengthTone(pl.strength)} label={t("strength_" + pl.strength)} />
        {pl.retrograde ? <Chip tone="neutral" label={T("retrograde") !== "retrograde" ? T("retrograde") : "R"} /> : null}
        {pl.combust ? <Chip tone="bad" label={lang === "hi" ? "अस्त" : "combust"} /> : null}
      </Chips>
      {!compact && pl.owns?.length > 0 && (
        <Chips>
          {pl.owns_meaning.map((o: Json) => (
            <Chip key={o.house} tone="neutral" label={`${lang === "hi" ? `भाव ${o.house}` : `H${o.house}`} – ${String(o.meaning).split(",").slice(0, 2).join(",")}`} />
          ))}
        </Chips>
      )}
      <Text style={s.p}>{pl.text}</Text>
    </Block>
  );
}

const GEM_LABEL: Record<string, [string, string]> = { suitable: ["may suit", "उपयुक्त"], avoid: ["avoid", "न पहनें"], caution: ["expert check first", "पहले जाँच"] };

/** Every remedy system for one planet, with the strengthen/pacify approach on top. */
export function RemedySet({ fs }: { fs: Json }) {
  const { t, lang } = useI18n();
  const s = useStyles();
  const th = useTheme();
  return (
    <View style={s.remSet}>
      <Chips><Chip tone={fs.approach === "strengthen" ? "good" : "mixed"} label={t("approach_" + fs.approach)} /></Chips>
      {fs.approach_text ? <Text style={s.p}>{fs.approach_text}</Text> : null}
      {fs.systems.map((sys: Json) => (
        <View key={sys.id} style={[s.remBox, sys.tone === "bad" && { borderColor: th.colors.bad }, sys.tone === "good" && { borderColor: th.colors.good }]}>
          <View style={s.blockHead}>
            <Text weight="semibold" style={s.flex}>{t("sys_" + sys.id)}</Text>
            {sys.id === "gem" && fs.gem_verdict ? <Chip tone={sys.tone === "bad" ? "bad" : sys.tone === "good" ? "good" : "neutral"} label={GEM_LABEL[fs.gem_verdict]?.[lang === "hi" ? 1 : 0] ?? fs.gem_verdict} /> : null}
          </View>
          {sys.items?.length ? <Bullets items={sys.items} /> : null}
          {sys.note ? <Note>{sys.note}</Note> : null}
          {sys.source ? <Note>{sys.source}</Note> : null}
        </View>
      ))}
      <Note>{t("rem_order_note")}</Note>
    </View>
  );
}

export function BhavTable({ rows }: { rows: Json[] }) {
  const { t, T } = useI18n();
  return (
    <DataTable scroll rows={rows} rowKey={(r) => String(r.house)} columns={[
      { key: "h", label: "#", width: 40, render: (r) => String(r.house) },
      { key: "b", label: t("bhav"), width: 110, render: (r) => r.name },
      { key: "m", label: t("meaning"), width: 200, render: (r) => <Text variant="small">{r.meaning}</Text> },
      { key: "s", label: t("sign"), width: 90, render: (r) => T(r.sign) },
      { key: "l", label: t("lord_in"), width: 120, render: (r) => `${T(r.lord)} → ${r.lord_in}` },
      { key: "o", label: t("occupants"), width: 130, render: (r) => r.occupants.map(T).join(", ") || "—" },
    ]} />
  );
}

/** One section per afflicted planet: why, where it sits, every remedy. */
export function RemedyPlan({ plan }: { plan: Json[] }) {
  const { t, T } = useI18n();
  if (!plan?.length) return null;
  return (
    <>
      <H2>{t("remedy_plan")}</H2>
      {plan.map((fs) => (
        <Block key={fs.planet} tone={sevTone(fs.severity)} title={T(fs.planet)} right={<Chip tone={sevTone(fs.severity)} label={`${t("severity")} ${fs.severity}`} />}>
          <LabelLine label={t("why_afflicted")}>{fs.reasons.join("; ")}</LabelLine>
          <PlacementCard pl={fs.placement} />
          <Fold summary={`${t("all_remedies")} ${T(fs.planet)}`} open><RemedySet fs={fs} /></Fold>
        </Block>
      ))}
    </>
  );
}

/** Upcoming auspicious days to begin remedies. */
export function RemedyDays({ days, note }: { days: Json[]; note?: string }) {
  const { t, T, lang } = useI18n();
  if (!days?.length) return null;
  return (
    <>
      <H2>{t("remedy_days")}</H2>
      {note ? <Note>{note}</Note> : null}
      <DataTable scroll rows={days} rowKey={(d) => d.date} highlight={(d) => d.for_planets?.length > 0} columns={[
        { key: "d", label: t("date"), width: 110, render: (d) => <Text weight="semibold">{formatDate(d.date, lang)}</Text> },
        { key: "w", label: t("weekday"), width: 90, render: (d) => d.weekday },
        { key: "n", label: t("nakshatra"), width: 150, render: (d) => `${T(d.nakshatra)} (${T(d.tithi)})` },
        { key: "y", label: t("yogas"), width: 170, render: (d) => <Chips>{d.yogas.map((y: string) => <Chip key={y} tone="good" label={y} />)}</Chips> },
        { key: "t", label: t("tara"), width: 90, render: (d) => d.tara },
        { key: "p", label: t("for_planet"), width: 110, render: (d) => d.for_planets?.map(T).join(", ") || "—" },
      ]} />
      <Note>R. P. Gaur, Nakshatra Jyotish – ch. 8 (muhurta), pp. 173–179</Note>
    </>
  );
}

export function NakDoshas({ list, showEmpty = false }: { list: Json[]; showEmpty?: boolean }) {
  const { t } = useI18n();
  if (!list?.length) return showEmpty ? <><H3>{t("nak_doshas")}</H3><Note>{t("no_nak_doshas")}</Note></> : null;
  return (
    <>
      <H3>{t("nak_doshas")}</H3>
      {list.map((x, i) => (
        <Block key={i} tone={x.severity >= 2 ? "bad" : "mixed"} title={x.text} right={<Chip tone={x.severity >= 3 ? "bad" : "mixed"} label={`${t("severity")} ${x.severity}`} />}>
          <Text weight="semibold">{t("remedies")}:</Text>
          <Bullets items={x.remedies} />
          <Note>{x.source}</Note>
        </Block>
      ))}
    </>
  );
}

export function HealthWatch({ rows }: { rows: Json[] }) {
  const { t, T } = useI18n();
  if (!rows?.length) return null;
  return (
    <>
      <H3>{t("health_watch")}</H3>
      <DataTable scroll rows={rows} rowKey={(_r, i) => String(i)} columns={[
        { key: "p", label: t("point"), width: 90, render: (r) => <Text weight="semibold">{T(r.point)}</Text> },
        { key: "n", label: t("nakshatra"), width: 120, render: (r) => T(r.nakshatra) },
        { key: "b", label: t("body_parts"), width: 150, render: (r) => r.parts },
        { key: "w", label: t("watch_for"), width: 200, render: (r) => <Text variant="small">{r.watch}</Text> },
      ]} />
      <Note>{t("health_disclaimer")} · {rows[0].source}</Note>
    </>
  );
}

/** Afflictions grouped as dosha / conjunction / position, with severity and life areas. */
export function AfflList({ list }: { list: Json[] }) {
  const { t } = useI18n();
  const area = (a: string) => (t("area_" + a) !== "area_" + a ? t("area_" + a) : humanize(a));
  if (!list?.length) return <Note>{t("no_afflictions")}</Note>;
  return (
    <>
      {["dosha", "yuti", "position"].map((cat) => {
        const xs = list.filter((a) => a.category === cat);
        if (!xs.length) return null;
        return (
          <View key={cat}>
            <H3>{`${t("cat_" + cat)} (${xs.length})`}</H3>
            {xs.map((a, i) => (
              <Block key={i} tone={a.severity >= 3 ? "bad" : a.severity === 2 ? "mixed" : "neutral"} title={a.text}
                right={<Chip tone={sevTone(a.severity)} label={`${t("severity")} ${a.severity}`} />}>
                <Note>{t("house")}: {a.houses.join(", ")} · {t("affects")}: {a.areas.map(area).join(", ")}</Note>
              </Block>
            ))}
          </View>
        );
      })}
    </>
  );
}

/** Lal Kitab rin (ancestral debts) and the general upay rules. */
export function RinBlock({ rin, rules }: { rin: Json[]; rules?: Json[] }) {
  const { t, T } = useI18n();
  return (
    <>
      <H2>{t("rin")}</H2>
      {rin?.length ? rin.map((x, i) => (
        <Block key={i} tone="bad" title={x.name}>
          <LabelLine label={t("rin_trigger")}>{`${x.trigger.map(T).join(", ")} → ${t("house")} ${x.houses.join("/")}`}</LabelLine>
          <LabelLine label={t("rin_sign")}>{x.sign}</LabelLine>
          <LabelLine label={t("family_upay")}>{x.upay}</LabelLine>
          <Note>{x.source}</Note>
        </Block>
      )) : <Note>{t("no_rin")}</Note>}
      {rules?.length ? (
        <>
          <H3>{t("upay_rules")}</H3>
          <Bullets items={rules.map((r) => `${r.text} (${r.source})`)} />
        </>
      ) : null}
    </>
  );
}

const pad3 = (n: number) => String(n).padStart(3, "0");

/** Chips that open scanned book pages served by the engine (/books/<kind>/pNNN.jpg). */
export function PageLinks({ kind, pages, books, offset = 0 }: { kind: "lalkitab" | "bhrigu"; pages: number[]; books: Json; offset?: number }) {
  const { t } = useI18n();
  if (!books?.[kind]) return <Note>{t("books_missing")}</Note>;
  return (
    <Chips>
      {pages.map((p) => (
        <Chip key={p} tone="neutral" label={`${t("view_page")} ${kind === "lalkitab" ? (p <= 142 ? p - 20 : p - 22) : p + offset}`}
          onPress={() => void Linking.openURL(`${getEngineUrl()}/books/${kind}/p${pad3(p)}.jpg`)} />
      ))}
    </Chips>
  );
}

/** Small captioned chart (divisional, Tithi Pravesha, Lal Kitab). */
export function MiniChart({ caption, lagna, planets, retro }: { caption: string; lagna: number; planets: Record<string, number>; retro?: Record<string, boolean> }) {
  const { abbr, t } = useI18n();
  const s = useStyles();
  return (
    <View style={s.mini}>
      <Text variant="label" style={s.miniCap}>{caption}</Text>
      <KundliChart variant="north" lagna={lagna} ascLabel={t("asc")} bySign={labelsBySign(planets, abbr, retro)} />
    </View>
  );
}

/** Lal Kitab chart: houses are fixed (lagna = Aries), planets placed by house number. */
export function LkChart({ caption, houses }: { caption: string; houses: Record<string, number> }) {
  return <MiniChart caption={caption} lagna={0} planets={Object.fromEntries(Object.entries(houses).map(([p, h]) => [p, h - 1]))} />;
}

/** Two charts side by side on wide screens, stacked on phones. */
export function ChartGrid({ children }: { children: ReactNode }) {
  return <View style={useStyles().grid}>{children}</View>;
}

const useStyles = makeStyles((t) => ({
  h2: { marginTop: spacing.xl, marginBottom: spacing.sm },
  h3: { marginTop: spacing.lg, marginBottom: spacing.sm },
  p: { marginBottom: spacing.sm },
  note: { marginBottom: spacing.sm },
  list: { marginBottom: spacing.sm, gap: 4 },
  li: { flexDirection: "row", gap: 8 },
  bullet: { color: t.colors.accent, minWidth: 14 },
  flex: { flex: 1 },
  chips: { flexDirection: "row", flexWrap: "wrap", marginBottom: 4 },
  block: { padding: spacing.md, paddingLeft: spacing.lg },
  blockHead: { flexDirection: "row", alignItems: "flex-start", gap: spacing.sm, marginBottom: 6 },
  barTrack: { height: 6, borderRadius: radius.pill, backgroundColor: t.colors.fill, overflow: "hidden", marginVertical: spacing.sm },
  barFill: { height: 6, borderRadius: radius.pill },
  fold: { marginVertical: 4 },
  foldHead: { flexDirection: "row", alignItems: "center", gap: 6, paddingVertical: 8 },
  foldText: { color: t.colors.accent },
  remSet: { gap: spacing.sm, marginTop: 4 },
  remBox: { borderWidth: 1, borderColor: t.colors.line, borderRadius: radius.md, padding: spacing.md, backgroundColor: t.colors.panel },
  mini: { flexGrow: 1, flexBasis: 300, maxWidth: 420, marginBottom: spacing.md },
  miniCap: { marginBottom: 6 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.md },
}));
