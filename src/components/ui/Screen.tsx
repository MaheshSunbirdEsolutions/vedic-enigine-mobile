import type { ReactNode } from "react";
import { RefreshControl, ScrollView, View } from "react-native";
import { makeStyles, spacing, useTheme } from "@/theme";

/**
 * Page container: background colour, padding, optional scroll and pull-to-refresh.
 * Use `scroll={false}` for screens that render their own FlatList.
 */
export function Screen({ children, scroll = true, onRefresh, refreshing = false, testID }: {
  children: ReactNode; scroll?: boolean; onRefresh?: () => void; refreshing?: boolean; testID?: string;
}) {
  const styles = useStyles();
  const t = useTheme();
  if (!scroll) return <View testID={testID} style={[styles.root, styles.pad]}>{children}</View>;
  return (
    <ScrollView
      testID={testID}
      style={styles.root}
      contentContainerStyle={styles.pad}
      keyboardShouldPersistTaps="handled"
      contentInsetAdjustmentBehavior="automatic"
      refreshControl={onRefresh ? <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={t.colors.accent} colors={[t.colors.accent]} /> : undefined}
    >
      {children}
    </ScrollView>
  );
}

const useStyles = makeStyles((t) => ({
  root: { flex: 1, backgroundColor: t.colors.bg },
  pad: { padding: spacing.lg, paddingBottom: 48, flexGrow: 1 },
}));
