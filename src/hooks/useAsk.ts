/**
 * Ask tab logic: AI status, sending a question and a per-kundli history persisted on the
 * device (AsyncStorage), newest first.
 */
import { useCallback, useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useMutation, useQuery } from "@tanstack/react-query";
import { engineApi, queryKeys } from "@/api";
import { useAppAuth } from "@/auth/useAppAuth";
import { addToHistory, askHistoryKey, isValidQuestion, type AskHistoryItem } from "@/domain/ask";
import { birthOf, nowIn } from "@/domain/birth";
import type { Kundli, Lang } from "@/types/api";

export function useAskStatus() {
  return useQuery({ queryKey: queryKeys.askStatus, queryFn: ({ signal }) => engineApi.ask.status({ signal }), staleTime: 60_000 });
}

export function useAsk(kundli: Kundli, lang: Lang) {
  const { userId } = useAppAuth();
  const baseKey = kundli.id || kundli.datetime_local;
  const storeKey = askHistoryKey(userId ? `${userId}:${baseKey}` : baseKey);
  const [history, setHistory] = useState<AskHistoryItem[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let live = true;
    AsyncStorage.getItem(storeKey)
      .then((raw) => { if (live) setHistory(raw ? (JSON.parse(raw) as AskHistoryItem[]) : []); })
      .catch(() => { if (live) setHistory([]); })
      .finally(() => { if (live) setLoaded(true); });
    return () => { live = false; };
  }, [storeKey]);

  const persist = useCallback((next: AskHistoryItem[]) => {
    setHistory(next);
    AsyncStorage.setItem(storeKey, JSON.stringify(next)).catch(() => { /* storage full or unavailable: keep in memory */ });
  }, [storeKey]);

  const mutation = useMutation({
    mutationFn: ({ question, useAi }: { question: string; useAi: boolean }) =>
      engineApi.ask.ask({ ...birthOf(kundli), lang, at: nowIn(kundli.tz), question, use_ai: useAi }),
  });

  const ask = useCallback(async (question: string, useAi: boolean) => {
    const q = question.trim();
    if (!isValidQuestion(q) || mutation.isPending) return;
    const item: AskHistoryItem = { q, lang, at: new Date().toISOString() };
    try {
      item.response = await mutation.mutateAsync({ question: q, useAi });
    } catch (e) {
      item.error = e instanceof Error ? e.message : String(e);
    }
    setHistory((prev) => {
      const next = addToHistory(prev, item);
      AsyncStorage.setItem(storeKey, JSON.stringify(next)).catch(() => {});
      return next;
    });
  }, [lang, mutation, storeKey]);

  return { history, loaded, ask, busy: mutation.isPending, clear: () => persist([]) };
}
