import type { PaletteOptions } from '@mui/material/styles';
import { ThemeColorProperties, ThemeColors } from '../types/theme';

// A small palette of named theme colors used by the app. Each entry
// supplies the primary color and light/dark variants used across the UI.
export const themeColors: Record<ThemeColors, ThemeColorProperties> = {
    'green': { primary: '#007800', dark: '#006000', light: '#01a301', label: 'Green' },
    'yellow': { primary: '#9d9d00', dark: '#787800', light: '#b9b900', label: 'Yellow' },
    'cyan': { primary: '#007878', dark: '#006060', light: '#009292', label: 'Cyan' },
    'blue': { primary: '#1414a0', dark: '#101080', light: '#3535b5', label: 'Blue' },
    'violet': { primary: '#a000a0', dark: '#800080', light: '#b200b2', label: 'Violet' },
    'red': { primary: '#a00000', dark: '#800000', light: '#b90606', label: 'Red' },
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