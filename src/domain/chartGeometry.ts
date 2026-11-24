/**
 * Geometry of the two kundli drawings on a 400×400 canvas (same as the web app).
 * North: 12 fixed houses, signs rotate with the lagna. South: 12 fixed signs, lagna marked.
 */

/** North Indian house i: label anchor (last point) for planets. */
export const NORTH_PLANET_ANCHOR: [number, number][] = [
  [200, 95], [100, 38], [36, 104], [100, 195], [36, 302], [100, 365],
  [200, 300], [300, 365], [364, 302], [300, 195], [364, 104], [300, 38],
];

/** North Indian house i: where the sign number is written. */
export const NORTH_SIGN_ANCHOR: [number, number][] = [
  [200, 180], [100, 82], [82, 104], [180, 200], [82, 300], [100, 322],
  [200, 224], [300, 322], [318, 300], [220, 200], [318, 104], [300, 82],
];

export const NORTH_LINES = "M0 0L400 400M400 0L0 400M200 0L400 200L200 400L0 200Z";

/** South Indian: sign index → [column, row] on a 4×4 grid (centre 2×2 empty). */
export const SOUTH_CELL: Record<number, [number, number]> = {
  11: [0, 0], 0: [1, 0], 1: [2, 0], 2: [3, 0], 3: [3, 1], 4: [3, 2],
  5: [3, 3], 6: [2, 3], 7: [1, 3], 8: [0, 3], 9: [0, 2], 10: [0, 1],
};

/** Positions for n planet labels around an anchor, in one or two columns. */
export function labelPositions(anchor: [number, number], n: number, lineHeight = 15): [number, number][] {
  const cols = n > 3 ? 2 : 1;
  const rows = Math.ceil(n / cols);
  return Array.from({ length: n }, (_, k) => {
    const col = k % cols, row = Math.floor(k / cols);
    const x = anchor[0] + (cols === 2 ? (col ? 18 : -18) : 0);
    const y = anchor[1] + row * lineHeight - (rows - 1) * (lineHeight / 2);
    return [x, y];
  });
}
