import { useLocalSearchParams } from "expo-router";
import { KundliView } from "@/components/kundli/KundliView";
import { EmptyState, Screen } from "@/components/ui";
import { kundliFromParams } from "@/domain/kundliParams";
import { useI18n } from "@/i18n/I18nProvider";

export default function KundliPreviewScreen() {
  const { t } = useI18n();
  const k = kundliFromParams(useLocalSearchParams());
  if (!k) return <Screen><EmptyState message={t("err_dt")} /></Screen>;
  return <KundliView key={JSON.stringify(k)} initial={k} />;
}
