/** Lightweight toast for confirmations ("Saved", "Deleted"). */
import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { Animated, StyleSheet } from "react-native";
import { colors, radius, spacing } from "@/theme";
import { Text } from "./Text";

const Ctx = createContext<(msg: string) => void>(() => {});

export function ToastProvider({ children }: { children: ReactNode }) {
  const [msg, setMsg] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const show = useCallback((m: string) => {
    setMsg(m);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setMsg(null), 2200);
  }, []);
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);
  return (
    <Ctx.Provider value={show}>
      {children}
      {msg ? (
        <Animated.View style={styles.toast} accessibilityLiveRegion="polite" testID="toast">
          <Text style={styles.text}>{msg}</Text>
        </Animated.View>
      ) : null}
    </Ctx.Provider>
  );
}

export const useToast = () => useContext(Ctx);

const styles = StyleSheet.create({
  toast: { position: "absolute", left: spacing.lg, right: spacing.lg, bottom: 40, backgroundColor: colors.ink, borderRadius: radius.md, padding: spacing.md },
  text: { color: colors.white, textAlign: "center" },
});
