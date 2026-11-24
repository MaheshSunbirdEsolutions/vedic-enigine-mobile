/**
 * Bottom-tab icon with a clear "you are here" state: the active tab gets a tinted pill that
 * springs open behind a filled icon; inactive tabs show the outline icon.
 */
import { useEffect } from "react";
import { View, type ColorValue } from "react-native";
import Animated, { interpolate, useAnimatedStyle, useSharedValue, withSpring } from "react-native-reanimated";
import { Icon } from "@/components/ui";
import { makeStyles, motion, radius } from "@/theme";

type Base = "albums" | "sunny" | "heart" | "settings";

export function TabIcon({ name, focused, color }: { name: Base; focused: boolean; color: ColorValue }) {
  const s = useStyles();
  const p = useSharedValue(focused ? 1 : 0);
  useEffect(() => { p.set(withSpring(focused ? 1 : 0, motion.spring)); }, [focused, p]);
  const pill = useAnimatedStyle(() => ({
    opacity: p.get(),
    transform: [{ scaleX: interpolate(p.get(), [0, 1], [0.4, 1]) }],
  }));
  const icon = useAnimatedStyle(() => ({ transform: [{ translateY: interpolate(p.get(), [0, 1], [0, -1]) }] }));
  return (
    <View style={s.wrap} testID={`tab-icon-${name}${focused ? "-active" : ""}`}>
      <Animated.View style={[s.pill, pill]} />
      <Animated.View style={icon}>
        <Icon name={focused ? name : `${name}-outline`} size={21} color={color as string} />
      </Animated.View>
    </View>
  );
}

const useStyles = makeStyles((t) => ({
  wrap: { width: 60, height: 30, alignItems: "center", justifyContent: "center" },
  pill: { position: "absolute", width: 60, height: 30, borderRadius: radius.pill, backgroundColor: t.colors.accentSoft },
}));
