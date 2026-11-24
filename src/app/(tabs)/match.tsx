import { useState } from "react";
import { PersonPicker } from "@/components/match/PersonPicker";
import { MatchResultView } from "@/components/match/MatchResultView";
import { Button, ErrorState, InlineError, Screen, SkeletonCards } from "@/components/ui";
import { useMatch } from "@/hooks/useAstro";
import { useKundliList } from "@/hooks/useKundlis";
import { useI18n } from "@/i18n/I18nProvider";
import type { Kundli } from "@/types/api";

export default function MatchScreen() {
  const { t } = useI18n();
  const saved = useKundliList("");
  const match = useMatch();
  const [groom, setGroom] = useState<Kundli | null>(null);
  const [bride, setBride] = useState<Kundli | null>(null);
  const [formErr, setFormErr] = useState<string | null>(null);

  const run = () => {
    if (!groom) return setFormErr(t("complete_groom"));
    if (!bride) return setFormErr(t("complete_bride"));
    setFormErr(null);
    match.mutate({ groom, bride });
  };
  const change = (set: (k: Kundli | null) => void) => (k: Kundli | null) => { set(k); match.reset(); };

  return (
    <Screen testID="match-screen">
      {saved.isError && <ErrorState error={saved.error} onRetry={() => void saved.refetch()} />}
      <PersonPicker testID="groom" title={t("groom")} saved={saved.data ?? []} value={groom} onChange={change(setGroom)} />
      <PersonPicker testID="bride" title={t("bride")} saved={saved.data ?? []} value={bride} onChange={change(setBride)} />
      <Button testID="run-match" label={t("match_btn")} onPress={run} loading={match.isPending} />
      <InlineError message={formErr} />
      {match.isPending && <SkeletonCards count={1} lines={6} />}
      {match.isError && <ErrorState error={match.error} onRetry={run} />}
      {match.data && <MatchResultView m={match.data} />}
    </Screen>
  );
}
