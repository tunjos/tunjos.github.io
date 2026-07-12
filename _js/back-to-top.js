// =============================================================================
// _js/back-to-top.js
// BackToTop — Floating "Back to Top" Button Module
//
// IIFE pattern: no ES6 import/export required for browser use; works without
// a bundler on GitHub Pages. BackToTop is assigned to the global scope.
//
// For test environments (Vitest / Jest running in Node with jsdom), the module
// is also exported via CommonJS at the bottom of the file.
//
// Public API:
//   BackToTop.init()  — attach scroll listener and click handler
//
// Requirement: 8.6
//   - Show button when window.scrollY > 200px
//   - Hide button when window.scrollY <= 200px
//   - Scroll smoothly to top on click
// =============================================================================

const BackToTop = (() => {
  'use strict';

  /**
   * Update button visibility based on current scroll position.
   * The `hidden` attribute is toggled; the SCSS uses `.back-to-top[hidden]`
   * with opacity/transform transitions so the change is animated rather than
   * an abrupt show/hide.
   *
   * @param {HTMLElement} btn - The back-to-top button element
   */
  function update(btn) {
    btn.hidden = window.scrollY <= 200;
  }

  /**
   * Initialise the BackToTop module:
   *   1. Find the `.back-to-top` button in the DOM; bail if absent
   *   2. Attach a passive scroll listener that shows/hides the button when
   *      scrollY crosses the 200px threshold (Req 8.6)
   *   3. Attach a click listener that scrolls smoothly to the top (Req 8.6)
   *   4. Run an immediate update so the button state is correct on page load
   *      (e.g., if the user returns to a page already scrolled)
   */
  function init() {
    const btn = document.querySelector('.back-to-top');
    if (!btn) return;

    // Passive listener: the handler never calls preventDefault(), so marking it
    // passive allows the browser to optimise scroll performance.
    window.addEventListener('scroll', () => update(btn), { passive: true });

    btn.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    // Sync initial state without waiting for a scroll event
    update(btn);
  }

  // Return public API
  return { init };
})();

// ---------------------------------------------------------------------------
// Node.js / test-environment export
// Allows: const { BackToTop } = require('../_js/back-to-top.js')  (CJS)
// Vitest can be configured to transform this file with jsdom globals.
// ---------------------------------------------------------------------------
if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
  module.exports = { BackToTop };
}
