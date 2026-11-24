import type { ReactNode } from "react";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";

/** Cross-fades its children whenever `id` changes (tab content, step changes). */
export function FadeSwitch({ id, children }: { id: string; children: ReactNode }) {
  return (
    <Animated.View key={id} entering={FadeIn.duration(220)} exiting={FadeOut.duration(120)}>
      {children}
    </Animated.View>
  );
}
