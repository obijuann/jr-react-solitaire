import type { Components } from '@mui/material/styles';
import { ThemeColorProperties } from './palette';

export function makeComponents(colorProps: ThemeColorProperties): Components {
    return {
        MuiCssBaseline: {
            styleOverrides: {
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
                body: {
                    background: `radial-gradient(circle at 50% 100%, rgba(255, 255, 255,0.25) 0%, rgba(255, 255, 255,0.1) 50%, rgba(0,0,0,0.3) 95%), ${colorProps.light}`,
                    backgroundRepeat: 'no-repeat',
                    backgroundAttachment: 'fixed',
                    backgroundSize: 'cover',
                    color: 'var(--color-text)'
                },
                '.MuiPaper-root': {
                    backgroundImage: 'none'
                }
            }
        }
    } as Components;
}

export default makeComponents;
