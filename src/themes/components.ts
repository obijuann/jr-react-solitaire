import type { Components } from '@mui/material/styles';
import { makeGradient, ThemeColorProperties } from './palette';

export function makeComponents(colorProps: ThemeColorProperties): Components {
    // TODO: make this a bit better for most themes
    // const cardPileShadow = colorProps.key === 'midnight' ? midnightCardPileShadow : defaultCardPileShadow;
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
                    background: makeGradient(colorProps),
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
