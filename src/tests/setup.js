import '@testing-library/jest-dom/vitest';

import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

// runs a cleanup after each test case (e.g. clearing jsdom)
afterEach(() => {
  cleanup();
});

// Silence known react warning messages during tests that are noisy but
// intentional in the test environment (e.g. act warnings or duplicate key warnings).
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;
const suppressed = [
  /not wrapped in act\(/,
  /Encountered two children with the same key/,
];
console.error = (...args) => {
  if (args && args[0] && typeof args[0] === 'string') {
    for (const re of suppressed) {
      if (re.test(args[0])) return;
    }
  }
  originalConsoleError.apply(console, args);
};
console.warn = (...args) => {
  if (args && args[0] && typeof args[0] === 'string') {
    for (const re of suppressed) {
      if (re.test(args[0])) return;
    }
  }
  originalConsoleWarn.apply(console, args);
};