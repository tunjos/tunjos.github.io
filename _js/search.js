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
