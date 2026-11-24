/** Toast for confirmations ("Saved", "Deleted"): slides up, then fades away. */
import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import Animated, { FadeInDown, FadeOutDown } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { makeStyles, radius, spacing, useTheme } from "@/theme";
import { Icon } from "./Icon";
import { Text } from "./Text";

const Ctx = createContext<(msg: string) => void>(() => {});

export function ToastProvider({ children }: { children: ReactNode }) {
  const s = useStyles();
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const [msg, setMsg] = useState<{ text: string; id: number } | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const show = useCallback((text: string) => {
    setMsg({ text, id: Date.now() });
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setMsg(null), 2400);
  }, []);
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);
  return (
    <Ctx.Provider value={show}>
      {children}
      {msg ? (
        <Animated.View key={msg.id} entering={FadeInDown.springify().damping(18)} exiting={FadeOutDown.duration(180)}
          style={[s.toast, t.shadowRaised, { bottom: insets.bottom + 84 }]} accessibilityLiveRegion="polite" testID="toast">
          <Icon name="checkmark-circle" size={18} color={t.colors.toastText} />
          <Text weight="medium" style={s.text}>{msg.text}</Text>
        </Animated.View>
      ) : null}
    </Ctx.Provider>
  );
}

export const useToast = () => useContext(Ctx);

const useStyles = makeStyles((t) => ({
  toast: {
    position: "absolute", alignSelf: "center", flexDirection: "row", alignItems: "center", gap: spacing.sm,
    backgroundColor: t.colors.toastBg, borderRadius: radius.pill, paddingVertical: 10, paddingHorizontal: spacing.lg, maxWidth: "88%",
  },
  text: { color: t.colors.toastText },
}));
