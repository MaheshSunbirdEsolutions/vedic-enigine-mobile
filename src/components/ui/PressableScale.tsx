/**
 * Pressable with a springy scale-down on press (UI thread, via Reanimated) and optional haptics.
 * Every tappable thing in the app is built on this, so presses feel the same everywhere.
 */
import type { ReactNode } from "react";
import { Pressable, type PressableProps, type StyleProp, type ViewStyle } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from "react-native-reanimated";
import { motion } from "@/theme";
import { tapFeedback } from "./haptics";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export type PressableScaleProps = Omit<PressableProps, "style" | "children"> & {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  /** Scale while pressed (default 0.97). */
  scaleTo?: number;
  haptic?: "selection" | "light" | false;
};

export function PressableScale({ children, style, scaleTo = motion.pressScale, haptic = "light", onPressIn, onPressOut, onPress, disabled, ...rest }: PressableScaleProps) {
  const scale = useSharedValue(1);
  const animated = useAnimatedStyle(() => ({ transform: [{ scale: scale.get() }] }));
  return (
    <AnimatedPressable
      {...rest}
      disabled={disabled}
      onPressIn={(e) => { scale.set(withSpring(scaleTo, motion.spring)); onPressIn?.(e); }}
      onPressOut={(e) => { scale.set(withSpring(1, motion.spring)); onPressOut?.(e); }}
      onPress={(e) => { if (haptic) tapFeedback(haptic); onPress?.(e); }}
      style={[style, animated]}
    >
      {children}
    </AnimatedPressable>
  );
}
