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
