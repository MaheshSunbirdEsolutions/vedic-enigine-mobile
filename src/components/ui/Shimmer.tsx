/**
 * Loading placeholders. One shared animated value drives every block on screen,
 * so a skeleton list pulses in sync and costs a single animation.
 */
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { Animated, Easing, Platform, View, type DimensionValue, type StyleProp, type ViewStyle } from "react-native";
import { makeStyles, radius, spacing } from "@/theme";

/** The native animation driver does not exist on web. */
const NATIVE_DRIVER = Platform.OS !== "web";

const PulseCtx = createContext<Animated.Value | null>(null);

function usePulse(): Animated.Value {
  const [v] = useState(() => new Animated.Value(0));
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(v, { toValue: 1, duration: 700, easing: Easing.inOut(Easing.quad), useNativeDriver: NATIVE_DRIVER }),
        Animated.timing(v, { toValue: 0, duration: 700, easing: Easing.inOut(Easing.quad), useNativeDriver: NATIVE_DRIVER }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [v]);
  return v;
}

/** Wrap a group of blocks so they share one animation. Announced as "loading" to screen readers. */
export function Shimmer({ children, testID = "shimmer" }: { children: ReactNode; testID?: string }) {
  const pulse = usePulse();
  return (
    <PulseCtx.Provider value={pulse}>
      <View testID={testID} accessibilityRole="progressbar" accessibilityLabel="loading" accessibilityState={{ busy: true }}>
        {children}
      </View>
    </PulseCtx.Provider>
  );
}

export function ShimmerBlock({ width = "100%", height = 14, style, round }: {
  width?: DimensionValue; height?: number; style?: StyleProp<ViewStyle>; round?: boolean;
}) {
  const pulse = useContext(PulseCtx);
  const styles = useStyles();
  const opacity = pulse ? pulse.interpolate({ inputRange: [0, 1], outputRange: [0.55, 1] }) : 1;
  return (
    <Animated.View
      style={[styles.block, { width, height, borderRadius: round ? height / 2 : radius.sm, opacity }, style]}
    />
  );
}

// ---------- ready-made skeletons for the shapes the app uses ----------

export function SkeletonList({ rows = 5 }: { rows?: number }) {
  const styles = useStyles();
  return (
    <Shimmer testID="skeleton-list">
      {Array.from({ length: rows }, (_, i) => (
        <View key={i} style={styles.listRow}>
          <ShimmerBlock width={36} height={36} round />
          <View style={styles.flex}>
            <ShimmerBlock width="55%" height={14} />
            <ShimmerBlock width="85%" height={11} style={styles.gap} />
          </View>
        </View>
      ))}
    </Shimmer>
  );
}

export function SkeletonCards({ count = 3, lines = 3 }: { count?: number; lines?: number }) {
  const styles = useStyles();
  return (
    <Shimmer testID="skeleton-cards">
      {Array.from({ length: count }, (_, i) => (
        <View key={i} style={styles.card}>
          <ShimmerBlock width="45%" height={16} />
          {Array.from({ length: lines }, (_, j) => (
            <ShimmerBlock key={j} width={j === lines - 1 ? "70%" : "100%"} height={11} style={styles.gap} />
          ))}
        </View>
      ))}
    </Shimmer>
  );
}

export function SkeletonChart() {
  const styles = useStyles();
  return (
    <Shimmer testID="skeleton-chart">
      <View style={styles.statRow}>
        {[0, 1, 2].map((i) => <ShimmerBlock key={i} width="31%" height={52} />)}
      </View>
      <ShimmerBlock width="100%" height={320} style={styles.chart} />
      {[0, 1, 2, 3].map((i) => <ShimmerBlock key={i} height={12} style={styles.gap} />)}
    </Shimmer>
  );
}

const useStyles = makeStyles((t) => ({
  block: { backgroundColor: t.colors.shimmerBase },
  flex: { flex: 1 },
  gap: { marginTop: spacing.sm },
  listRow: {
    flexDirection: "row", gap: spacing.md, alignItems: "center", padding: spacing.md, marginBottom: spacing.sm,
    backgroundColor: t.colors.card, borderRadius: radius.md, borderWidth: 1, borderColor: t.colors.line,
  },
  card: { padding: spacing.lg, marginBottom: spacing.md, backgroundColor: t.colors.card, borderRadius: radius.lg, borderWidth: 1, borderColor: t.colors.line },
  statRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: spacing.md },
  chart: { borderRadius: radius.lg },
}));
