/**
 * Light / dark theming, shareable across apps: this folder imports nothing from the app.
 *
 *   <ThemeProvider preference="system" script="latin">…</ThemeProvider>   // follows the device by default
 *   const { colors, tones, dark } = useTheme();
 *   const useStyles = makeStyles((t) => ({ box: { backgroundColor: t.colors.card } }));
 *   const s = useStyles();
 */
import { createContext, useContext, type ReactNode } from "react";
import { StyleSheet, useColorScheme } from "react-native";
import type { Script } from "./fonts";
import { lightTheme, resolveMode, themeFor, type ColorPreference, type Theme } from "./theme";

const ThemeContext = createContext<Theme>(lightTheme);

export function ThemeProvider({ preference = "system", script = "latin", children }: {
  preference?: ColorPreference;
  /** Which font set to use: "devanagari" for Hindi UI. */
  script?: Script;
  children: ReactNode;
}) {
  const system = useColorScheme();
  return <ThemeContext.Provider value={themeFor(resolveMode(preference, system), script)}>{children}</ThemeContext.Provider>;
}

export const useTheme = (): Theme => useContext(ThemeContext);

/** The style-map shape StyleSheet.create accepts. */
type Styles = Parameters<typeof StyleSheet.create>[0];

/** Creates a hook returning StyleSheet styles for the current theme (computed once per theme). */
export function makeStyles<S extends Styles>(factory: (t: Theme) => S & Styles): () => Readonly<S> {
  const cache = new WeakMap<Theme, Readonly<S>>();
  return function useStyles(): Readonly<S> {
    const theme = useTheme();
    let s = cache.get(theme);
    if (!s) {
      s = StyleSheet.create(factory(theme));
      cache.set(theme, s);
    }
    return s;
  };
}
