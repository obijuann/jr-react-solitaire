import { describe, expect, it } from 'vitest';

import { buildMovingTransforms, getWasteOffsetPx, getWasteTargetRect } from './animation-utils';

function createStyles(values: Record<string, string>): CSSStyleDeclaration {
  return {
    getPropertyValue: (name: string) => values[name] ?? '',
  } as CSSStyleDeclaration;
}

describe('animation utils', () => {
  it('uses the smaller positive waste offset between px and vw', () => {
    const styles = createStyles({
      '--waste-card-offset-1-px': '70',
      '--waste-card-offset-1-vw': '5',
    });

    expect(getWasteOffsetPx(styles, 1000, 1)).toBe(50);
  });

  it('uses the less-negative waste offset for rtl layouts', () => {
    const styles = createStyles({
      '--waste-card-offset-1-px': '-70',
      '--waste-card-offset-1-vw': '-5',
    });

    expect(getWasteOffsetPx(styles, 1000, 1)).toBe(-50);
  });

  it('computes the waste target rect for the incoming top card', () => {
    const baseRect = new DOMRect(100, 40, 80, 120);

    expect(getWasteTargetRect(baseRect, 1, 70, 35).left).toBe(100);
    expect(getWasteTargetRect(baseRect, 2, 70, 35).left).toBe(135);
    expect(getWasteTargetRect(baseRect, 3, 70, 35).left).toBe(170);
  });

  it('builds transform deltas from source and target rects', () => {
    const transforms = buildMovingTransforms([
      {
        card: { rank: 'ace', suit: 'hearts', face: 'down' },
        fromRect: new DOMRect(10, 20, 80, 120),
        toRect: new DOMRect(45, 70, 80, 120),
        startTime: 0,
      }
    ]);

    expect(transforms).toEqual({ 0: { x: 35, y: 50 } });
  });
});