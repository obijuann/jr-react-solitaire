import type { Theme } from '@mui/material/styles';
import { createTheme } from '@mui/material/styles';
import { ThemeColorProperties } from '../types/theme';
import { makeComponents } from './components';
import { makePalette, themeColors } from './palette';
import typography from './typography';

// Container of compiled MUI `Theme` objects keyed by the theme name.
const themes: Record<string, Theme> = {};

// Build a `Theme` for each named color set in `themeColors`.
Object.entries(themeColors).forEach(([k, p]) => {
  const colorProps = p as ThemeColorProperties;
  themes[k] = createTheme({
    palette: makePalette(colorProps),
    typography,
    components: makeComponents(colorProps)
  });
});

// Key used when a requested theme is missing.
export const defaultThemeKey = 'green';
// Available theme keys (useful for UI selection menus).
export const themeKeys = Object.keys(themes) as Array<keyof typeof themes>;

/**
 * Return a `Theme` by key, falling back to `defaultThemeKey` when missing.
 */
export function getTheme(key: string): Theme {
  return themes[key] ?? themes[defaultThemeKey];
}

export default themes;
