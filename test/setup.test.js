/**
 * Test framework smoke test — verifies vitest and fast-check are installed
 * and the test environment is wired up correctly.
 *
 * Feature: site-modernization — Task 17.1 (test infrastructure setup)
 */
import { describe, it, expect } from 'vitest';
import fc from 'fast-check';

describe('Test framework setup', () => {
  it('vitest is operational', () => {
    expect(true).toBe(true);
  });

  it('jsdom environment provides window and document globals', () => {
    expect(typeof window).toBe('object');
    expect(typeof document).toBe('object');
    expect(typeof document.querySelector).toBe('function');
  });

  it('fast-check is operational — string property', () => {
    fc.assert(
      fc.property(fc.string(), (s) => {
        // A string concatenated with itself is always twice its original length
        return (s + s).length === s.length * 2;
      }),
      { numRuns: 100 }
    );
  });

  it('fast-check constantFrom works for theme values', () => {
    fc.assert(
      fc.property(fc.constantFrom('light', 'dark'), (theme) => {
        return theme === 'light' || theme === 'dark';
      }),
      { numRuns: 50 }
    );
  });
});
