import { StyleSheet, View } from "react-native";
import { Card, Chip, Text } from "@/components/ui";
import type { Tone } from "@/domain/tone";
import { spacing } from "@/theme";

/** A titled block with a coloured edge: interpretation findings, ask sections, remedy plans. */
export function FindingCard({ title, tone, chips = [], children, testID }: {
  title: string; tone: Tone; chips?: { label: string; tone: Tone }[]; children: React.ReactNode; testID?: string;
}) {
  return (
    <Card tone={tone} testID={testID} style={styles.card}>
      <Text variant="subheading">{title}</Text>
      {chips.length > 0 && <View style={styles.chips}>{chips.map((c) => <Chip key={c.label} label={c.label} tone={c.tone} />)}</View>}
      <View style={styles.body}>{children}</View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { padding: spacing.md },
  chips: { flexDirection: "row", flexWrap: "wrap", marginTop: spacing.xs },
  body: { gap: 6, marginTop: 4 },
});
