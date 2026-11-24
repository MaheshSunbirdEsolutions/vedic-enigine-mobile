import type { ReactNode } from "react";
import { RefreshControl, ScrollView, StyleSheet, View } from "react-native";
import { colors, spacing } from "@/theme";

/**
 * Page container: background colour, padding, optional scroll and pull-to-refresh.
 * Use `scroll={false}` for screens that render their own FlatList.
 */
export function Screen({ children, scroll = true, onRefresh, refreshing = false, testID }: {
  children: ReactNode; scroll?: boolean; onRefresh?: () => void; refreshing?: boolean; testID?: string;
}) {
  if (!scroll) return <View testID={testID} style={[styles.root, styles.pad]}>{children}</View>;
  return (
    <ScrollView
      testID={testID}
      style={styles.root}
      contentContainerStyle={styles.pad}
      keyboardShouldPersistTaps="handled"
      contentInsetAdjustmentBehavior="automatic"
      refreshControl={onRefresh ? <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} colors={[colors.accent]} /> : undefined}
    >
      {children}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  pad: { padding: spacing.lg, paddingBottom: 48, flexGrow: 1 },
});
