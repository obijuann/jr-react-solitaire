import type { PaletteOptions } from '@mui/material/styles';

export type ThemeColorProperties = {
    primary: string;
    dark: string;
    light: string;
    accent?: string;
};

export const themeColors: Record<string, ThemeColorProperties> = {
    'emerald': { primary: '#0b6623', dark: '#064916', light: '#26a84a', accent: '#26a84a' },
    'amber': { primary: '#f0c000', dark: '#c09000', light: '#ffe16a', accent: '#ffe16a' },
    'aqua': { primary: '#00a3b4', dark: '#007880', light: '#66e9f0', accent: '#66e9f0' },
    'midnight': { primary: '#06111a', dark: '#020613', light: '#243647', accent: '#243647' },
    'orchid': { primary: '#9b59b6', dark: '#6f3f86', light: '#d6a3e0', accent: '#d6a3e0' },
    'red': { primary: '#b22222', dark: '#7a0f0f', light: '#ff6b6b', accent: '#ff6b6b' },
};

export function makeGradient(themeColors: ThemeColorProperties, alpha = 0.25) {
    const colorRgb = hexToRGB(themeColors.light);
    return `radial-gradient(circle at 50% 100%, rgba(${colorRgb},${alpha}) 0%, rgba(${colorRgb},${Math.max(0, alpha - 0.12)}) 20%, rgba(0,0,0,0.02) 95%), ${themeColors.primary}`;
}

export function makePallette(themeColors: ThemeColorProperties): PaletteOptions {
    return {
        mode: 'light',
        primary: {
            main: themeColors.primary,
            dark: themeColors.dark,
            light: themeColors.light,
            contrastText: '#ffffff'
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

function hexToRGB(hex: string): string {
    hex = hex.startsWith("#") ? hex.slice(1) : hex;
    if (hex.length === 3) {
        hex = Array.from(hex).reduce((str, x) => str + x + x, ""); // 123 -> 112233
    }
    const values = hex
        .split(/([a-z0-9]{2,2})/)
        .filter(Boolean)
        .map((x) => parseInt(x, 16));
    return `${values.join(", ")}`;
};