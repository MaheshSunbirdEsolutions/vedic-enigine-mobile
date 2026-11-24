/**
 * Language context.
 *
 * The language choice lives in the preferences store; the UI bundles are server data cached by
 * React Query. Both bundles are prefetched at start-up, and `setLang` switches smoothly:
 * fade the app out → make sure the new bundle is ready → switch → fade back in. The text never
 * flashes raw keys or a half-translated screen.
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { StyleSheet } from "react-native";
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { engineApi, queryKeys } from "@/api";
import { usePreferences } from "@/state/preferences";
import { motion } from "@/theme";
import type { Lang } from "@/types/api";
import { createTranslator, type Translator } from "./translate";

type I18nContext = Translator & {
  ready: boolean;
  /** Switch language with a short cross-fade. */
  setLang: (l: Lang) => void;
  /** The language being switched to (moves the switch thumb immediately). */
  targetLang: Lang;
};

const Ctx = createContext<I18nContext | null>(null);
const LANGS: Lang[] = ["en", "hi"];
const SWITCH_WAIT_MS = 1500;

const bundleQuery = (lang: Lang) => ({
  queryKey: queryKeys.i18n(lang),
  queryFn: ({ signal }: { signal: AbortSignal }) => engineApi.meta.i18n(lang, { signal }),
  staleTime: Infinity,
  gcTime: Infinity,
});

const wait = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

export function I18nProvider({ children }: { children: ReactNode }) {
  const qc = useQueryClient();
  const lang = usePreferences((s) => s.lang);
  const storeSetLang = usePreferences((s) => s.setLang);
  /** Language being switched to, while the fade runs. */
  const [pending, setPending] = useState<Lang | null>(null);
  const switching = useRef(false);
  const opacity = useSharedValue(1);

  const q = useQuery(bundleQuery(lang));

  // Warm both bundles so switching is instant.
  useEffect(() => {
    for (const l of LANGS) void qc.prefetchQuery(bundleQuery(l));
  }, [qc]);

  const setLang = useCallback(async (next: Lang) => {
    if (next === usePreferences.getState().lang || switching.current) return;
    switching.current = true;
    setPending(next);
    // Dip, not blink: the old text fades well back before the new language appears.
    opacity.set(withTiming(0.12, { duration: motion.fast, easing: Easing.out(Easing.quad) }));
    await Promise.all([
      wait(motion.fast),
      Promise.race([qc.ensureQueryData(bundleQuery(next)).catch(() => undefined), wait(SWITCH_WAIT_MS)]),
    ]);
    storeSetLang(next);
    // Let the new language render before fading back in.
    requestAnimationFrame(() => {
      opacity.set(withTiming(1, { duration: motion.normal, easing: Easing.out(Easing.quad) }));
      switching.current = false;
      setPending(null);
    });
  }, [opacity, qc, storeSetLang]);

  const value = useMemo<I18nContext>(
    () => ({ ...createTranslator(lang, q.data), ready: !q.isPending, setLang: (l) => void setLang(l), targetLang: pending ?? lang }),
    [lang, q.data, q.isPending, setLang, pending],
  );
  const fade = useAnimatedStyle(() => ({ opacity: opacity.get() }));

  return (
    <Ctx.Provider value={value}>
      <Animated.View style={[styles.fill, fade]}>{children}</Animated.View>
    </Ctx.Provider>
  );
}

export function useI18n(): I18nContext {
  const c = useContext(Ctx);
  if (!c) throw new Error("useI18n must be used inside <I18nProvider>");
  return c;
}

/** For tests and stories: a provider with a fixed translator and no network. */
export function StaticI18nProvider({ children, translator }: { children: ReactNode; translator: Translator }) {
  const value = useMemo(() => ({ ...translator, ready: true, setLang: () => {}, targetLang: translator.lang }), [translator]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

const styles = StyleSheet.create({ fill: { flex: 1 } });
