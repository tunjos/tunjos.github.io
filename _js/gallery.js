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
