/**
 * Language context. The language choice lives in the preferences store; the bundle is
 * server data fetched (and cached) with React Query.
 */
import { createContext, useContext, useMemo, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { engineApi, queryKeys } from "@/api";
import { usePreferences } from "@/state/preferences";
import { createTranslator, type Translator } from "./translate";

type I18nContext = Translator & { ready: boolean; setLang: (l: Translator["lang"]) => void };

const Ctx = createContext<I18nContext | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const lang = usePreferences((s) => s.lang);
  const setLang = usePreferences((s) => s.setLang);
  const q = useQuery({
    queryKey: queryKeys.i18n(lang),
    queryFn: ({ signal }) => engineApi.meta.i18n(lang, { signal }),
    staleTime: Infinity,
    gcTime: Infinity,
  });
  const value = useMemo<I18nContext>(
    () => ({ ...createTranslator(lang, q.data), ready: !q.isPending, setLang }),
    [lang, q.data, q.isPending, setLang],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useI18n(): I18nContext {
  const c = useContext(Ctx);
  if (!c) throw new Error("useI18n must be used inside <I18nProvider>");
  return c;
}

/** For tests and stories: a provider with a fixed translator and no network. */
export function StaticI18nProvider({ children, translator }: { children: ReactNode; translator: Translator }) {
  const value = useMemo(() => ({ ...translator, ready: true, setLang: () => {} }), [translator]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
