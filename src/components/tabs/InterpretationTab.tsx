import { View } from "react-native";
import { Section, Text } from "@/components/ui";
import { natureTone } from "@/domain/tone";
import { useI18n } from "@/i18n/I18nProvider";
import type { Interpretation } from "@/types/api";
import { FindingCard } from "./FindingCard";

const CATEGORIES = ["yoga", "dosha", "placement"] as const;
const stripTags = (s: string) => s.replace(/<[^>]+>/g, "");

export function InterpretationTab({ data }: { data: Interpretation }) {
  const { t, T } = useI18n();
  return (
    <View testID="interp-tab">
      <Text variant="small">{stripTags(t("interp_note"))}</Text>
      {CATEGORIES.map((cat) => {
        const fs = data.findings.filter((f) => f.category === cat);
        return (
          <Section key={cat} title={`${t("cat_" + cat)} (${fs.length})`}>
            {fs.length === 0 && <Text variant="muted">{t("none_found")}</Text>}
            {fs.map((f) => (
              <FindingCard key={f.id} testID={`finding-${f.id}`} title={f.name} tone={natureTone(f.nature)}
                chips={[{ label: t(f.nature), tone: natureTone(f.nature) }, ...(f.status === "draft" ? [{ label: t("draft"), tone: "neutral" as const }] : [])]}>
                <Text>{f.text}</Text>
                <Text variant="small">{t("source")}: {f.source}{f.planets.length ? ` · ${t("planets")}: ${f.planets.map(T).join(", ")}` : ""}</Text>
              </FindingCard>
            ))}
          </Section>
        );
      })}
    </View>
  );
}
