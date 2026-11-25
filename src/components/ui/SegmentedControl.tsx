/**
 * Options with one selected, and a thumb that slides to the selection (Reanimated, UI thread).
 * `scroll` makes it a horizontal strip (kundli tabs); `size="sm"` is the compact header version.
 */
import { useCallback, useEffect, useRef, useState, type ComponentRef } from "react";
import { Platform, ScrollView, View, type LayoutChangeEvent } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from "react-native-reanimated";
import { makeStyles, motion, radius, spacing, useTheme } from "@/theme";
import { PressableScale } from "./PressableScale";
import { Text } from "./Text";

export type Segment<T extends string> = { value: T; label: string };

export function SegmentedControl<T extends string>({ segments, value, onChange, scroll, size = "md", testID }: {
  segments: Segment<T>[]; value: T; onChange: (v: T) => void; scroll?: boolean; size?: "md" | "sm"; testID?: string;
}) {
  const s = useStyles();
  const t = useTheme();
  const layouts = useRef<Record<string, { x: number; width: number }>>({});
  const [ready, setReady] = useState(false);
  const x = useSharedValue(0);
  const w = useSharedValue(0);
  const scrollRef = useRef<ComponentRef<typeof ScrollView>>(null);

  const moveTo = useCallback((v: string, animate: boolean) => {
    const l = layouts.current[v];
    if (!l) return;
    x.set(animate ? withSpring(l.x, motion.spring) : l.x);
    w.set(animate ? withSpring(l.width, motion.spring) : l.width);
    if (scroll) scrollRef.current?.scrollTo({ x: Math.max(0, l.x - 24), animated: animate });
  }, [scroll, w, x]);

  useEffect(() => { moveTo(value, ready); }, [value, ready, moveTo]);

  const onItemLayout = (v: string) => (e: LayoutChangeEvent) => {
    const { x: lx, width } = e.nativeEvent.layout;
    layouts.current[v] = { x: lx, width };
    if (v === value) moveTo(v, false);
    if (Object.keys(layouts.current).length >= segments.length && !ready) setReady(true);
  };

  const thumb = useAnimatedStyle(() => ({ transform: [{ translateX: x.get() }], width: w.get() }));
  const sm = size === "sm";

  const thumbShadow = t.dark ? null : Platform.OS === "ios" ? t.shadow : s.thumbAndroid;

  const row = (
    <View style={[s.track, sm && s.trackSm, scroll && s.trackScroll]}>
      <Animated.View pointerEvents="none" style={[s.thumb, sm && s.thumbSm, thumbShadow, thumb, !ready && s.hidden]} />
      {segments.map((seg) => {
        const on = seg.value === value;
        return (
          <PressableScale key={seg.value} testID={testID ? `${testID}-${seg.value}` : undefined}
            onLayout={onItemLayout(seg.value)} onPress={() => on || onChange(seg.value)} haptic="selection" scaleTo={0.95}
            accessibilityRole="tab" accessibilityState={{ selected: on }}
            style={[s.item, sm && s.itemSm, !scroll && !sm && s.flex, on && !ready && s.itemOnFallback]}>
            <Text weight={on ? "semibold" : "medium"} allowFontScaling={!sm} style={[s.label, sm && s.labelSm, on && s.labelOn]} numberOfLines={1}>{seg.label}</Text>
          </PressableScale>
        );
      })}
    </View>
  );
  return scroll ? (
    <ScrollView ref={scrollRef} horizontal showsHorizontalScrollIndicator={false} style={s.scroll} contentContainerStyle={s.scrollContent}>{row}</ScrollView>
  ) : <View style={sm ? undefined : s.outer}>{row}</View>;
}

const useStyles = makeStyles((t) => ({
  outer: { marginBottom: spacing.md },
  scroll: { flexGrow: 0, marginBottom: spacing.md },
  scrollContent: { paddingRight: spacing.sm },
  track: { flexDirection: "row", backgroundColor: t.colors.fill, borderRadius: radius.md, padding: 4 },
  trackSm: { padding: 3, borderRadius: radius.pill },
  trackScroll: { alignSelf: "flex-start" },
  // Keep zIndex explicit and avoid Android elevation on the thumb so native header toolbars never
  // paint the opaque thumb over the selected label.
  thumb: { position: "absolute", top: 4, bottom: 4, left: 0, zIndex: 0, borderRadius: radius.sm, backgroundColor: t.dark ? t.colors.accentSoft : t.colors.card },
  thumbAndroid: { borderWidth: 0.5, borderColor: t.colors.line },
  thumbSm: { top: 3, bottom: 3, borderRadius: radius.pill },
  hidden: { opacity: 0 },
  item: { zIndex: 1, paddingVertical: 9, paddingHorizontal: spacing.md, alignItems: "center", justifyContent: "center", borderRadius: radius.sm },
  itemSm: { paddingVertical: 4, paddingHorizontal: 11, minWidth: 44, borderRadius: radius.pill },
  itemOnFallback: { backgroundColor: t.dark ? t.colors.accentSoft : t.colors.card },
  flex: { flex: 1 },
  label: { fontSize: 14, lineHeight: Math.round(19 * t.fonts.lineScale), color: t.colors.muted },
  labelSm: { fontSize: 12.5, lineHeight: Math.round(18 * t.fonts.lineScale) },
  labelOn: { color: t.dark ? t.colors.accent : t.colors.ink },
}));
