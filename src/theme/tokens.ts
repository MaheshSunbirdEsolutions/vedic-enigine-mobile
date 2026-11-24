/** Mode-independent design tokens. */
export const spacing = { xxs: 2, xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 28, xxxl: 36 } as const;
export const radius = { xs: 6, sm: 10, md: 14, lg: 18, xl: 24, pill: 999 } as const;

/** Type ramp: size / line height. Families come from the theme's font set. */
export const typeScale = {
  hero: { size: 30, line: 36 },
  title: { size: 24, line: 30 },
  heading: { size: 19, line: 25 },
  subheading: { size: 16, line: 22 },
  body: { size: 15, line: 23 },
  muted: { size: 14, line: 20 },
  small: { size: 12.5, line: 17 },
  label: { size: 12, line: 16 },
  button: { size: 15, line: 20 },
} as const;

/** Motion: durations (ms) and the spring used for presses and indicators. */
export const motion = {
  fast: 140,
  normal: 220,
  slow: 320,
  spring: { damping: 18, stiffness: 260, mass: 0.6 },
  pressScale: 0.97,
} as const;
