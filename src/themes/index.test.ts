import { describe, expect, it } from 'vitest';
import { defaultThemeKey, getTheme, themeKeys } from './index';
import { themeColors } from './palette';

describe('themes index', () => {
  it('provides a theme for each key and default fallback', () => {
    // Arrange
    const key = themeKeys[0] as string;

    // Act
    const theme = getTheme(key);
    const defaultTheme = getTheme('nonexistent_key');

    // Assert
    expect(theme.palette.primary?.main).toBe(themeColors[key].primary);
    expect(defaultTheme.palette.primary?.main).toBe(themeColors[defaultThemeKey].primary);
  });

  it('exports themeKeys containing available themes', () => {
    // Assert
    expect(Array.isArray(themeKeys)).toBe(true);
    expect(themeKeys.length).toBeGreaterThan(0);
  });
});
