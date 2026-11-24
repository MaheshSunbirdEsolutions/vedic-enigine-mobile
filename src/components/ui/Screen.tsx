import type { ReactNode } from "react";
import { RefreshControl, View } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { makeStyles, spacing, useTheme } from "@/theme";

/**
 * Page container: background, padding, pull-to-refresh, and keyboard handling. The focused
 * input is always scrolled above the keyboard (react-native-keyboard-controller), on iOS and
 * Android. Use `scroll={false}` for screens that render their own list.
 */
export function Screen({ children, scroll = true, onRefresh, refreshing = false, testID }: {
  children: ReactNode; scroll?: boolean; onRefresh?: () => void; refreshing?: boolean; testID?: string;
}) {
  const s = useStyles();
  const t = useTheme();
  if (!scroll) return <View testID={testID} style={[s.root, s.pad]}>{children}</View>;
  return (
    <KeyboardAwareScrollView
      testID={testID}
      style={s.root}
      contentContainerStyle={s.pad}
      bottomOffset={spacing.xxl}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="interactive"
      showsVerticalScrollIndicator={false}
      refreshControl={onRefresh ? <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={t.colors.accent} colors={[t.colors.accent]} /> : undefined}
    >
      {children}
    </KeyboardAwareScrollView>
  );
}

const useStyles = makeStyles((t) => ({
  root: { flex: 1, backgroundColor: t.colors.bg },
  pad: { padding: spacing.lg, paddingBottom: 56, flexGrow: 1 },
}));
