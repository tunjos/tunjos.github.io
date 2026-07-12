// =============================================================================
// _js/nav.js
// NavManager — Mobile Navigation Module
//
// IIFE pattern: no ES6 import/export required for browser use; works without
// a bundler on GitHub Pages. NavManager is assigned to the global scope.
//
// For test environments (Vitest / Jest running in Node with jsdom), the module
// is also exported via CommonJS at the bottom of the file.
//
// Responsibilities:
//   1. Hide the nav list by default on mobile (< 1024px) via list.hidden
//   2. Hamburger toggle: open/close the nav list, set aria-expanded, toggle
//      .site-nav--open on the nav element, lock body scroll (u-no-scroll)
//   3. Keyboard trap: Tab / Shift-Tab cycles within focusable elements while
//      the nav is open on mobile
//   4. Escape key: close the nav and return focus to the toggle button
//   5. Click-outside: close the nav when clicking outside .site-nav
//   6. Active link: highlight the current page link via aria-current + CSS
//      (markup already applied by Jekyll Liquid — no runtime work needed)
//
// Requirements: 2.2, 7.4, 7.9, 8.1
// =============================================================================

const NavManager = (() => {
  'use strict';

  // ---------------------------------------------------------------------------
  // Selectors & class names
  // ---------------------------------------------------------------------------
  const TOGGLE_SEL = '.site-nav__toggle';
  const LIST_SEL   = '.site-nav__list';
  const NAV_SEL    = '.site-nav';
  const OPEN_CLASS = 'site-nav--open';
  const BODY_CLASS = 'u-no-scroll';

  // ---------------------------------------------------------------------------
  // Focusable elements query (used for keyboard trap)
  // ---------------------------------------------------------------------------
  const FOCUSABLE =
    'a[href], button:not([disabled]), input:not([disabled]), ' +
    'select:not([disabled]), textarea:not([disabled]), ' +
    '[tabindex]:not([tabindex="-1"])';

  // ---------------------------------------------------------------------------
  // Module-level state — populated in init()
  // ---------------------------------------------------------------------------
  let toggleEl = null;
  let listEl   = null;
  let navEl    = null;

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------

  /**
   * Returns true when the viewport is in "mobile" mode (< 1024 px).
   * @returns {boolean}
   */
  function isMobile() {
    return window.innerWidth < 1024;
  }

  /**
   * Returns true when the nav drawer is currently open.
   * @returns {boolean}
   */
  function isOpen() {
    return toggleEl.getAttribute('aria-expanded') === 'true';
  }

  // ---------------------------------------------------------------------------
  // Open / Close
  // ---------------------------------------------------------------------------

  /**
   * Open the navigation drawer.
   * - Removes [hidden] from the list so the CSS max-height transition fires.
   * - Sets aria-expanded="true" on the toggle button.
   * - Adds .site-nav--open to the nav element (drives CSS animation).
   * - Adds .u-no-scroll to <body> to prevent background scrolling.
   */
  function open() {
    listEl.hidden = false;
    toggleEl.setAttribute('aria-expanded', 'true');
    toggleEl.setAttribute('aria-label', 'Close navigation menu');
    if (navEl) navEl.classList.add(OPEN_CLASS);
    document.body.classList.add(BODY_CLASS);
  }

  /**
   * Close the navigation drawer.
   * - Re-adds [hidden] to the list (collapses via CSS transition).
   * - Sets aria-expanded="false" on the toggle button.
   * - Removes .site-nav--open from the nav element.
   * - Removes .u-no-scroll from <body>.
   */
  function close() {
    listEl.hidden = true;
    toggleEl.setAttribute('aria-expanded', 'false');
    toggleEl.setAttribute('aria-label', 'Open navigation menu');
    if (navEl) navEl.classList.remove(OPEN_CLASS);
    document.body.classList.remove(BODY_CLASS);
  }

  // ---------------------------------------------------------------------------
  // Keyboard trap
  // ---------------------------------------------------------------------------

  /**
   * Trap Tab / Shift-Tab focus cycling within the nav list while it is open.
   * When focus would leave the list, redirect it back to the first or last
   * focusable element inside the nav element (Req 7.9).
   *
   * @param {KeyboardEvent} e
   */
  function handleTrapFocus(e) {
    if (!isOpen() || !isMobile()) return;

    const focusable = Array.from(navEl.querySelectorAll(FOCUSABLE));
    if (!focusable.length) return;

    const first = focusable[0];
    const last  = focusable[focusable.length - 1];

    if (e.key === 'Tab') {
      if (e.shiftKey) {
        // Shift+Tab: if focus is on the first element, wrap to last
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        // Tab: if focus is on the last element, wrap to first
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    }
  }

  // ---------------------------------------------------------------------------
  // Event handlers
  // ---------------------------------------------------------------------------

  /**
   * Toggle button click handler.
   */
  function handleToggleClick() {
    isOpen() ? close() : open();
  }

  /**
   * Document-level keydown handler.
   * - Escape: close nav and return focus to toggle (Req 7.9).
   * - Tab / Shift-Tab: focus trap while open on mobile (Req 7.9).
   *
   * @param {KeyboardEvent} e
   */
  function handleKeydown(e) {
    if (e.key === 'Escape' && isOpen()) {
      close();
      toggleEl.focus();
      return;
    }

    handleTrapFocus(e);
  }

  /**
   * Document-level click handler for click-outside-to-close behaviour.
   * Ignores clicks that originate inside .site-nav (Req 8.1).
   *
   * @param {MouseEvent} e
   */
  function handleOutsideClick(e) {
    if (!isOpen()) return;
    if (navEl && navEl.contains(e.target)) return;
    close();
  }

  /**
   * Window resize handler.
   * Ensures the nav list state is consistent when the viewport transitions
   * between mobile and desktop: on desktop the list must always be visible,
   * on mobile it starts hidden.
   */
  function handleResize() {
    if (!isMobile()) {
      // Desktop: ensure the list is visible regardless of open/close state.
      listEl.hidden = false;
      // Clean up any leftover body scroll lock from mobile.
      document.body.classList.remove(BODY_CLASS);
      toggleEl.setAttribute('aria-expanded', 'false');
      toggleEl.setAttribute('aria-label', 'Open navigation menu');
      if (navEl) navEl.classList.remove(OPEN_CLASS);
    } else if (!isOpen()) {
      // Mobile: ensure list is hidden when not explicitly opened.
      listEl.hidden = true;
    }
  }

  // ---------------------------------------------------------------------------
  // Active link highlighting
  // ---------------------------------------------------------------------------

  /**
   * Ensure the nav link matching the current page URL receives the active
   * class and aria-current="page".  The Jekyll Liquid template in nav.html
   * already applies these at build time for standard navigations; this
   * function handles the edge case of client-side navigation / hash changes
   * if any SPA-style transitions are ever added.
   *
   * For the current Jekyll setup this is a no-op safety net — active state
   * is already correct from the server-rendered HTML.
   */
  function highlightActiveLink() {
    if (!listEl) return;

    const currentPath = window.location.pathname;

    listEl.querySelectorAll('.site-nav__link').forEach((link) => {
      const href = link.getAttribute('href');
      if (!href) return;

      // Skip external links — they point to a different origin so their
      // pathname (always '/') must never be compared against the current path.
      let parsed;
      try {
        parsed = new URL(href, window.location.href);
      } catch (_) {
        return;
      }
      if (parsed.origin !== window.location.origin) return;

      const linkPath = parsed.pathname;

      const active =
        linkPath === currentPath ||
        // Mark a section link active when the current path is a sub-path of it.
        // Guard linkPath !== '/' to avoid the home link matching every page.
        (linkPath !== '/' && currentPath.startsWith(linkPath));

      link.classList.toggle('site-nav__link--active', active);

      if (active) {
        link.setAttribute('aria-current', 'page');
      } else {
        link.removeAttribute('aria-current');
      }
    });
  }

  // ---------------------------------------------------------------------------
  // Public API
  // ---------------------------------------------------------------------------

  /**
   * Initialise the NavManager:
   *   1. Locate the toggle button and nav list in the DOM.
   *   2. On mobile, hide the nav list by default.
   *   3. Attach all event listeners (toggle click, Escape, click-outside,
   *      resize, focus trap).
   *   4. Highlight the active nav link for the current page.
   *
   * Safe to call multiple times — no-op if elements are not found.
   */
  function init() {
    toggleEl = document.querySelector(TOGGLE_SEL);
    listEl   = document.querySelector(LIST_SEL);
    navEl    = document.querySelector(NAV_SEL);

    if (!toggleEl || !listEl) return;

    // 1. Mobile default: hide the list so it starts collapsed (Req 2.2).
    if (isMobile()) {
      listEl.hidden = true;
    }

    // 2. Toggle button click (Req 2.2, 8.1).
    toggleEl.addEventListener('click', handleToggleClick);

    // 3. Escape key + focus trap (Req 7.9).
    document.addEventListener('keydown', handleKeydown);

    // 4. Click outside to close (Req 8.1).
    document.addEventListener('click', handleOutsideClick);

    // 5. Viewport resize: keep list state consistent.
    window.addEventListener('resize', handleResize);

    // 6. Active link: reinforce server-rendered active state (safety net).
    highlightActiveLink();
  }

  // Return public API.
  // open/close/highlightActiveLink are exported so unit tests can assert on them.
  return { init, open, close, highlightActiveLink };
})();

// ---------------------------------------------------------------------------
// Node.js / test-environment export
// Allows: const { NavManager } = require('../_js/nav.js')  (CJS)
// ---------------------------------------------------------------------------
if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
  module.exports = { NavManager };
}
