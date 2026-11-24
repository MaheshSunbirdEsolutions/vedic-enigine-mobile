/** Ask tab: question validation, history list and example questions. */
import type { AskResponse, Lang } from "@/types/api";

export const ASK_HISTORY_LIMIT = 30;
export const MIN_QUESTION_LENGTH = 2;

export type AskHistoryItem = { q: string; lang: Lang; at: string; response?: AskResponse; error?: string };

export const isValidQuestion = (q: string) => q.trim().length >= MIN_QUESTION_LENGTH;

/** Newest first, capped. */
export const addToHistory = (list: AskHistoryItem[], item: AskHistoryItem) => [item, ...list].slice(0, ASK_HISTORY_LIMIT);

export const askHistoryKey = (kundliKey: string) => `ask:${kundliKey}`;

export const ASK_EXAMPLES: Record<Lang, string[]> = {
  en: ["When will I get a promotion?", "When is a good time for marriage?", "What remedies should I do for my career?", "Do I have Kaal Sarp dosha?"],
  hi: ["मेरी शादी कब होगी?", "नौकरी में तरक्की कब होगी?", "करियर के लिए क्या उपाय करूँ?", "क्या मेरी कुंडली में कालसर्प दोष है?"],
};
