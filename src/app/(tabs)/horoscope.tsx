/**
 * Daily Horoscope screen: 12-Rashi (Moon sign) daily horoscope + personalized Kundli daily horoscope.
 * Port of web/app/(app)/horoscope/page.tsx.
 */
import { useState } from "react";
import { Pressable, View } from "react-native";
import { useRouter } from "expo-router";
import { useAppAuth } from "@/auth/useAppAuth";
import { DateField } from "@/components/form/DateField";
import { DailyView } from "@/components/horoscope/DailyView";
import { EmailShareSection } from "@/components/horoscope/EmailShareSection";
import { RashiDetail } from "@/components/horoscope/RashiDetail";
import { Note, YogaCautionChips } from "@/components/horoscope/parts";
import { PlaceSearch } from "@/components/kundli/PlaceSearch";
import { Bullets, rateTone } from "@/components/reports/parts";
import {
  Button, Card, Chip, EmptyState, ErrorState, PressableScale, QueryView, Screen, SegmentedControl,
  SkeletonCards, Stat, StatRow, Text,
} from "@/components/ui";
import { localIso } from "@/domain/birth";
import { isValidDate } from "@/domain/birthForm";
import { formatDate, formatTime } from "@/domain/format";
import { useDailyHoroscope, useDailyReport } from "@/hooks/useAstro";
import { useKundliList } from "@/hooks/useKundlis";
import { useI18n } from "@/i18n/I18nProvider";
import { makeStyles, radius, spacing } from "@/theme";
import type { DailyRashiSign, Kundli, Place } from "@/types/api";

const DEFAULT_PLACE: Place = {
  name: "New Delhi",
  country: "India",
  lat: 28.6139,
  lon: 77.209,
  tz: "Asia/Kolkata",
};

type Mode = "rashi" | "kundli";

export default function HoroscopeScreen() {
  const s = useStyles();
  const router = useRouter();
  const { t, T, lang } = useI18n();
  const { isLoaded, isSignedIn } = useAppAuth();

  const [mode, setMode] = useState<Mode>("rashi");
  const [day, setDay] = useState(() => localIso(new Date()).slice(0, 10));
  const [place, setPlace] = useState<Place | null>(DEFAULT_PLACE);
  const [selectedSign, setSelectedSign] = useState<string>("");
  const [kid, setKid] = useState<string>("");
  const [pickerOpen, setPickerOpen] = useState(false);

  const savedQuery = useKundliList("");
  const saved = isSignedIn ? (savedQuery.data ?? []) : [];
  const hasSavedKundli = isLoaded && isSignedIn && saved.length > 0;

  const validDay = isValidDate(day);
  const activePlace = place ?? DEFAULT_PLACE;
  const rashiReq = mode === "rashi" && hasSavedKundli && validDay
    ? { day, tz: activePlace.tz, lat: activePlace.lat, lon: activePlace.lon, lang }
    : null;
  const rashiQuery = useDailyHoroscope(rashiReq);

  const selectedKundli: Kundli | undefined = saved.find((x) => x.id === kid) ?? saved[0];
  const activeKid = selectedKundli?.id || "";
  const personalQuery = useDailyReport(
    mode === "kundli" && hasSavedKundli && validDay ? (selectedKundli ?? null) : null,
    lang,
    day,
    mode === "kundli" && hasSavedKundli && validDay && !!selectedKundli,
  );

  const signs = rashiQuery.data?.signs ?? [];
  const activeSign: DailyRashiSign | undefined = selectedSign
    ? signs.find((x) => x.sign === selectedSign)
    : undefined;

  const renderAccessGate = (title: string) => {
    if (!isLoaded || (isSignedIn && savedQuery.isPending)) {
      return <SkeletonCards count={1} lines={2} />;
    }
    if (!isSignedIn) {
      return (
        <EmptyState
          testID="horoscope-auth-gate"
          title={title}
          message={t("auth_horoscope_required")}
          action={{
            label: t("auth_sign_in"),
            icon: "log-in-outline",
            onPress: () => router.push({ pathname: "/(auth)/sign-in", params: { redirectTo: "/(tabs)/horoscope" } }),
          }}
        />
      );
    }
    if (savedQuery.isError) {
      return <ErrorState error={savedQuery.error} onRetry={() => void savedQuery.refetch()} />;
    }
    return (
      <EmptyState
        testID="horoscope-create-kundli-gate"
        title={title}
        message={t("horoscope_need_kundli")}
        action={{ label: t("new_kundli"), icon: "add", onPress: () => router.push("/kundli/new") }}
      />
    );
  };

  return (
    <Screen testID="horoscope-screen">
      <Text variant="hero" style={s.title}>{t("daily_title")}</Text>
      <Text variant="muted" style={s.sub}>{t("daily_sub")}</Text>

      <SegmentedControl<Mode>
        testID="horoscope-mode"
        value={mode}
        onChange={setMode}
        segments={[
          { value: "rashi", label: t("by_rashi") },
          { value: "kundli", label: t("by_kundli") },
        ]}
      />

      <Card>
        {!hasSavedKundli ? (
          renderAccessGate(mode === "rashi" ? t("by_rashi") : t("by_kundli"))
        ) : (
          <>
            <DateField
              testID="horoscope-date"
              label={t("date")}
              value={day}
              onChange={setDay}
              error={validDay ? null : t("err_date_format")}
            />

            {mode === "rashi" ? (
              <PlaceSearch
                testID="horoscope-place"
                label={t("place")}
                value={place}
                onSelect={setPlace}
                placeholder={t("city_ph")}
              />
            ) : (
              <View>
                <Text variant="label" style={s.fieldLabel}>{t("choose_saved")}</Text>
                <View style={s.kundliPickerRow}>
                  <Button
                    testID="horoscope-kundli-picker"
                    variant="secondary"
                    icon="person-outline"
                    label={selectedKundli ? `${selectedKundli.name} · ${selectedKundli.datetime_local.slice(0, 10)}` : t("person_pick")}
                    onPress={() => setPickerOpen((o) => !o)}
                    style={s.flex}
                  />
                  {selectedKundli?.id ? (
                    <Button
                      testID="horoscope-open-kundli"
                      variant="ghost"
                      size="sm"
                      icon="open-outline"
                      label={t("open_kundli_full")}
                      onPress={() => router.push({ pathname: "/kundli/[id]", params: { id: selectedKundli.id! } })}
                    />
                  ) : null}
                </View>

                {pickerOpen && (
                  <View style={s.pickerList}>
                    {saved.map((k) => {
                      const on = k.id === activeKid;
                      return (
                        <Pressable
                          key={k.id ?? k.datetime_local}
                          testID={`horoscope-kundli-${k.id}`}
                          onPress={() => {
                            setKid(k.id || "");
                            setPickerOpen(false);
                          }}
                          accessibilityRole="button"
                          style={[s.pickerOption, on && s.pickerOptionOn]}
                        >
                          <Text weight={on ? "semibold" : "regular"}>
                            {k.name} <Text variant="small">· {k.datetime_local.slice(0, 10)}</Text>
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                )}
              </View>
            )}
          </>
        )}
      </Card>

      {hasSavedKundli && validDay && (mode === "rashi" || !!selectedKundli) && (
        <EmailShareSection
          kind={mode}
          sign={selectedSign || "Aries"}
          kundli={mode === "kundli" ? selectedKundli : undefined}
          tz={(mode === "kundli" ? selectedKundli?.tz : activePlace.tz) || DEFAULT_PLACE.tz}
          lat={(mode === "kundli" ? selectedKundli?.lat : activePlace.lat) ?? DEFAULT_PLACE.lat}
          lon={(mode === "kundli" ? selectedKundli?.lon : activePlace.lon) ?? DEFAULT_PLACE.lon}
          day={day}
        />
      )}

      {mode === "rashi" && hasSavedKundli && validDay && (
        <QueryView query={rashiQuery} skeleton={<SkeletonCards count={3} lines={4} />}>
          {(d) => {
            const p = d.panchang;
            const tm = (v?: string) => formatTime(v, d.date, lang);
            return (
              <View testID="rashi-results">
                <StatRow>
                  <Stat label={t("date")} value={formatDate(d.date, lang)}>
                    <Text variant="small">{T(p.vara)}</Text>
                  </Stat>
                  <Stat label={t("transit_moon")} value={T(d.moon_sign)} />
                  <Stat label={t("tithi")} value={`${T(p.tithi.paksha)} ${T(p.tithi.name)}`} />
                  <Stat label={t("nakshatra")} value={T(p.nakshatra.name)} />
                  <Stat label={t("rahu_kaal")} value={`${tm(p.rahu_kaal.start)}–${tm(p.rahu_kaal.end)}`} />
                </StatRow>

                <YogaCautionChips yogas={d.yogas} cautions={d.cautions} />

                <SegmentedControl<string>
                  scroll
                  testID="rashi-filter"
                  value={selectedSign || "all"}
                  onChange={(v) => setSelectedSign(v === "all" ? "" : v)}
                  segments={[
                    { value: "all", label: t("all") },
                    ...d.signs.map((item) => ({ value: item.sign, label: T(item.sign) })),
                  ]}
                />

                {activeSign ? (
                  <RashiDetail
                    s={activeSign}
                    p={p}
                    moonSign={d.moon_sign}
                    day={day}
                    onSelectDay={setDay}
                    onBack={() => setSelectedSign("")}
                  />
                ) : (
                  <View>
                    {d.signs.map((item) => (
                      <PressableScale
                        key={item.sign}
                        testID={`rashi-card-${item.sign}`}
                        onPress={() => setSelectedSign(item.sign)}
                        haptic="selection"
                        scaleTo={0.985}
                        accessibilityRole="button"
                      >
                        <Card tone={rateTone(item.rating)}>
                          <View style={s.cardHead}>
                            <Text variant="subheading" style={s.flex}>{T(item.sign)}</Text>
                            <Chip tone={rateTone(item.rating)} label={item.rating_label} />
                          </View>
                          <View style={s.badgeRow}>
                            <Text variant="small">{t("lord")}: {T(item.lord)} · +{item.moon_house}</Text>
                            {item.chandrashtama ? <Chip tone="bad" label="8th" /> : null}
                            {item.ghat_nakshatra ? <Chip tone="bad" label={t("ghat_nak")} /> : null}
                          </View>
                          <Text style={s.overview}>{item.overview}</Text>
                          <Bullets items={item.highlights} />
                          <Note>{t("lucky_colour")}: {item.colour} · {t("lucky_numbers")}: {item.lucky_numbers.join(", ")}</Note>
                          <Text weight="semibold" style={s.viewDetails}>{t("view_details")} →</Text>
                        </Card>
                      </PressableScale>
                    ))}
                  </View>
                )}

                <Note>{d.disclaimer}</Note>
              </View>
            );
          }}
        </QueryView>
      )}

      {mode === "kundli" && validDay && isSignedIn && selectedKundli && (
        <QueryView query={personalQuery} skeleton={<SkeletonCards count={4} lines={4} />}>
          {(r) => <DailyView r={r} onSelectDay={setDay} />}
        </QueryView>
      )}
    </Screen>
  );
}

const useStyles = makeStyles((t) => ({
  title: { marginTop: spacing.xs, marginBottom: 4 },
  sub: { marginBottom: spacing.md },
  fieldLabel: { marginBottom: 6 },
  kundliPickerRow: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: spacing.sm },
  flex: { flex: 1 },
  pickerList: { marginTop: spacing.sm, gap: 6 },
  pickerOption: {
    padding: spacing.md,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: t.colors.line,
  },
  pickerOptionOn: {
    backgroundColor: t.colors.accentSoft,
    borderColor: t.colors.accent,
  },
  cardHead: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: spacing.sm, marginBottom: 4 },
  badgeRow: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: 6, marginBottom: spacing.xs },
  overview: { marginBottom: spacing.sm },
  viewDetails: { color: t.colors.accent, fontSize: 13.5, marginTop: 2 },
}));
