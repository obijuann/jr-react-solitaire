import type { PaletteOptions } from '@mui/material/styles';

export type ThemeColorProperties = {
    primary: string;
    dark: string;
    light: string;
};

export const themeColors: Record<string, ThemeColorProperties> = {
    'green': { primary: '#007800', dark: '#006000', light: '#01a301' },
    'yellow': { primary: '#9d9d00', dark: '#787800', light: '#b9b900' },
    'cyan': { primary: '#007878', dark: '#006060', light: '#009292' },
    'blue': { primary: '#1414a0', dark: '#101080', light: '#3535b5' },
    'violet': { primary: '#a000a0', dark: '#800080', light: '#b200b2' },
    'red': { primary: '#a00000', dark: '#800000', light: '#b90606' },
};

export function makePallette(themeColors: ThemeColorProperties): PaletteOptions {
    return {
        mode: 'light',
        primary: {
            main: themeColors.primary,
            dark: themeColors.dark,
            light: themeColors.light
        },
        background: {
            default: themeColors.primary,
            paper: themeColors.dark
        },
        text: {
            primary: '#ffffff'
        }
    }
};