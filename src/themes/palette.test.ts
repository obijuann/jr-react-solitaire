import type { PaletteOptions, SimplePaletteColorOptions, TypeBackground, TypeText } from '@mui/material/styles';
import { describe, expect, it } from 'vitest';
import { makePalette, themeColors } from './palette';
describe('makePalette', () => {
  it('maps ThemeColorProperties to MUI PaletteOptions', () => {
    // Arrange
    const greenThemeColor = themeColors.green;

    // Act
    const palette = makePalette(greenThemeColor) as PaletteOptions;

    // Assert
    const primaryOptions = palette.primary as SimplePaletteColorOptions;
    expect(primaryOptions.main).toBe(greenThemeColor.primary);
    expect(primaryOptions.main).toBe(greenThemeColor.primary);
    expect(primaryOptions.dark).toBe(greenThemeColor.dark);
    expect((palette.background as TypeBackground).default).toBe(greenThemeColor.primary);
    expect((palette.text as TypeText).primary).toBe('#ffffff');
  });

  it('exports a set of named theme colors', () => {
    // Arrange / Act / Assert
    expect(Object.keys(themeColors)).toContain('green');
    expect(themeColors.red.primary).toMatch(/^#([0-9a-fA-F]{6})$/);
  });
});
