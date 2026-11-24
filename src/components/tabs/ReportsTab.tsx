import { Linking, View } from "react-native";
import { Button, Card, QueryView, SkeletonCards, Text } from "@/components/ui";
import { env } from "@/config/env";
import { useSimpleReport } from "@/hooks/useAstro";
import { useI18n } from "@/i18n/I18nProvider";
import type { Kundli } from "@/types/api";
import { SimpleReportView } from "./SimpleReportView";

/** Web URL of this kundli (saved kundlis only), for the reports not yet built natively. */
export const webKundliUrl = (webUrl: string | null, k: Kundli) => (webUrl && k.id ? `${webUrl}/kundli/${encodeURIComponent(k.id)}` : null);

export function ReportsTab({ kundli }: { kundli: Kundli }) {
  const { t, lang } = useI18n();
  const q = useSimpleReport(kundli, lang);
  const webLink = webKundliUrl(env.webUrl, kundli);
  return (
    <View testID="reports-tab">
      <Text variant="title">{t("rep_simple")}</Text>
      <QueryView query={q} skeleton={<SkeletonCards count={4} />}>
        {(r) => <SimpleReportView report={r} />}
      </QueryView>
      <Card>
        <Text variant="muted">{t("more_reports_web")}</Text>
        {webLink && <Button variant="light" label={t("open_on_web")} onPress={() => void Linking.openURL(webLink)} />}
      </Card>
    </View>
  );
}
