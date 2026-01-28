import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { throttle, getFormattedTimer } from './utils';

/**
 * Unit tests for throttle utility ensuring it limits calls.
 */
describe('throttle', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('calls the function immediately and then waits before calling again', () => {
    const fn = vi.fn();
    const throttled = throttle(fn, 1000);

    throttled();
    throttled();
    throttled();

    expect(fn).toHaveBeenCalledTimes(1);

    // advance time less than delay
    vi.advanceTimersByTime(500);
    throttled();
    expect(fn).toHaveBeenCalledTimes(1);

    // advance past delay
    vi.advanceTimersByTime(600);
    throttled();
    expect(fn).toHaveBeenCalledTimes(2);
  });
});

/**
 * Unit tests for getFormattedTimer ensuring correct formatting
 * for seconds, minutes, hours and 24-hour reset behavior.
 */
describe('getFormattedTimer', () => {
  it('formats seconds-only values as MM:SS', () => {
    expect(getFormattedTimer(5)).toBe('00:05');
  });

  it('formats minutes and seconds as MM:SS', () => {
    // 2 minutes 5 seconds => 125 seconds
    expect(getFormattedTimer(125)).toBe('02:05');
  });

  it('formats hours, minutes and seconds as HH:MM:SS when hours > 0', () => {
    // 3 hours, 4 minutes, 5 seconds => 3*3600 + 4*60 + 5 = 11045
    expect(getFormattedTimer(11045)).toBe('03:04:05');
  });

  it('resets hours after 24 (25 hours -> 01:00:00)', () => {
    // 25 hours => 25 * 3600 = 90000 seconds
    expect(getFormattedTimer(90000)).toBe('01:00:00');
  });
});
