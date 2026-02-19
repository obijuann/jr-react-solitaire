import type { Theme } from '@mui/material/styles';
import { createTheme } from '@mui/material/styles';
import { makeComponents } from './components';
import { makePallette, ThemeColorProperties, themeColors } from './palette';
import typography from './typography';

const themes: Record<string, Theme> = {};

Object.entries(themeColors).forEach(([k, p]) => {
  const colorProps = p as ThemeColorProperties;
  themes[k] = createTheme({
    palette: makePallette(colorProps),
    typography,
    components: makeComponents(colorProps)
  });
});

export const defaultThemeKey = 'green';
export const themeKeys = Object.keys(themes) as Array<keyof typeof themes>;

export function getTheme(key: string): Theme {
  return themes[key] ?? themes[defaultThemeKey];
}

export default themes;
