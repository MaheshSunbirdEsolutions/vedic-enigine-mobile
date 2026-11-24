import { useRouter } from "expo-router";
import { BirthForm } from "@/components/kundli/BirthForm";
import { Card, Screen } from "@/components/ui";
import { kundliToParams } from "@/domain/kundliParams";

/** Birth details → unsaved kundli preview (saved from there). */
export default function NewKundliScreen() {
  const router = useRouter();
  return (
    <Screen testID="new-kundli-screen">
      <Card>
        <BirthForm onSubmit={(k) => router.push({ pathname: "/kundli/preview", params: kundliToParams(k) })} />
      </Card>
    </Screen>
  );
}
