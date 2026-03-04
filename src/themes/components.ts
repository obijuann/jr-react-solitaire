import type { Components } from '@mui/material/styles';
import { ThemeColorProperties } from '../types/theme';

// Theme-specific component overrides for MUI.
// These set CSS variables on `:root` and provide global baseline styles
// used by the app's UI (background, paper, text color, etc.).
export function makeComponents(colorProps: ThemeColorProperties): Components {
    return {
        MuiCssBaseline: {
            styleOverrides: {
                // CSS variables exposed for use in the app's CSS files.
                ':root': {
                    '--accent-color': colorProps.light,
                    '--card-shadow': 'rgba(0,0,0,0.2)',
                    '--color-primary': colorProps.primary,
                    '--color-primary-dark': colorProps.dark,
                    '--color-primary-light': colorProps.light,
                    '--color-paper': colorProps.dark,
                    '--color-text': '#ffffff',
                    '--color-on-primary': '#ffffff',
                },
                // Global body background + text color tuned to the theme.
                body: {
                    background: `radial-gradient(circle at 50% 100%, rgba(255, 255, 255,0.25) 0%, rgba(255, 255, 255,0.1) 50%, rgba(0,0,0,0.3) 95%), ${colorProps.light}`,
                    backgroundRepeat: 'no-repeat',
                    backgroundAttachment: 'fixed',
                    backgroundSize: 'cover',
                    color: 'var(--color-text)'
                },
                // Remove any default paper background image to keep theme visuals consistent.
                '.MuiPaper-root': {
                    backgroundImage: 'none'
                }
            }
        }
    } as Components;
}
