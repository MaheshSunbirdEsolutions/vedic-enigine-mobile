/** Maps engine labels to a visual tone (colour family). One table per concept. */
import type { Tone } from "@/theme";

export type { Tone };

export function ratingTone(r?: string | null): Tone {
  if (r === "excellent" || r === "good") return "good";
  if (r === "mixed" || r === "average") return "mixed";
  if (!r) return "neutral";
  return "bad";
}

const DIGNITY: Record<string, Tone> = { exalted: "good", own: "good", moolatrikona: "good", debilitated: "bad", enemy: "bad" };
export const dignityTone = (d: string): Tone => DIGNITY[d] ?? "neutral";

const NATURE: Record<string, Tone> = { benefic: "good", challenging: "bad", mixed: "mixed" };
export const natureTone = (n: string): Tone => NATURE[n] ?? "neutral";

export const priorityTone = (p: string): Tone => (p === "high" ? "bad" : p === "medium" ? "mixed" : "neutral");

export const verdictTone = (v?: string): Tone => (v === "strong" ? "good" : v === "weak" ? "bad" : v ? "mixed" : "neutral");
