import { useState } from "react";
import { PlaceSearch } from "@/components/kundli/PlaceSearch";
import { DateField } from "@/components/form/DateField";
import { PanchangView } from "@/components/panchang/PanchangView";
import { Card, EmptyState, QueryView, Screen, SkeletonCards } from "@/components/ui";
import { isValidDate } from "@/domain/birthForm";
import { localIso } from "@/domain/birth";
import { usePanchang } from "@/hooks/useAstro";
import { useI18n } from "@/i18n/I18nProvider";
import type { Place } from "@/types/api";

/** Panchang for any date and place; recalculates as soon as both are valid. */
export default function PanchangScreen() {
  const { t } = useI18n();
  const [day, setDay] = useState(() => localIso(new Date()).slice(0, 10));
  const [place, setPlace] = useState<Place | null>(null);
  const req = place && isValidDate(day) ? { day, tz: place.tz, lat: place.lat, lon: place.lon } : null;
  const q = usePanchang(req);
  return (
    <Screen testID="panchang-screen">
      <Card>
        <DateField testID="panchang-date" label={t("date")} value={day} onChange={setDay} error={isValidDate(day) ? null : t("err_date_format")} />
        <PlaceSearch label={t("place")} value={place} onSelect={setPlace} placeholder={t("city_ph")} testID="panchang-place" />
      </Card>
      {req ? (
        <QueryView query={q} skeleton={<SkeletonCards count={2} lines={4} />}>{(p) => <PanchangView p={p} />}</QueryView>
      ) : (
        <EmptyState message={t("choose_place")} />
      )}
    </Screen>
  );
}
