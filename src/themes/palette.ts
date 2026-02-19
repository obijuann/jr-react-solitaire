import type { PaletteOptions } from '@mui/material/styles';

// Basic set of color properties describing a theme.
export type ThemeColorProperties = {
    primary: string;
    dark: string;
    light: string;
};

// A small palette of named theme colors used by the app. Each entry
// supplies the primary color and light/dark variants used across the UI.
export const themeColors: Record<string, ThemeColorProperties> = {
    'green': { primary: '#007800', dark: '#006000', light: '#01a301' },
    'yellow': { primary: '#9d9d00', dark: '#787800', light: '#b9b900' },
    'cyan': { primary: '#007878', dark: '#006060', light: '#009292' },
    'blue': { primary: '#1414a0', dark: '#101080', light: '#3535b5' },
    'violet': { primary: '#a000a0', dark: '#800080', light: '#b200b2' },
    'red': { primary: '#a00000', dark: '#800000', light: '#b90606' },
};

/**
 * Create a MUI `PaletteOptions` object from the app's small color properties.
 * This function maps the simple `ThemeColorProperties` into the shape
 * expected by MUI themes (primary, background, text, etc.).
 */
export function makePalette(themeColors: ThemeColorProperties): PaletteOptions {
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