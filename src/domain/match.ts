/** Ashtakoota (36 guna) matching interpretation. */
import type { MatchResult } from "@/types/api";

export const MATCH_PASS_MARK = 18;

export const isAcceptable = (m: Pick<MatchResult, "total">) => m.total >= MATCH_PASS_MARK;

export function matchDoshas(m: MatchResult): ("nadi_dosha" | "bhakoot_dosha")[] {
  const out: ("nadi_dosha" | "bhakoot_dosha")[] = [];
  if (m.doshas.nadi_dosha) out.push("nadi_dosha");
  if (m.doshas.bhakoot_dosha) out.push("bhakoot_dosha");
  return out;
}

export const scoreRatio = (score: number, max: number) => (max > 0 ? Math.max(0, Math.min(1, score / max)) : 0);
