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

    // Wire both the mobile (in nav topbar) and desktop (fixed) toggle buttons
    document.querySelectorAll('.theme-toggle').forEach(function(btn) {
      btn.setAttribute('aria-pressed', theme === 'dark' ? 'true' : 'false');
      btn.setAttribute(
        'aria-label',
        theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'
      );
    });
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

    // Wire up all toggle buttons (mobile topbar + desktop fixed)
    document.querySelectorAll('.theme-toggle').forEach(function(btn) {
      btn.addEventListener('click', toggle);
    });

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
// =============================================================================
// _js/search.js
// Search — Client-Side Search Module
//
// IIFE pattern: no ES6 import/export required for browser use; works without
// a bundler on GitHub Pages. Search is assigned to the global scope.
//
// For test environments (Vitest / Jest running in Node with jsdom), the module
// is also exported via CommonJS at the bottom of the file.
//
// Public API:
//   Search.init(inputSelector, resultsSelector, dataUrl)
//     — lazy-fetch search index on first keystroke, debounced at 200 ms,
//       render results list with keyboard navigation
//   Search.filterPosts(posts, query)
//     — pure filter function exported for unit / property-based testing
//       (Property 7 — Req 8.4)
// =============================================================================

const Search = (() => {
  'use strict';

  // ---------------------------------------------------------------------------
  // State
  // ---------------------------------------------------------------------------

  /** @type {Array<{title: string, url: string, excerpt: string, tags: string[], categories: string[]}>} */
  let _posts = [];

  /** Whether the search index has already been fetched (or attempted). */
  let _loaded = false;

  /** Whether a fetch is in progress (prevents duplicate requests). */
  let _loading = false;

  /** Index of the currently keyboard-highlighted result item, or -1 for none. */
  let _activeIndex = -1;

  // ---------------------------------------------------------------------------
  // Pure filter function — exported for testing (Property 7)
  // ---------------------------------------------------------------------------

  /**
   * Filter a posts array by a query string.
   *
   * Matches case-insensitively against `title` and `excerpt` fields.
   * Tags are searched as well (joined into a single string for substring match).
   *
   * @param {Array<{title?: string, excerpt?: string, tags?: string[]}>} posts
   * @param {string} query
   * @returns {Array} — always an Array (never null/undefined); empty when no match
   */
  function filterPosts(posts, query) {
    if (!Array.isArray(posts)) return [];
    const q = String(query).toLowerCase();
    if (!q) return [];

    return posts.filter((post) => {
      const title   = (post.title   || '').toLowerCase();
      const excerpt = (post.excerpt || '').toLowerCase();
      const tags    = Array.isArray(post.tags)
        ? post.tags.join(' ').toLowerCase()
        : '';
      const categories = Array.isArray(post.categories)
        ? post.categories.join(' ').toLowerCase()
        : '';

      return (
        title.includes(q) ||
        excerpt.includes(q) ||
        tags.includes(q) ||
        categories.includes(q)
      );
    });
  }

  // ---------------------------------------------------------------------------
  // Rendering helpers
  // ---------------------------------------------------------------------------

  /**
   * Render a list of result items inside the results container.
   * Each item is a `<li role="option">` with a link.
   *
   * @param {HTMLElement} container
   * @param {Array<{title: string, url: string, excerpt: string}>} results
   */
  function renderResults(container, results) {
    // Remove any previous results
    container.innerHTML = '';
    _activeIndex = -1;

    if (results.length === 0) {
      const empty = document.createElement('li');
      empty.className = 'search__no-results';
      empty.setAttribute('role', 'option');
      empty.setAttribute('aria-selected', 'false');
      empty.textContent = 'No results found';
      container.appendChild(empty);
      return;
    }

    results.forEach((post, i) => {
      const li = document.createElement('li');
      li.className = 'search__result';
      li.setAttribute('role', 'option');
      li.setAttribute('aria-selected', 'false');
      li.setAttribute('id', 'search-result-' + i);

      const a = document.createElement('a');
      a.className = 'search__result-link';
      a.href = post.url;

      const titleEl = document.createElement('span');
      titleEl.className = 'search__result-title';
      titleEl.textContent = post.title || '';

      const excerptEl = document.createElement('span');
      excerptEl.className = 'search__result-excerpt';
      excerptEl.textContent = post.excerpt || '';

      a.appendChild(titleEl);
      a.appendChild(excerptEl);
      li.appendChild(a);
      container.appendChild(li);
    });
  }

  /**
   * Set the visually-active result item for keyboard navigation.
   *
   * @param {HTMLElement} input
   * @param {HTMLElement} container
   * @param {number} newIndex
   */
  function setActiveItem(input, container, newIndex) {
    const items = container.querySelectorAll('.search__result');
    if (!items.length) return;

    // Clamp to valid range
    const total = items.length;
    if (newIndex < 0) newIndex = total - 1;
    if (newIndex >= total) newIndex = 0;
    _activeIndex = newIndex;

    items.forEach((item, i) => {
      const isActive = i === _activeIndex;
      item.setAttribute('aria-selected', isActive ? 'true' : 'false');
      item.classList.toggle('search__result--active', isActive);
    });

    // Keep active item in view inside the scrollable container
    const active = items[_activeIndex];
    if (active) {
      active.scrollIntoView({ block: 'nearest' });
      // Update aria-activedescendant on the input
      input.setAttribute('aria-activedescendant', 'search-result-' + _activeIndex);
    }
  }

  /**
   * Navigate to the URL of the currently active result item.
   *
   * @param {HTMLElement} container
   */
  function activateCurrentItem(container) {
    if (_activeIndex < 0) return;
    const items = container.querySelectorAll('.search__result');
    if (!items[_activeIndex]) return;
    const link = items[_activeIndex].querySelector('a');
    if (link) link.click();
  }

  /**
   * Show the results container.
   *
   * @param {HTMLElement} container
   */
  function showResults(container) {
    container.hidden = false;
  }

  /**
   * Hide and clear the results container.
   *
   * @param {HTMLElement} container
   */
  function hideResults(container) {
    container.hidden = true;
    container.innerHTML = '';
    _activeIndex = -1;
  }

  // ---------------------------------------------------------------------------
  // Data fetching
  // ---------------------------------------------------------------------------

  /**
   * Lazily fetch the search index JSON.
   * Wraps fetch in try/catch; on failure hides the search UI gracefully (Req 8.4).
   *
   * @param {string} dataUrl
   * @param {HTMLElement} inputEl
   * @param {HTMLElement} containerEl
   * @returns {Promise<void>}
   */
  async function fetchIndex(dataUrl, inputEl, containerEl) {
    if (_loaded || _loading) return;
    _loading = true;

    try {
      const response = await fetch(dataUrl);
      if (!response.ok) {
        throw new Error('Search index fetch failed: ' + response.status);
      }
      const data = await response.json();
      _posts = Array.isArray(data) ? data : [];
      _loaded = true;
    } catch (err) {
      // On failure, disable the search input gracefully and hide the UI
      console.warn('[Search] Could not load search index.', err);
      inputEl.disabled = true;
      inputEl.placeholder = 'Search unavailable';
      hideResults(containerEl);
      _loaded = false; // remain false so we don't re-enter the broken path
    } finally {
      _loading = false;
    }
  }

  // ---------------------------------------------------------------------------
  // Debounce helper
  // ---------------------------------------------------------------------------

  /**
   * Return a debounced version of `fn` with a `delay` ms delay.
   *
   * @param {Function} fn
   * @param {number} delay
   * @returns {Function}
   */
  function debounce(fn, delay) {
    let timer;
    return function (...args) {
      clearTimeout(timer);
      timer = setTimeout(() => fn.apply(this, args), delay);
    };
  }

  // ---------------------------------------------------------------------------
  // Public initialisation
  // ---------------------------------------------------------------------------

  /**
   * Initialise the Search module.
   *
   * - Attaches an input listener (debounced 200 ms) that lazy-fetches the
   *   search index on the first keystroke, then filters and renders results.
   * - Attaches keyboard navigation (ArrowDown, ArrowUp, Enter, Escape).
   * - Attaches a click-outside / blur listener to collapse results.
   *
   * The results container must have `aria-live="polite"` set in the HTML
   * (see _includes/search.html) so that screen readers announce updates.
   *
   * @param {string} inputSelector   — CSS selector for the search <input>
   * @param {string} resultsSelector — CSS selector for the results <ul>
   * @param {string} dataUrl         — URL of the generated search-data.json
   */
  function init(inputSelector, resultsSelector, dataUrl) {
    const inputEl     = document.querySelector(inputSelector);
    const containerEl = document.querySelector(resultsSelector);

    if (!inputEl || !containerEl) return;

    // Ensure results are hidden on load
    hideResults(containerEl);

    // -------------------------------------------------------------------------
    // Core search handler (debounced)
    // -------------------------------------------------------------------------

    const handleInput = debounce(async () => {
      const query = inputEl.value.trim();

      if (!query) {
        hideResults(containerEl);
        return;
      }

      // Lazy-fetch the index on first keystroke
      if (!_loaded) {
        await fetchIndex(dataUrl, inputEl, containerEl);
        if (!_loaded) return; // fetch failed — UI already hidden
      }

      const results = filterPosts(_posts, query);
      renderResults(containerEl, results);
      showResults(containerEl);
    }, 200);

    inputEl.addEventListener('input', handleInput);

    // -------------------------------------------------------------------------
    // Keyboard navigation: ArrowDown / ArrowUp / Enter / Escape
    // -------------------------------------------------------------------------

    inputEl.addEventListener('keydown', (e) => {
      const hasResults =
        !containerEl.hidden &&
        containerEl.querySelectorAll('.search__result').length > 0;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (!hasResults) return;
        setActiveItem(inputEl, containerEl, _activeIndex + 1);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (!hasResults) return;
        setActiveItem(inputEl, containerEl, _activeIndex - 1);
      } else if (e.key === 'Enter') {
        if (_activeIndex >= 0) {
          e.preventDefault();
          activateCurrentItem(containerEl);
        }
      } else if (e.key === 'Escape') {
        hideResults(containerEl);
        _activeIndex = -1;
        inputEl.removeAttribute('aria-activedescendant');
      }
    });

    // -------------------------------------------------------------------------
    // Collapse results when clicking outside the search component
    // -------------------------------------------------------------------------

    document.addEventListener('click', (e) => {
      const wrapper = inputEl.closest('.search');
      if (wrapper && !wrapper.contains(e.target)) {
        hideResults(containerEl);
        inputEl.removeAttribute('aria-activedescendant');
      } else if (!wrapper) {
        // No parent .search wrapper — fall back to checking both elements
        if (!inputEl.contains(e.target) && !containerEl.contains(e.target)) {
          hideResults(containerEl);
          inputEl.removeAttribute('aria-activedescendant');
        }
      }
    });
  }

  // Return public API
  return { init, filterPosts };
})();

// ---------------------------------------------------------------------------
// Node.js / test-environment export
// Allows: const { Search } = require('../_js/search.js')  (CJS)
// Vitest can be configured to transform this file with jsdom globals.
// ---------------------------------------------------------------------------
if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
  module.exports = { Search, filterPosts: Search.filterPosts };
}
// =============================================================================
// _js/gallery.js
// GalleryManager — Lightbox Gallery Module (fancyBox replacement)
//
// IIFE pattern: no ES6 import/export required for browser use; works without
// a bundler on GitHub Pages. GalleryManager is assigned to the global scope.
//
// For test environments (Vitest / Jest running in Node with jsdom), the module
// is also exported via CommonJS at the bottom of the file.
//
// Replaces fancyBox 2.x. Supports:
//   - Per-project grouped image galleries (data-gallery="<group-id>")
//   - Next/previous navigation with loop-around
//   - Thumbnail strip for direct jump navigation
//   - Keyboard navigation: Escape closes, Left/Right arrows navigate
//   - Focus trap within the modal (Tab / Shift+Tab cycle)
//   - Resume PDF modal via data-gallery-type="iframe" (95vw × 95vh)
//   - ARIA: role="dialog", aria-modal="true", aria-label, aria-live
//   - Returns focus to the triggering element on close
//
// Public API:
//   GalleryManager.init()                 — Scan DOM and attach all listeners
//   GalleryManager.open(groupId, index)   — Open the modal for a group/image
//   GalleryManager.close()                — Close the modal, restore focus
//   GalleryManager.next()                 — Show the next image in the group
//   GalleryManager.prev()                 — Show the previous image in the group
//
// HTML data attributes read:
//   data-gallery="<id>"                   — Groups triggers into a named gallery
//   data-gallery-src="<url>"              — Full-size image URL
//   data-gallery-thumb="<url>"            — Thumbnail URL for the thumb strip
//   data-gallery-title="<string>"         — Caption text (also aria-label on img)
//   data-gallery-type="iframe"            — Render as an iframe instead of <img>
//
// Requirements: 1.5, 1.6, 7.10
// =============================================================================

const GalleryManager = (() => {
  'use strict';

  // ---------------------------------------------------------------------------
  // State
  // ---------------------------------------------------------------------------

  /**
   * groups: Map<string, Array<{trigger, src, thumb, title, type}>>
   * Populated by init() from all [data-gallery] elements.
   */
  let groups = new Map();

  /** The currently open modal element, or null when closed. */
  let modal = null;

  /** Active group identifier string while modal is open. */
  let currentGroupId = null;

  /** Index of the currently displayed item within the active group. */
  let currentIndex = 0;

  /** The element that triggered the open — focus returns here on close. */
  let triggerElement = null;

  // ---------------------------------------------------------------------------
  // Selector helpers
  // ---------------------------------------------------------------------------

  const FOCUSABLE_SELECTORS =
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

  // ---------------------------------------------------------------------------
  // init
  // ---------------------------------------------------------------------------

  /**
   * Scan the document for all [data-gallery] anchors/buttons, group them by
   * their `data-gallery` value, and attach click handlers.
   *
   * Safe to call multiple times; re-initialisation clears previous state.
   */
  function init() {
    groups = new Map();

    const triggers = document.querySelectorAll('[data-gallery]');
    if (!triggers.length) return;

    triggers.forEach((trigger) => {
      const groupId = trigger.dataset.gallery;
      if (!groupId) return;

      if (!groups.has(groupId)) groups.set(groupId, []);

      groups.get(groupId).push({
        trigger,
        src:   trigger.dataset.gallerySrc   || trigger.getAttribute('href') || '',
        thumb: trigger.dataset.galleryThumb || trigger.dataset.gallerySrc  || trigger.getAttribute('href') || '',
        title: trigger.dataset.galleryTitle || '',
        type:  trigger.dataset.galleryType  || 'image',
      });
    });

    // Attach click handlers to every trigger
    triggers.forEach((trigger) => {
      trigger.addEventListener('click', (e) => {
        e.preventDefault();
        const groupId = trigger.dataset.gallery;
        const group = groups.get(groupId);
        if (!group) return;
        const index = group.findIndex((item) => item.trigger === trigger);
        open(groupId, index >= 0 ? index : 0);
      });
    });
  }

  // ---------------------------------------------------------------------------
  // open
  // ---------------------------------------------------------------------------

  /**
   * Build and insert the modal into the DOM, show the item at `startIndex`.
   *
   * @param {string} groupId    — The gallery group to display.
   * @param {number} startIndex — Zero-based index of the first item to show.
   */
  function open(groupId, startIndex) {
    const group = groups.get(groupId);
    if (!group || !group.length) return;

    // Record the element that triggered the open so we can return focus later
    triggerElement = document.activeElement;

    currentGroupId = groupId;
    currentIndex   = startIndex;

    // Build modal DOM
    modal = buildModal(group, groupId, startIndex);
    document.body.appendChild(modal);
    document.body.classList.add('u-no-scroll');

    // Move focus inside the modal and trap it
    trapFocus(modal);

    // Global keyboard handler: Escape and arrow keys
    document.addEventListener('keydown', handleKeydown);
  }

  // ---------------------------------------------------------------------------
  // close
  // ---------------------------------------------------------------------------

  /**
   * Remove the modal from the DOM, restore scroll, return focus to the trigger.
   */
  function close() {
    if (!modal) return;

    document.removeEventListener('keydown', handleKeydown);
    document.body.classList.remove('u-no-scroll');

    modal.remove();
    modal          = null;
    currentGroupId = null;

    // Return focus to the element that opened the gallery (Req 7.10)
    if (triggerElement && typeof triggerElement.focus === 'function') {
      triggerElement.focus();
    }
    triggerElement = null;
  }

  // ---------------------------------------------------------------------------
  // next / prev
  // ---------------------------------------------------------------------------

  /** Show the next item in the group, wrapping around at the end. */
  function next() {
    if (!currentGroupId) return;
    const group = groups.get(currentGroupId);
    currentIndex = (currentIndex + 1) % group.length;
    updateModalContent(group, currentIndex);
  }

  /** Show the previous item in the group, wrapping around at the start. */
  function prev() {
    if (!currentGroupId) return;
    const group = groups.get(currentGroupId);
    currentIndex = (currentIndex - 1 + group.length) % group.length;
    updateModalContent(group, currentIndex);
  }

  // ---------------------------------------------------------------------------
  // buildModal
  // ---------------------------------------------------------------------------

  /**
   * Construct the full modal DOM tree for a group.
   *
   * @param {Array}  group      — Array of gallery items.
   * @param {string} groupId    — Group name used for aria-label.
   * @param {number} startIndex — Index to display initially.
   * @returns {HTMLElement}
   */
  function buildModal(group, groupId, startIndex) {
    const isSingleIframe =
      group.length === 1 && group[0].type === 'iframe';

    // Overlay / dialog container
    const overlay = document.createElement('div');
    overlay.className = 'gallery__modal';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-label', groupId + ' gallery');

    // Close on backdrop click (outside the inner container)
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) close();
    });

    // Inner container (constrains size, is not the backdrop)
    const container = document.createElement('div');
    container.className = 'gallery__container';
    overlay.appendChild(container);

    // ── Close button ──────────────────────────────────────────────────────────
    const closeBtn = document.createElement('button');
    closeBtn.type          = 'button';
    closeBtn.className     = 'gallery__close';
    closeBtn.setAttribute('aria-label', 'Close gallery');
    closeBtn.innerHTML     = svgIcon('close');
    closeBtn.addEventListener('click', close);
    container.appendChild(closeBtn);

    // ── Content area (image or iframe) ───────────────────────────────────────
    const contentArea = document.createElement('div');
    contentArea.className = 'gallery__content';
    contentArea.setAttribute('aria-live', 'polite');
    contentArea.setAttribute('aria-atomic', 'true');
    container.appendChild(contentArea);

    if (!isSingleIframe) {
      // ── Navigation: previous button ───────────────────────────────────────
      if (group.length > 1) {
        const prevBtn = document.createElement('button');
        prevBtn.type        = 'button';
        prevBtn.className   = 'gallery__nav gallery__nav--prev';
        prevBtn.setAttribute('aria-label', 'Previous image');
        prevBtn.innerHTML   = svgIcon('chevron-left');
        prevBtn.addEventListener('click', prev);
        container.appendChild(prevBtn);

        // ── Navigation: next button ─────────────────────────────────────────
        const nextBtn = document.createElement('button');
        nextBtn.type        = 'button';
        nextBtn.className   = 'gallery__nav gallery__nav--next';
        nextBtn.setAttribute('aria-label', 'Next image');
        nextBtn.innerHTML   = svgIcon('chevron-right');
        nextBtn.addEventListener('click', next);
        container.appendChild(nextBtn);
      }

      // ── Thumbnail strip ───────────────────────────────────────────────────
      if (group.length > 1) {
        const thumbStrip = document.createElement('div');
        thumbStrip.className = 'gallery__thumbs';
        thumbStrip.setAttribute('role', 'list');
        thumbStrip.setAttribute('aria-label', 'Gallery thumbnails');

        group.forEach((item, idx) => {
          const thumbBtn = document.createElement('button');
          thumbBtn.type      = 'button';
          thumbBtn.className = 'gallery__thumb' + (idx === startIndex ? ' gallery__thumb--active' : '');
          thumbBtn.setAttribute('aria-label', item.title || ('Image ' + (idx + 1)));
          thumbBtn.setAttribute('aria-pressed', idx === startIndex ? 'true' : 'false');
          thumbBtn.setAttribute('role', 'listitem');
          thumbBtn.dataset.index = idx;

          const thumbImg = document.createElement('img');
          thumbImg.src    = item.thumb;
          thumbImg.alt    = item.title || ('Thumbnail ' + (idx + 1));
          thumbImg.width  = 60;
          thumbImg.height = 60;
          thumbImg.setAttribute('loading', 'lazy');
          thumbImg.setAttribute('decoding', 'async');
          thumbBtn.appendChild(thumbImg);

          thumbBtn.addEventListener('click', () => {
            currentIndex = idx;
            updateModalContent(group, idx);
          });

          thumbStrip.appendChild(thumbBtn);
        });

        container.appendChild(thumbStrip);
      }
    }

    // ── Caption ───────────────────────────────────────────────────────────────
    const caption = document.createElement('p');
    caption.className = 'gallery__caption';
    caption.id        = 'gallery-caption';
    container.appendChild(caption);

    // Populate the content area with the first item
    renderItem(contentArea, caption, group[startIndex]);

    return overlay;
  }

  // ---------------------------------------------------------------------------
  // updateModalContent
  // ---------------------------------------------------------------------------

  /**
   * Update the content area, caption, and thumbnail strip active state after
   * next/prev/thumb navigation.
   *
   * @param {Array}  group — Current gallery group.
   * @param {number} index — New active index.
   */
  function updateModalContent(group, index) {
    if (!modal) return;

    const contentArea = modal.querySelector('.gallery__content');
    const caption     = modal.querySelector('.gallery__caption');

    if (contentArea && caption) {
      renderItem(contentArea, caption, group[index]);
    }

    // Update thumbnail active states
    const thumbBtns = modal.querySelectorAll('.gallery__thumb');
    thumbBtns.forEach((btn) => {
      const isActive = parseInt(btn.dataset.index, 10) === index;
      btn.classList.toggle('gallery__thumb--active', isActive);
      btn.setAttribute('aria-pressed', isActive ? 'true' : 'false');
    });

    // Update ARIA label on the overlay to reflect current position
    const totalLabel =
      group[index].title
        ? group[index].title + ' (' + (index + 1) + ' of ' + group.length + ')'
        : (index + 1) + ' of ' + group.length;
    modal.setAttribute('aria-label', totalLabel);
  }

  // ---------------------------------------------------------------------------
  // renderItem
  // ---------------------------------------------------------------------------

  /**
   * Replace the content area's children with either an <img> or an <iframe>
   * depending on the item type.
   *
   * @param {HTMLElement} contentArea
   * @param {HTMLElement} caption
   * @param {{src, thumb, title, type}} item
   */
  function renderItem(contentArea, caption, item) {
    // Clear previous content
    contentArea.innerHTML = '';

    if (item.type === 'iframe') {
      // Resume PDF or other iframe content (95vw × 95vh per Req 1.5)
      const iframe = document.createElement('iframe');
      iframe.src                     = item.src;
      iframe.className               = 'gallery__iframe';
      iframe.setAttribute('title',   item.title || 'Document viewer');
      // width/height are controlled by CSS (.gallery__iframe: 95vw × 95vh)
      iframe.setAttribute('loading', 'lazy');
      contentArea.appendChild(iframe);
    } else {
      const img        = document.createElement('img');
      img.src          = item.src;
      img.alt          = item.title || '';
      img.className    = 'gallery__img';
      img.setAttribute('decoding', 'async');
      contentArea.appendChild(img);
    }

    // Update caption
    caption.textContent = item.title || '';
    caption.hidden      = !item.title;
  }

  // ---------------------------------------------------------------------------
  // trapFocus
  // ---------------------------------------------------------------------------

  /**
   * Constrain Tab / Shift-Tab focus cycling to the elements inside `modal`.
   * Also moves initial focus to the first focusable element inside the modal.
   *
   * Escape key is handled by the global `handleKeydown` listener attached in
   * `open()`, so it is intentionally not duplicated here.
   *
   * @param {HTMLElement} modal
   */
  function trapFocus(modal) {
    const getFocusable = () =>
      Array.from(modal.querySelectorAll(FOCUSABLE_SELECTORS)).filter(
        (el) => !el.disabled && el.offsetParent !== null
      );

    modal.addEventListener('keydown', (e) => {
      if (e.key !== 'Tab') return;

      const focusable = getFocusable();
      if (!focusable.length) return;

      const first = focusable[0];
      const last  = focusable[focusable.length - 1];

      if (e.shiftKey) {
        // Shift+Tab: wrap from first → last
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        // Tab: wrap from last → first
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    });

    // Move initial focus inside the modal
    const focusable = getFocusable();
    if (focusable.length) focusable[0].focus();
  }

  // ---------------------------------------------------------------------------
  // handleKeydown (global, active while modal is open)
  // ---------------------------------------------------------------------------

  /**
   * Global keyboard handler registered while the modal is open.
   *   - Escape → close
   *   - ArrowLeft → prev
   *   - ArrowRight → next
   */
  function handleKeydown(e) {
    switch (e.key) {
      case 'Escape':
        e.preventDefault();
        close();
        break;
      case 'ArrowLeft':
        e.preventDefault();
        prev();
        break;
      case 'ArrowRight':
        e.preventDefault();
        next();
        break;
      default:
        break;
    }
  }

  // ---------------------------------------------------------------------------
  // svgIcon — inline SVG helpers (no external sprite dependency)
  // ---------------------------------------------------------------------------

  /**
   * Return a minimal inline SVG string for a named icon.
   * Uses aria-hidden so the button's aria-label provides the accessible name.
   *
   * @param {'close'|'chevron-left'|'chevron-right'} name
   * @returns {string} HTML string
   */
  function svgIcon(name) {
    const icons = {
      'close':
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" ' +
        'width="24" height="24" aria-hidden="true" focusable="false">' +
        '<path fill="currentColor" d="M18 6 6 18M6 6l12 12" ' +
        'stroke="currentColor" stroke-width="2" stroke-linecap="round"/>' +
        '</svg>',
      'chevron-left':
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" ' +
        'width="24" height="24" aria-hidden="true" focusable="false">' +
        '<path fill="none" stroke="currentColor" stroke-width="2" ' +
        'stroke-linecap="round" stroke-linejoin="round" d="M15 18l-6-6 6-6"/>' +
        '</svg>',
      'chevron-right':
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" ' +
        'width="24" height="24" aria-hidden="true" focusable="false">' +
        '<path fill="none" stroke="currentColor" stroke-width="2" ' +
        'stroke-linecap="round" stroke-linejoin="round" d="M9 18l6-6-6-6"/>' +
        '</svg>',
    };
    return icons[name] || '';
  }

  // ---------------------------------------------------------------------------
  // Public API
  // ---------------------------------------------------------------------------

  return { init, open, close, next, prev };
})();

// ---------------------------------------------------------------------------
// Node.js / test-environment export
// Allows: const { GalleryManager } = require('../_js/gallery.js')  (CJS)
// Vitest can be configured to transform this file with jsdom globals.
// ---------------------------------------------------------------------------
if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
  module.exports = { GalleryManager };
}
// =============================================================================
// _js/main.js
// Orchestrator — DOMContentLoaded entry point
//
// IIFE-compatible script (no bundler required). Runs after the DOM is fully
// parsed (loaded via `defer` in _includes/scripts.html). All module globals
// (ThemeManager, NavManager, BackToTop, Search, GalleryManager) are defined
// in their own files and concatenated before this file at build time.
//
// Responsibilities:
//   1. Initialise every JS module in dependency order.
//   2. Wire up the project tag filter — filter `.project-card` elements by
//      their `data-tag` attribute when a `.tag-filter__btn` button is clicked
//      (Req 8.5: tag/category filters hide non-matching items and display a
//      distinct active-state indicator on the selected filter).
//
// Requirements: 1.6, 8.5
// =============================================================================

(function () {
  'use strict';

  // ---------------------------------------------------------------------------
  // Project tag filter
  // ---------------------------------------------------------------------------

  /**
   * Initialise the project tag filter on the projects page.
   *
   * Markup contract (rendered by _includes/project_tags.html and the project
   * layout):
   *   - Filter buttons:  `.tag-filter__btn[data-tag]`
   *                      The "All" button carries `data-tag="all"`.
   *                      Individual tag buttons carry their tag in lowercase.
   *   - Project cards:   `.project-card[data-tag]`
   *                      Each card carries a space-separated list of its tags
   *                      in lowercase on the `data-tag` attribute, e.g.
   *                      `data-tag="android api"`.
   *
   * Active state is communicated via:
   *   - CSS class  `tag-filter__btn--active`  on the selected button.
   *   - `aria-pressed="true"`  on the selected button (all others set to "false").
   *
   * Non-matching project cards are hidden with the `hidden` attribute so they
   * are removed from the accessibility tree as well as the visual layout.
   *
   * Safe to call on pages that have no tag filter — returns early if neither
   * the filter container nor any project cards are present.
   */
  function initTagFilter() {
    var filterBtns   = document.querySelectorAll('.tag-filter__btn');
    var projectCards = document.querySelectorAll('.project-card');

    // Bail out if there is no filter or no cards on this page.
    if (!filterBtns.length || !projectCards.length) return;

    filterBtns.forEach(function (btn) {
      btn.addEventListener('click', function () {
        var selectedTag = btn.dataset.tag || 'all';

        // ── Update button states ────────────────────────────────────────────
        filterBtns.forEach(function (b) {
          var isActive = b === btn;
          b.classList.toggle('tag-filter__btn--active', isActive);
          b.setAttribute('aria-pressed', isActive ? 'true' : 'false');
        });

        // ── Show / hide project cards ───────────────────────────────────────
        projectCards.forEach(function (card) {
          if (selectedTag === 'all') {
            card.hidden = false;
            return;
          }

          // card.dataset.tag holds a space-separated list of lowercase tags,
          // e.g. "android api".  Split and check for exact membership so that
          // "android" does not accidentally match "androidx".
          var cardTags = (card.dataset.tag || '')
            .toLowerCase()
            .split(/\s+/)
            .filter(Boolean);

          card.hidden = !cardTags.includes(selectedTag.toLowerCase());
        });
      });
    });
  }

  // ---------------------------------------------------------------------------
  // DOMContentLoaded orchestration
  // ---------------------------------------------------------------------------

  document.addEventListener('DOMContentLoaded', function () {
    // Initialise theme first so there is no flash between the inline FOTWT
    // script (which runs before stylesheets) and the full toggle-button wiring.
    if (typeof ThemeManager !== 'undefined') ThemeManager.init();

    // Navigation: hamburger toggle, keyboard trap, click-outside, active link.
    if (typeof NavManager !== 'undefined') NavManager.init();

    // Back-to-top button: scroll listener and smooth scroll on click.
    if (typeof BackToTop !== 'undefined') BackToTop.init();

    // Client-side search: lazy index fetch, debounced filter, ARIA live region.
    if (typeof Search !== 'undefined') {
      Search.init('.search__input', '#search-results', '/search-data.json');
    }

    // Lightbox gallery: groups [data-gallery] triggers, handles keyboard/focus.
    if (typeof GalleryManager !== 'undefined') GalleryManager.init();

    // Project tag filter (projects page only — no-op on other pages).
    initTagFilter();
  });

}());
