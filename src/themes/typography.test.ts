import { describe, expect, it } from 'vitest';
import typography from './typography';

describe('typography', () => {
  it('sets a system UI font stack', () => {
    // Arrange / Act / Assert
    expect(typeof typography.fontFamily).toBe('string');
    expect(typography.fontFamily).toContain('system-ui');
  });
});
