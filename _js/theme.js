// =============================================================================
// _js/theme.js
// ThemeManager — Dark/Light Mode Module
//
// IIFE pattern: no ES6 import/export required for browser use; works without
// a bundler on GitHub Pages. ThemeManager is assigned to the global scope.
//
// For test environments (Vitest / Jest running in Node with jsdom), the module
// is also exported via CommonJS at the bottom of the file.
//
// Public API:
//   ThemeManager.init()    — resolve theme, apply to DOM, attach listeners
//   ThemeManager.toggle()  — flip theme, persist, re-apply
//   ThemeManager.apply()   — apply a named theme to the DOM + ARIA state
// =============================================================================

const ThemeManager = (() => {
  'use strict';

  const STORAGE_KEY = 'theme';
  const ROOT = document.documentElement;

  // ---------------------------------------------------------------------------
  // localStorage helpers — wrapped in try/catch for private-browsing safety
  // ---------------------------------------------------------------------------

  function safeGetStorage(key) {
    try {
      return localStorage.getItem(key);
    } catch (e) {
      return null;
    }
  }

  function safeSetStorage(key, value) {
    try {
      localStorage.setItem(key, value);
    } catch (e) {
      // Private browsing or storage quota exceeded — silently ignore
    }
  }

  // ---------------------------------------------------------------------------
  // Internal helpers
  // ---------------------------------------------------------------------------

  /**
   * Read the OS/browser colour-scheme preference.
   * @returns {'dark'|'light'}
   */
  function getPreferred() {
    return window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light';
  }

  // ---------------------------------------------------------------------------
  // Public functions
  // ---------------------------------------------------------------------------

  /**
   * Apply a theme:
   *   - Sets `data-theme` on <html>
   *   - Updates `aria-pressed` and `aria-label` on the .theme-toggle button
   *
   * @param {'dark'|'light'} theme
   */
  function apply(theme) {
    ROOT.setAttribute('data-theme', theme);

    const btn = document.querySelector('.theme-toggle');
    if (btn) {
      btn.setAttribute('aria-pressed', theme === 'dark' ? 'true' : 'false');
      btn.setAttribute(
        'aria-label',
        theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'
      );
    }
  }

  /**
   * Toggle between 'light' and 'dark':
   *   - Reads the current `data-theme` from <html>
   *   - Flips to the opposite value
   *   - Persists the new value to localStorage under key 'theme'
   *   - Calls apply() to update the DOM
   *
   * Exported for use in property-based tests (Property 2).
   */
  function toggle() {
    const current = ROOT.getAttribute('data-theme') || 'light';
    const next = current === 'dark' ? 'light' : 'dark';
    safeSetStorage(STORAGE_KEY, next);
    apply(next);
  }

  /**
   * Initialise the ThemeManager:
   *   1. Read localStorage 'theme'; if absent, fall back to prefers-color-scheme
   *      and store the detected value so subsequent page loads are consistent
   *      (Req 4.2)
   *   2. Apply the resolved theme to the DOM (Req 4.7)
   *   3. Attach a click listener to .theme-toggle (Req 4.3)
   *   4. Observe system preference changes — only react when the user has NOT
   *      manually chosen a theme (i.e. no localStorage entry) (Req 4.8)
   *
   * Note: An inline FOTWT (Flash-of-Wrong-Theme) script in <head> already sets
   * data-theme before stylesheets parse. This init() call in DOMContentLoaded
   * re-applies it (idempotently) and wires up interactivity.
   */
  function init() {
    // Resolve: stored preference → OS preference
    let stored = safeGetStorage(STORAGE_KEY);
    if (!stored) {
      stored = getPreferred();
      safeSetStorage(STORAGE_KEY, stored); // persist so Req 4.2 is satisfied
    }
    apply(stored);

    // Wire up the toggle button
    const btn = document.querySelector('.theme-toggle');
    if (btn) {
      btn.addEventListener('click', toggle);
    }

    // React to OS preference changes ONLY when the user has not chosen manually
    // (Req 4.8: "update the active theme ONLY IF no `theme` key exists in localStorage")
    window
      .matchMedia('(prefers-color-scheme: dark)')
      .addEventListener('change', (e) => {
        if (!safeGetStorage(STORAGE_KEY)) {
          apply(e.matches ? 'dark' : 'light');
        }
      });
  }

  // Return public API
  return { init, toggle, apply };
})();

// ---------------------------------------------------------------------------
// Node.js / test-environment export
// Allows: const { ThemeManager } = require('../_js/theme.js')  (CJS)
// Vitest can be configured to transform this file with jsdom globals.
// ---------------------------------------------------------------------------
if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
  module.exports = { ThemeManager };
}
