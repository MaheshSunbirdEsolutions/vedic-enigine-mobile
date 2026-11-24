import { Stack, useLocalSearchParams } from "expo-router";
import { KundliView } from "@/components/kundli/KundliView";
import { QueryView, Screen, SkeletonChart } from "@/components/ui";
import { useKundli } from "@/hooks/useKundlis";

export default function SavedKundliScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const q = useKundli(id);
  return (
    <QueryView query={q} skeleton={<Screen><SkeletonChart /></Screen>}>
      {(k) => (
        <>
          <Stack.Screen options={{ title: k.name }} />
          <KundliView key={k.id} initial={k} />
        </>
      )}
    </QueryView>
  );
}
