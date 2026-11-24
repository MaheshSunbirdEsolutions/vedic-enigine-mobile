/** Vimshottari dasha helpers: running periods and the flattened, expandable tree. */
import type { DashaPeriod } from "@/types/api";

export const isCurrent = (p: { start: string; end?: string | null }, now: Date = new Date()) =>
  new Date(p.start) <= now && (!p.end || now < new Date(p.end));

export type DashaRow = {
  key: string; // "3", "3-2", "3-2-5"
  level: 1 | 2 | 3;
  lords: string[]; // [MD], [MD, AD], [MD, AD, PD]
  start: string;
  end: string;
  current: boolean;
  expandable: boolean;
  expanded: boolean;
};

/** Keys of the running MD and AD, used as the initial expanded set. */
export function currentKeys(mds: DashaPeriod[], now: Date = new Date()): Set<string> {
  const keys = new Set<string>();
  mds.forEach((md, i) => {
    if (!isCurrent(md, now)) return;
    keys.add(String(i));
    (md.sub ?? []).forEach((ad, j) => { if (isCurrent(ad, now)) keys.add(`${i}-${j}`); });
  });
  return keys;
}

export function flattenDasha(mds: DashaPeriod[], expanded: Set<string>, now: Date = new Date()): DashaRow[] {
  const rows: DashaRow[] = [];
  mds.forEach((md, i) => {
    const k1 = String(i);
    rows.push({ key: k1, level: 1, lords: [md.lord], start: md.start, end: md.end, current: isCurrent(md, now),
      expandable: !!md.sub?.length, expanded: expanded.has(k1) });
    if (!expanded.has(k1)) return;
    (md.sub ?? []).forEach((ad, j) => {
      const k2 = `${i}-${j}`;
      rows.push({ key: k2, level: 2, lords: [md.lord, ad.lord], start: ad.start, end: ad.end, current: isCurrent(ad, now),
        expandable: !!ad.sub?.length, expanded: expanded.has(k2) });
      if (!expanded.has(k2)) return;
      (ad.sub ?? []).forEach((pd, k) => rows.push({ key: `${k2}-${k}`, level: 3, lords: [md.lord, ad.lord, pd.lord],
        start: pd.start, end: pd.end, current: isCurrent(pd, now), expandable: false, expanded: false }));
    });
  });
  return rows;
}

export const toggleKey = (set: Set<string>, key: string): Set<string> => {
  const n = new Set(set);
  if (n.has(key)) n.delete(key); else n.add(key);
  return n;
};
