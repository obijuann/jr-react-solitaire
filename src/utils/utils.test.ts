import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { throttle } from './utils';

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
