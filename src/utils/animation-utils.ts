import { CardData } from "../types/card-data";

/** Duration of a card translation animation in milliseconds. */
export const cardAnimationDurationMs = 250;
/** Additional time before removing overlay cards after the move completes. */
export const cardAnimationCleanupDelayMs = 325;

/**
 * Minimal moving-card representation used to compute overlay transforms.
 */
export interface MovingCardAnimation {
  card: CardData
  fromRect: DOMRect
  toRect: DOMRect
  startTime: number
  targetFace?: "up" | "down"
}

/**
 * Resolve the effective waste-pile horizontal offset in pixels from the CSS
 * custom properties used by the waste stack layout.
 * @param styles Computed styles for the waste element.
 * @param viewportWidth Current viewport width in pixels.
 * @param offsetNumber Which waste offset to evaluate.
 * @returns Horizontal translation in pixels.
 */
export function getWasteOffsetPx(styles: CSSStyleDeclaration, viewportWidth: number, offsetNumber: 1 | 2): number {
  const pxOffset = Number.parseFloat(styles.getPropertyValue(`--waste-card-offset-${offsetNumber}-px`)) || 0;
  const vwOffset = Number.parseFloat(styles.getPropertyValue(`--waste-card-offset-${offsetNumber}-vw`)) || 0;
  const vwOffsetPx = (vwOffset / 100) * viewportWidth;

  if (pxOffset < 0 || vwOffsetPx < 0) {
    return Math.max(pxOffset, vwOffsetPx);
  }

  return Math.min(pxOffset, vwOffsetPx);
}

/**
 * Compute the final landing rectangle for an incoming waste card after the
 * waste stack offsets have been applied.
 * @param wasteRect Bounding rect of the waste pile container.
 * @param futureWasteCount Waste pile size after the draw completes.
 * @param offsetOnePx Resolved offset for the top card when 3+ cards exist.
 * @param offsetTwoPx Resolved offset for the top card when exactly 2 cards exist.
 * @returns The target rectangle for the animated draw overlay.
 */
export function getWasteTargetRect(wasteRect: DOMRect, futureWasteCount: number, offsetOnePx: number, offsetTwoPx: number): DOMRect {
  let translateX = 0;

  if (futureWasteCount === 2) {
    translateX = offsetTwoPx;
  } else if (futureWasteCount >= 3) {
    translateX = offsetOnePx;
  }

  return new DOMRect(
    wasteRect.left + translateX,
    wasteRect.top,
    wasteRect.width,
    wasteRect.height,
  );
}

/**
 * Convert moving card rectangles into translation deltas for the animation
 * overlay layer.
 * @param movingCards Cards currently being animated.
 * @returns Map of moving-card index to translation deltas.
 */
export function buildMovingTransforms(movingCards: MovingCardAnimation[]): { [key: number]: { x: number, y: number } } {
  const transforms: { [key: number]: { x: number, y: number } } = {};

  movingCards.forEach((moving, index) => {
    transforms[index] = {
      x: moving.toRect.left - moving.fromRect.left,
      y: moving.toRect.top - moving.fromRect.top
    };
  });

  return transforms;
}