import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useAppAuth } from "@/auth/useAppAuth";
import { KundliView } from "@/components/kundli/KundliView";
import { EmptyState, QueryView, Screen, SkeletonChart } from "@/components/ui";
import { useKundli } from "@/hooks/useKundlis";
import { useI18n } from "@/i18n/I18nProvider";

export default function SavedKundliScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { t } = useI18n();
  const { isLoaded, isSignedIn } = useAppAuth();
  const q = useKundli(id);

  if (isLoaded && !isSignedIn) {
    return (
      <Screen>
        <EmptyState
          message={t("auth_signed_in_required")}
          action={{ label: t("auth_sign_in"), icon: "log-in-outline", onPress: () => router.push("/(auth)/sign-in") }}
        />
      </Screen>
    );
  }

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
