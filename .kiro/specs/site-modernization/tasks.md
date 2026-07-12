# Implementation Plan: Site Modernization — tunjos.co

## Overview

This plan converts the tunjos.co Jekyll blog/portfolio from Bootstrap 3 + jQuery 1.x + Font Awesome 4.x to a lean, custom stack: vanilla JS ES6, Sass 7-1 architecture, CSS Grid + Flexbox, CSS Custom Properties, dark mode, WCAG 2.1 AA accessibility, and Lighthouse ≥ 90 performance — all while preserving every URL, every content file, and full GitHub Pages compatibility.

The tasks are ordered so that the Sass foundation and layout come first, then navigation and theme toggling, then content components, then JavaScript modules, and finally test infrastructure and cleanup. Each task builds on prior ones with no orphaned code.

## Tasks

- [x] 1. Set up project foundation and Sass 7-1 architecture
  - Create `_sass/` directory tree: `abstracts/`, `base/`, `layout/`, `components/`, `themes/`, `utilities/`, `vendors/`
  - Create `_sass/main.scss` as the single entry point with `@import` statements for all partials (in correct cascade order)
  - Create `_sass/abstracts/_tokens.scss` with all CSS Custom Properties for light theme on `:root` and dark overrides on `[data-theme="dark"]` — include inline comments per Req 11.3
  - Create `_sass/abstracts/_mixins.scss` with `mq($bp)` breakpoint mixin, `touch-target` mixin, and `visually-hidden` helper
  - Create `_sass/abstracts/_functions.scss` with fluid-type and rem-conversion helpers
  - Create `_sass/base/_reset.scss` (modern box-sizing, margin normalisation)
  - Create `_sass/base/_accessibility.scss` with `.skip-link` and `:focus-visible` focus ring rules
  - Create `_sass/vendors/_syntax.scss` migrated from `_sass/_syntax-highlighting.scss`
  - Create `.browserslistrc` at the project root
  - Create `STYLE_GUIDE.md` at the project root with all token tables and component inventory sections (fill in as components are built)
  - _Requirements: 3.3, 3.7, 11.1, 11.2, 11.3, 11.4, 14.7_

- [x] 2. Implement typography and base styles
  - [x] 2.1 Write `_sass/base/_typography.scss`
    - Add fluid `font-size: clamp(15px, 2.5vw, 18px)` on `body`, system font stack via `var(--font-sans)`, line-height 1.65
    - Define heading scale h1–h6 using the 1.25 Major Third token values, weight 650, line-height 1.2, letter-spacing −0.025em
    - Add link styles using `var(--color-accent)` with underline offset and hover transition
    - Constrain `.post-content, .page-content` to `max-width: var(--content-max-width)` (75ch)
    - Add `@font-face` for Inter variable font with `font-display: swap`
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7, 5.8_

- [x] 3. Build site layout (CSS Grid) and responsive breakpoints
  - [x] 3.1 Write `_sass/layout/_grid.scss`
    - Implement `.site-layout` CSS Grid: single column on mobile, sidebar+main on `≥ 1024px` using named grid areas
    - Set `grid-template-columns: var(--sidebar-width) 1fr` on desktop and `min-height: 100dvh`
    - Assign `grid-area` to `.site-header`, `.site-main`, `.site-footer`
    - _Requirements: 2.1, 2.3, 2.6, 3.1, 10.1_
  - [x] 3.2 Write `_sass/layout/_header.scss` and `_sass/layout/_footer.scss`
    - Sticky sidebar: `position: sticky; top: 0; height: 100dvh; overflow-y: auto` at `≥ 1024px`
    - Footer styles using design tokens; dynamic copyright year via `{{ site.time | date: '%Y' }}` in template
    - _Requirements: 2.5, 8.8, 10.6_

- [x] 4. Implement navigation component
  - [x] 4.1 Write `_includes/nav.html`
    - Author panel: avatar img with explicit `width="75" height="75"`, site name h2, bio paragraph, social links
    - Hamburger toggle button: three `<span>` bars, `aria-expanded="false"`, `aria-controls="primary-nav-list"`, `aria-label`
    - Nav list `<ul id="primary-nav-list" role="list">` with BEM classes; active link via `aria-current="page"` and `.site-nav__link--active`; external links get `rel="noopener noreferrer"`
    - SVG sprite `<use href="#icon-…">` for nav icons (reference sprite defined in step 7)
    - _Requirements: 2.2, 2.5, 7.4, 7.9, 8.2_
  - [x] 4.2 Write `_sass/components/_nav.scss`
    - Hide nav list on mobile by default (max-height 0 / hidden); expand via `.site-nav--open` with max-height transition ≤ 280ms
    - Show hamburger toggle only on `< 1024px`; hide it on desktop where list is always visible
    - `touch-target` mixin on toggle button and all nav links
    - Active link indicator (background-color change or left border)
    - _Requirements: 2.2, 2.10, 4.5, 8.1, 8.2, 8.7_


- [x] 5. Rewrite default layout and head include
  - [x] 5.1 Write `_includes/head.html`
    - `<meta charset>`, viewport, `{% seo %}`, inline FOTWT script before stylesheets (reads localStorage `theme`, falls back to `prefers-color-scheme`, sets `data-theme` on `<html>`)
    - Resource hints: `<link rel="preload">` for Inter variable font and author avatar; `<link rel="preconnect" rel="dns-prefetch">` for any third-party origins (Disqus, analytics)
    - Async CSS loading: `<style>{% include critical-css.html %}</style>` + `media="print"` swap for full stylesheet; `<noscript>` fallback
    - RSS auto-discovery `<link rel="alternate" type="application/rss+xml">` per Req 9.8
    - Remove all external CDN `<link>` and `<script>` tags (Bootstrap CDN, Google Fonts CDN, Font Awesome CDN, jQuery CDN, fancyBox CDN)
    - _Requirements: 1.7, 4.1, 4.2, 6.3, 6.10, 9.8_
  - [x] 5.2 Rewrite `_layouts/default.html`
    - `<html lang="{{ site.lang | default: 'en' }}" data-theme="light">` root
    - `{% include head.html %}` in `<head>`
    - Skip link as first focusable element: `<a class="skip-link" href="#main-content">Skip to main content</a>`
    - Theme toggle `<button class="theme-toggle" aria-pressed="false" aria-label="Toggle dark mode">` with SVG icon
    - `.site-layout` wrapper div containing `<header role="banner">`, `<main id="main-content" role="main">`, `<footer role="contentinfo">`
    - `{% include back-to-top.html %}` and `{% include scripts.html %}` before `</body>`
    - Dynamic footer copyright: `{{ site.time | date: '%Y' }}` replacing hardcoded "This Year"
    - Remove all ad scripts and ad container elements from footer
    - _Requirements: 7.3, 7.7, 10.5, 10.6, 12.3, 13.4_

- [x] 6. Implement dark mode theme system
  - [x] 6.1 Write `_js/theme.js` — ThemeManager module
    - `init()`: read localStorage `theme`, fall back to `prefers-color-scheme`, apply `data-theme` on `<html>`, set `aria-pressed` on toggle button, listen for system preference changes (only apply if no localStorage entry)
    - `toggle()`: flip current theme, persist to localStorage, call `apply()`
    - Wrap `localStorage` access in try/catch (private-browsing safety)
    - Export `toggle` for use in tests; wrap in IIFE for GitHub Pages (no bundler)
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.7, 4.8_
  - [x] 6.2 Write `_sass/themes/_dark.scss` and `_sass/components/_theme-toggle.scss`
    - `_dark.scss`: `[data-theme="dark"]` token overrides (mirrors `_tokens.scss` dark block)
    - `_theme-toggle.scss`: button ≥ 44×44px via `touch-target` mixin; CSS `transition: color 300ms, background-color 300ms`; SVG icon swaps via CSS custom properties
    - _Requirements: 4.1, 4.3, 4.5, 4.6_
  - [ ]* 6.3 Write property test for theme toggle round trip (Property 2)
    - **Property 2: Theme Toggle Is a Round Trip**
    - **Validates: Requirements 4.4**
    - File: `test/theme.test.js` — use fast-check `fc.constantFrom('light', 'dark')`, call `toggle()` twice, assert stored value equals initial value

- [x] 7. Build icon system (Font Awesome 6 self-hosted SVG sprites)
  - Download Font Awesome 6.x free SVG files for the icons referenced in `_config.yml` (`fa-home`, `fa-info`, `fa-book`, `fa-desktop`, `fa-building-o` → `fa-building`, `fa-smile-o` → `fa-face-smile`, `fa-github`, `fa-file-pdf-o` → `fa-file-pdf`, `fa-feed` → `fa-rss`, `fa-twitter`, `fa-linkedin`, `fa-instagram`, `fa-envelope`, `fa-bars`)
  - Place subset SVG files in `assets/vendors/fontawesome/`; create `_includes/icon-sprite.html` as an inline `<svg>` with all `<symbol>` definitions (hidden via `display: none`)
  - Include sprite as first element inside `<body>` in `default.html`
  - Update `_config.yml` icon names from FA4 slugs to FA6 slugs
  - _Requirements: 1.3, 1.7_

- [x] 8. Implement social links and share includes
  - [x] 8.1 Write `_includes/social-links.html` replacing `social_links.html`
    - `<ul role="list">` with BEM classes; each `<a>` uses `aria-label="<platform>"`, SVG sprite `<use>`, `touch-target` mixin
    - _Requirements: 7.4, 7.8_
  - [x] 8.2 Write `_includes/share.html` replacing `share-page.html`; write `_includes/newsletter.html` replacing `newsletter-page.html`
    - Semantic HTML; ARIA labels; no jQuery event handlers
    - _Requirements: 7.4_
  - [x] 8.3 Write `_includes/breadcrumbs.html`
    - `<nav aria-label="Breadcrumb">` with `<ol>` using Schema.org `BreadcrumbList` microdata; only rendered on post layout pages
    - _Requirements: 7.7, 8.3_
  - [x] 8.4 Write `_includes/back-to-top.html` and `_sass/components/_back-to-top.scss`
    - `<button class="back-to-top" hidden aria-label="Back to top">` with SVG arrow; hidden by default, shown via JS on scroll > 200px; `touch-target` mixin
    - _Requirements: 8.6_

- [x] 9. Implement JavaScript navigation and utility modules
  - [x] 9.1 Write `_js/nav.js` — NavManager module
    - `init()`: on mobile (< 1024px) set `list.hidden = true` by default; toggle button click handler sets `aria-expanded`, toggles `list.hidden`, adds `u-no-scroll` to body
    - Escape key listener: close nav, return focus to toggle
    - Click-outside listener: close nav when clicking outside `.site-nav`
    - _Requirements: 2.2, 7.4, 7.9, 8.1_
  - [x] 9.2 Write `_js/back-to-top.js` — BackToTop module
    - Passive scroll listener: show/hide button when `window.scrollY > 200`
    - Click handler: `window.scrollTo({ top: 0, behavior: 'smooth' })`
    - _Requirements: 8.6_
  - [x] 9.3 Write `_sass/utilities/_utilities.scss`
    - `.u-sr-only` (visually hidden), `.u-truncate` (text-overflow), `.u-no-scroll` (overflow hidden on body)
    - Each utility class applies exactly one CSS property; no `!important` outside this file
    - _Requirements: 3.6_

- [x] 10. Implement search functionality
  - [x] 10.1 Create `search-data.json.html` at project root (Jekyll generates search index)
    - Front matter: `layout: null`; output JSON array with `title`, `url`, `categories`, `tags`, `excerpt` (55-word strip) for every `site.posts` entry
    - _Requirements: 8.4, 9.3_
  - [x] 10.2 Write `_js/search.js` — Search module
    - `Search.init(inputSelector, resultsSelector, dataUrl)`: lazy-fetch search index on first keystroke; debounce input at 200ms
    - `filterPosts(posts, query)`: case-insensitive substring match on `title` and `excerpt`; return empty array (not null) when no match; display "No results found" message
    - `aria-live="polite"` on results container; `aria-label` on input
    - Wrap fetch in try/catch; on failure hide search UI gracefully
    - Export `filterPosts` for unit testing
    - _Requirements: 8.4_
  - [x] 10.3 Write `_includes/search.html` and `_sass/components/_search.scss`
    - `<input type="search" aria-label="Search posts" aria-controls="search-results">` + `<ul id="search-results" role="listbox" aria-label="Search results" aria-live="polite">`
    - BEM classes; token-based colors; no `!important`
    - _Requirements: 8.4, 3.7_
  - [ ]* 10.4 Write property test for search filter (Property 7)
    - **Property 7: Search Filter Returns Only Matching Results**
    - **Validates: Requirements 8.4**
    - File: `test/search.test.js` — use fast-check `fc.array(fc.record({…}))` + `fc.string({ minLength: 1 })`; assert every returned item contains query as substring; assert empty array returned when no match


- [x] 11. Implement gallery module (fancyBox replacement)
  - [x] 11.1 Write `_js/gallery.js` — GalleryManager module
    - `GalleryManager.init()`: find all `[data-gallery]` anchors, group by gallery ID, attach click listeners
    - `open(groupId, startIndex)`: create modal `<div role="dialog" aria-modal="true" aria-label>`, render image, prev/next buttons, thumbnail strip, close button; call `trapFocus(modal)`
    - `close()`: remove modal, return focus to triggering element
    - `next()` / `prev()`: cycle through group; loop-around on boundaries
    - Escape key closes modal; left/right arrow keys navigate
    - `data-gallery-type="iframe"` variant: render `<iframe>` at 95vw × 95vh for resume PDF
    - `trapFocus(modal)`: cycle Tab/Shift-Tab within focusable elements
    - Export `GalleryManager` for integration testing
    - _Requirements: 1.5, 1.6, 7.10_
  - [x] 11.2 Write `_sass/components/_gallery.scss`
    - Modal overlay: `position: fixed; inset: 0; z-index: 1000; background: rgba(0,0,0,0.85)`
    - Thumbnail strip: flex row with gap; each thumbnail ≥ 44×44px via `touch-target` mixin
    - BEM: `.gallery`, `.gallery__modal`, `.gallery__img`, `.gallery__nav`, `.gallery__thumbs`, `.gallery__close`
    - _Requirements: 1.5, 2.10, 7.10_

- [x] 12. Rewrite post and page layouts
  - [x] 12.1 Rewrite `_layouts/post.html`
    - Use `{% include breadcrumbs.html %}` at top of article
    - Reading time: Liquid `number_of_words` ÷ 200; display "Quick read" when `< 1`
    - Related posts: Liquid loop finding ≤ 3 posts sharing category or tag, excluding current post
    - Pagination: `<nav aria-label="Pagination">` with prev/next links labeled "← Previous" / "Next →"
    - All images: `loading="lazy" decoding="async"` with explicit `width` and `height`; cover image: responsive `srcset` at 480w, 768w, 1200w
    - `<article>` semantic wrapper; `{% include share.html %}`
    - _Requirements: 2.8, 6.1, 6.2, 7.7, 9.1, 9.3, 9.4, 9.5, 12.1, 12.4_
  - [x] 12.2 Rewrite `_layouts/page.html` and `_layouts/posts_by_category.html`
    - Generic page layout with `<main id="main-content">` and semantic sections
    - Category listing: post cards with 55-word excerpts, reading time, tags
    - Pagination controls in category archive
    - _Requirements: 7.7, 9.3, 9.5, 12.5_
  - [x] 12.3 Rewrite `_layouts/project.html`
    - CSS Grid card layout; gallery triggers using `data-gallery="{{ i.fancybox_class }}"` (re-uses existing `_data/projects.json` fields with no schema changes)
    - Resume link: `data-gallery-type="iframe" href="/assets/tunji_olu-taiwo_resume.pdf"`
    - _Requirements: 1.5, 1.6, 12.2, 12.6_

- [x] 13. Implement post card and project card components
  - [x] 13.1 Write `_sass/components/_post-card.scss`
    - `container-type: inline-size; container-name: post-card; contain: layout style`
    - `@container post-card (min-width: 400px)` flex layout with thumbnail
    - BEM: `.post-card`, `.post-card__title`, `.post-card__meta`, `.post-card__excerpt`, `.post-card--featured`
    - Border-radius 4–8px; shadow ≤ 8px blur, ≤ 0.15 alpha; token-based colors
    - _Requirements: 3.4, 3.5, 10.2, 10.3_
  - [x] 13.2 Write `_sass/components/_project-card.scss`
    - CSS Grid card grid; `container-type: inline-size; contain: layout style`
    - Thumbnail `loading="lazy"` image with explicit dimensions
    - BEM: `.project-card`, `.project-card__thumb`, `.project-card__title`, `.project-card__tags`
    - _Requirements: 3.4, 3.5, 6.1, 10.3_

- [x] 14. Implement tag and category system
  - [x] 14.1 Write `_sass/components/_tags.scss` and update `_includes/project_tags.html`
    - Tag label styles: border-radius 4px, token colors, hover transition ≤ 150ms
    - Active state indicator on selected filter tag
    - `touch-target` mixin on tag filter buttons
    - _Requirements: 8.5, 8.7_
  - [x] 14.2 Create tag page stubs for all tags used in existing posts (in `_tags/` directory) using `posts_by_category` layout
    - Verify `enableTags: true` in `_config.yml` is set
    - _Requirements: 9.2, 12.5_
  - [x] 14.3 Write `_sass/components/_pagination.scss` and `_sass/components/_breadcrumbs.scss`
    - Pagination: `<nav aria-label="Pagination">`; prev/next links with BEM classes; `touch-target` mixin
    - Breadcrumbs: BEM `.breadcrumbs`, `.breadcrumbs__list`, `.breadcrumbs__item`, `.breadcrumbs__link`, `.breadcrumbs__current`; Schema.org microdata attributes
    - _Requirements: 7.7, 8.3, 9.5_

- [x] 15. Implement remaining JS modules and wire everything together
  - [x] 15.1 Write `_js/main.js` — orchestrator module
    - `document.addEventListener('DOMContentLoaded', () => { ThemeManager.init(); NavManager.init(); BackToTop.init(); Search.init(…); GalleryManager.init(); })`
    - _Requirements: 1.6_
  - [x] 15.2 Write `_includes/scripts.html` and `_includes/critical-css.html`
    - `scripts.html`: `<script src="/assets/js/main.js" defer></script>` — single deferred bundle; no inline scripts except the FOTWT snippet already in head
    - `critical-css.html`: extract above-the-fold CSS (reset essentials, body bg/text, skip link, site-layout grid, sidebar author panel, post header) — must not exceed 14 KB uncompressed
    - Update `_config.yml`: add `style: compressed` under `sass` key for minified CSS output
    - _Requirements: 6.3, 6.4, 6.5_
  - [x] 15.3 Create Makefile at project root with `install`, `serve`, `build` targets
    - `build` target: `bundle exec jekyll build --strict_front_matter`; JS concatenation/minification step; propagate non-zero exit code
    - Update `README.md` with prerequisites, install, serve, and build commands
    - _Requirements: 14.1, 14.4, 14.5, 14.6_

- [x] 16. Checkpoint — Ensure the Jekyll build succeeds and core layout renders
  - Ensure all tests pass, ask the user if questions arise.
  - Run `bundle exec jekyll build --strict_front_matter` and verify zero errors
  - Verify `_site/` contains output pages for all 9 existing posts
  - Spot-check that no `<link>` or `<script>` references external CDN hostnames

- [x] 17. Set up test infrastructure and run property-based tests
  - [x] 17.1 Set up test framework: add `package.json` with `vitest` and `fast-check` devDependencies; configure `vitest.config.js` pointing at `test/` directory
    - _Requirements: (testing infrastructure)_
  - [ ]* 17.2 Write property test for reading time calculation (Property 10)
    - **Property 10: Reading Time Calculation Is Correct**
    - **Validates: Requirements 9.4**
    - File: `test/reading-time.test.js` — use fast-check `fc.nat({ max: 10000 })`; assert "Quick read" when `floor(w/200) < 1`; assert "`N` min read" otherwise
  - [ ]* 17.3 Write property test for related posts (Property 8)
    - **Property 8: Related Posts Are Relevant and Bounded**
    - **Validates: Requirements 9.1**
    - File: `test/related-posts.test.js` — generate arbitrary post arrays with categories/tags; assert result length ≤ 3; assert every result shares ≥ 1 category or tag; assert current post not in results
  - [ ]* 17.4 Write property test for excerpt length (Property 9)
    - **Property 9: Post Excerpts Are Bounded at 55 Words**
    - **Validates: Requirements 9.3**
    - File: `test/excerpt.test.js` — generate arbitrary strings; assert `truncatewords(input, 55)` produces output with word count ≤ 55

- [x] 18. Write HTML audit and color contrast tests
  - [x] 18.1 Write `test/html-audit.js` — post-build HTML structure assertions
    - Parse all `_site/**/*.html` with `node-html-parser` or `htmlparser2`
    - Assert no `<link href>` or `<script src>` references external CDN hostnames (Property 1 — Req 1.7)
    - Assert every `<script src>` has `defer` or `async` (Property 4 — Req 6.4)
    - Assert first focusable element on each page is `.skip-link[href="#main-content"]` (Property 5 — Req 7.3)
    - Assert each page contains `<nav>`, `<main>`, `<footer>` (Property 6 — Req 7.7)
    - Assert `_site/blog/<slug>/index.html` exists for all 9 posts (Property 11 — Req 12.3)
    - Assert `_includes/critical-css.html` byte length ≤ 14336 (Req 6.3)
    - Assert footer copyright year equals current year (Req 10.6)
    - _Requirements: 1.7, 6.3, 6.4, 7.3, 7.7, 10.6, 12.3_
  - [ ]* 18.2 Write `test/contrast.test.js` — color contrast property test (Property 3)
    - **Property 3: Color Contrast Meets WCAG AA in Both Themes**
    - **Validates: Requirements 4.6, 7.5, 7.6**
    - Parse `_sass/abstracts/_tokens.scss` for `--color-*` values; compute WCAG relative luminance for all text/background pairs in both light and dark themes; assert ≥ 4.5:1 for normal text, ≥ 3:1 for large text

- [x] 19. Performance and accessibility final pass
  - [x] 19.1 Add responsive `srcset` and `loading="lazy"` to all post cover images and project thumbnails
    - Provide 480w, 768w, 1200w variants for post cover images in `assets/img/`
    - Add explicit `width` and `height` on all `<img>` elements to prevent CLS
    - Preload above-the-fold author avatar in `_includes/head.html`
    - _Requirements: 2.8, 6.1, 6.2, 6.8_
  - [x] 19.2 Verify `contain: layout style` on `.post-card` and `.project-card`; add `will-change` only to `.theme-toggle` and `.site-nav__list` (elements with active CSS transitions)
    - Remove any remaining `!important` declarations from component and layout partials; confirm only `_utilities.scss` contains them
    - Remove all ad scripts and ad container `<ins>` elements from all layouts
    - _Requirements: 3.4, 3.6, 10.5_
  - [x] 19.3 Validate generated HTML: run `html-validate` or W3C Nu Checker against `_site/index.html` and a sample post page; fix any errors
    - Confirm Open Graph and Twitter Card meta tags present on every page (via `jekyll-seo-tag` + existing `_config.yml` twitter config)
    - _Requirements: 9.6, 9.7, 9.8, 11.6_

- [ ] 20. Final checkpoint — Full build, tests, and smoke checks pass
  - Ensure all tests pass, ask the user if questions arise.
  - Run `bundle exec jekyll build --strict_front_matter` — zero errors
  - Run `npx vitest --run` — all property and unit tests pass
  - Run `node test/html-audit.js` — all assertions pass
  - Verify `_site/` output: 9 post pages + category archives + projects page + about page
  - Confirm `CNAME` and `.well-known/` are present in `_site/`
  - Update `STYLE_GUIDE.md` with final token values and component inventory


## Notes

- Tasks marked with `*` are optional property-based test tasks that can be skipped for faster MVP
- Each task references specific requirements for traceability via the `_Requirements: X.Y_` line
- Two checkpoint tasks (16 and 20) ensure incremental validation at reasonable breaks
- Property tests are grouped with their parent implementation tasks for early validation
- The design contains 11 correctness properties; 6 are tested via property-based tests (Properties 2, 3, 7, 8, 9, 10), and 5 are tested via example-based HTML audit (Properties 1, 4, 5, 6, 11)
- All tasks build on previous tasks with no orphaned code; the wiring happens in task 15 after all modules are implemented
- GitHub Pages compatibility is maintained by using only `@import` (no Dart Sass `@use`/`@forward`), avoiding unsupported plugins, and staying within Jekyll 3.8.x constraints
- No JavaScript build tool is needed; concatenation and minification happen via Makefile + simple Ruby/shell script in the `build` target
- All content files (`_posts/`, `_data/`, `_config.yml`) are preserved with zero modifications; only layouts, includes, Sass, and JS are rewritten
- Bootstrap 3 and jQuery are completely eliminated; Bootstrap 5 is NOT used (the design uses custom CSS Grid + Flexbox instead of any Bootstrap version)
- Font Awesome 4 is replaced by Font Awesome 6 self-hosted SVG sprites (no CDN, no web fonts)

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "7.1"] },
    { "id": 1, "tasks": ["2.1", "3.1"] },
    { "id": 2, "tasks": ["3.2", "4.1", "8.1", "13.1", "13.2"] },
    { "id": 3, "tasks": ["4.2", "5.1", "6.1", "8.2", "8.3", "8.4", "9.3", "10.1", "14.1"] },
    { "id": 4, "tasks": ["5.2", "6.2", "6.3", "9.1", "9.2", "10.2", "11.1", "14.2"] },
    { "id": 5, "tasks": ["10.3", "10.4", "11.2", "12.1", "14.3"] },
    { "id": 6, "tasks": ["12.2", "12.3", "15.1"] },
    { "id": 7, "tasks": ["15.2", "15.3"] },
    { "id": 8, "tasks": ["17.1"] },
    { "id": 9, "tasks": ["17.2", "17.3", "17.4", "18.1", "18.2"] },
    { "id": 10, "tasks": ["19.1", "19.2", "19.3"] }
  ]
}
```
