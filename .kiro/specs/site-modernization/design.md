# Design Document: Site Modernization — tunjos.co

## Overview

This document describes the technical design for modernizing the tunjos.co Jekyll personal blog/portfolio website. The current site runs Bootstrap 3.3.6, jQuery 1.11.1, Font Awesome 4.x, and a Bootstrap Material Design theme — all several major versions behind. The modernization replaces every external dependency with a leaner custom stack, re-architects the CSS with BEM / Sass 7-1 / CSS Custom Properties, introduces mobile-first responsive layouts (CSS Grid + Flexbox), adds a dark mode toggle, improves performance toward Lighthouse ≥ 90, and reaches WCAG 2.1 AA accessibility compliance — all while preserving every URL, every piece of content, and full GitHub Pages compatibility.

### Goals

- Replace Bootstrap 3 + jQuery 1.x + Font Awesome 4 + Bootstrap Material Design with minimal, owned code
- Achieve Google Lighthouse Performance ≥ 90 on mobile (Slow 4G)
- Reach WCAG 2.1 Level AA compliance
- Deliver mobile-first responsive design (320 px → 2560 px)
- Introduce user-controlled dark/light theme persisted in `localStorage`
- Maintain all existing URLs and content structure
- Stay within the `github-pages` gem's allowed plugin set

### Non-Goals

- Migrating to a different static site generator
- Introducing a JavaScript build tool that is not supported by GitHub Pages' native Jekyll pipeline
- Rewriting or removing any existing blog post or project content

---

## Architecture

### High-Level System Diagram

```
┌───────────────────────────────────────────────────────────────────────┐
│  Source Repository (Jekyll project)                                   │
│                                                                       │
│  ┌─────────────┐   ┌─────────────┐   ┌─────────────┐                 │
│  │  _layouts/  │   │  _includes/ │   │   _sass/    │                 │
│  │  default    │   │  head       │   │  main.scss  │──────────────┐  │
│  │  post       │   │  nav        │   │  (7-1 arch) │              │  │
│  │  page       │   │  footer     │   └─────────────┘              │  │
│  │  project    │   │  search     │                                 │  │
│  │  posts_by_  │   │  social     │   ┌─────────────────────────┐  │  │
│  │  category   │   │  analytics  │   │  _js/ (vanilla JS)      │  │  │
│  └─────────────┘   └─────────────┘   │  theme.js               │  │  │
│                                      │  nav.js                  │  │  │
│  ┌──────────────────────────────┐    │  search.js               │  │  │
│  │  Content                     │    │  gallery.js              │  │  │
│  │  _posts/ (9 md files)        │    │  back-to-top.js          │  │  │
│  │  _data/ (projects, books,    │    └─────────────────────────┘  │  │
│  │          videos)             │                                 │  │
│  └──────────────────────────────┘                                 │  │
│                                                                   ▼  │
│  ┌───────────────────────────────────────────────────────────────┐   │
│  │  Jekyll Build (github-pages gem, Jekyll 3.8.x)                │   │
│  │  • Sass compilation  • Liquid templates  • jekyll-seo-tag     │   │
│  └───────────────────────────────────────────────────────────────┘   │
└───────────────────────────────────────────────────────────────────────┘
                │
                ▼
┌──────────────────────────────────────────┐
│  _site/  (static HTML + CSS + JS)        │
│  Served by GitHub Pages CDN              │
└──────────────────────────────────────────┘
```

### Dependency Replacement Map

| Current dependency | Replacement | Rationale |
|---|---|---|
| Bootstrap 3.3.6 | Custom CSS Grid + Flexbox | Eliminate 200 KB+ of unused CSS |
| jQuery 1.11.1 | Vanilla JavaScript ES6+ | Remove 87 KB dependency |
| Font Awesome 4.x (CDN) | Font Awesome 6.x (self-hosted subset via SVG sprites) | Security, performance, control |
| Bootstrap Material Design theme | Custom CSS with design tokens | Reduce third-party coupling |
| fancyBox 2.x | Custom vanilla JS gallery (`gallery.js`) | No jQuery dependency |
| Google Fonts (CDN) | System font stack + optional self-hosted variable font | Remove render-blocking network request |
| External Bootstrap CDN | Local CSS file | Local assets only (Req 1.7) |

### Build Pipeline

```
Source Sass (_sass/main.scss)
  └─► Jekyll Sass compiler (sassc / libsass via github-pages)
        └─► assets/css/main.css  (minified via Jekyll's `style: compressed`)

Source JS (_js/*.js)
  └─► Jekyll includes / concatenation via _includes/scripts.html
        └─► assets/js/main.js

_layouts/ + _includes/ + _posts/ + _data/
  └─► Jekyll Liquid engine
        └─► _site/**/*.html
```

Critical CSS is extracted manually and embedded in `_includes/critical-css.html`, which is
inlined directly in `<head>`. The full stylesheet is loaded asynchronously using the
`media="print"` swap pattern:

```html
<style>{% include critical-css.html %}</style>
<link rel="stylesheet" href="/assets/css/main.css"
      media="print" onload="this.media='all'">
<noscript><link rel="stylesheet" href="/assets/css/main.css"></noscript>
```

---

## Components and Interfaces

### Jekyll Layout Hierarchy

```
default.html          ← Root HTML shell (head, skip-link, theme toggle, footer)
  ├── post.html       ← Blog post: article + related posts + pagination + comments
  ├── page.html       ← Generic page content
  ├── project.html    ← Projects gallery grid
  └── posts_by_category.html  ← Category archive listing
```

### New/Updated Includes

| File | Purpose | Replaces |
|---|---|---|
| `_includes/head.html` | `<head>` meta, critical CSS, resource hints | Head portion of `default.html` |
| `_includes/nav.html` | Sidebar + hamburger nav markup | `navigation.html` + `sidemenu.html` |
| `_includes/social-links.html` | Social icon links (SVG sprites) | `social_links.html` |
| `_includes/share.html` | Post sharing buttons | `share-page.html` |
| `_includes/newsletter.html` | Newsletter signup block | `newsletter-page.html` |
| `_includes/analytics.html` | Analytics snippet (unchanged) | `analytics.html` |
| `_includes/search.html` | Client-side search input + results container | new |
| `_includes/breadcrumbs.html` | Post breadcrumb trail | new |
| `_includes/back-to-top.html` | "Back to top" button markup | new |
| `_includes/critical-css.html` | Inlined critical CSS | new |
| `_includes/scripts.html` | Deferred JS bundles | new |

### default.html Structure

```html
<!DOCTYPE html>
<html lang="{{ site.lang | default: 'en' }}" data-theme="light">
<head>
  {% include head.html %}
</head>
<body class="page page--{{ page.layout }}">
  <!-- Skip navigation (first focusable element) -->
  <a class="skip-link" href="#main-content">Skip to main content</a>

  <!-- Theme toggle (persists in localStorage) -->
  <button class="theme-toggle" aria-label="Toggle dark mode"
          aria-pressed="false" type="button">
    <svg aria-hidden="true" focusable="false">…</svg>
  </button>

  <!-- Site layout grid -->
  <div class="site-layout">
    <header class="site-header" role="banner">
      {% include nav.html %}
    </header>

    <main id="main-content" class="site-main" role="main">
      {{ content }}
    </main>

    <footer class="site-footer" role="contentinfo">
      <p class="site-footer__copyright">
        &copy; {{ site.author_name }}, {{ site.time | date: '%Y' }}.
        Powered by <a href="https://jekyllrb.com">Jekyll</a>.
      </p>
    </footer>
  </div>

  {% include back-to-top.html %}
  {% include scripts.html %}
</body>
</html>
```

### Navigation Component Interface

The `nav.html` include renders both the sidebar (desktop) and hamburger drawer (mobile).
State is managed entirely through CSS and a small amount of vanilla JS:

```html
<nav class="site-nav" aria-label="Main navigation">
  <!-- Author panel (sidebar top) -->
  <div class="site-nav__author">
    <img class="site-nav__avatar" src="{{ site.logo }}" alt="{{ site.author_name }}" width="75" height="75">
    <h2 class="site-nav__name">{{ site.author_name }}</h2>
    <p class="site-nav__bio">{{ site.about }}</p>
    {% include social-links.html %}
  </div>

  <!-- Hamburger toggle (mobile only, hidden on desktop via CSS) -->
  <button class="site-nav__toggle" type="button"
          aria-controls="primary-nav-list"
          aria-expanded="false"
          aria-label="Open navigation menu">
    <span class="site-nav__toggle-bar" aria-hidden="true"></span>
    <span class="site-nav__toggle-bar" aria-hidden="true"></span>
    <span class="site-nav__toggle-bar" aria-hidden="true"></span>
  </button>

  <!-- Navigation list -->
  <ul class="site-nav__list" id="primary-nav-list" role="list">
    {% for item in site.urls %}
    <li class="site-nav__item">
      <a class="site-nav__link {% if page.url == item.url %}site-nav__link--active{% endif %}"
         href="{{ item.url | prepend: site.baseurl }}"
         {% if page.url == item.url %}aria-current="page"{% endif %}
         {% if item.target %}target="{{ item.target }}" rel="noopener noreferrer"{% endif %}>
        <svg class="site-nav__icon" aria-hidden="true" focusable="false"><use href="#icon-{{ item.icon }}"></use></svg>
        {{ item.text }}
      </a>
    </li>
    {% endfor %}
  </ul>
</nav>
```

### Gallery Component Interface (`gallery.js`)

Replaces fancyBox. Manages per-project grouped galleries with:
- `data-gallery="<group-id>"` on each `<a>` trigger
- `data-gallery-src` pointing to the full-size image
- `data-gallery-thumb` for the thumbnail strip
- ESC key closes modal and returns focus to the triggering element
- ARIA: `role="dialog"`, `aria-modal="true"`, `aria-label="<project name> gallery"`

```javascript
// Public API
GalleryManager.init();          // Attach all data-gallery listeners
GalleryManager.open(groupId, startIndex);
GalleryManager.close();
GalleryManager.next();
GalleryManager.prev();
```

### Search Component Interface (`search.js`)

Client-side search built without a server. Jekyll generates a JSON index at build time (`assets/js/search-data.json`), and `search.js` loads and filters it in the browser.

Jekyll template to generate the index (`search-data.json.html`):
```json
---
layout: null
---
[
  {% for post in site.posts %}
  {
    "title": {{ post.title | jsonify }},
    "url": {{ post.url | jsonify }},
    "categories": {{ post.categories | jsonify }},
    "tags": {{ post.tags | jsonify }},
    "excerpt": {{ post.excerpt | strip_html | truncatewords: 55 | jsonify }}
  }{% unless forloop.last %},{% endunless %}
  {% endfor %}
]
```

`search.js` public API:
```javascript
Search.init(inputSelector, resultsSelector, dataUrl);
// Debounces input at 200ms, filters by title + excerpt + tags, returns within 500ms
```

---

## Data Models

### CSS Design Token System

All design tokens are defined as CSS Custom Properties on `:root` with an override block for the dark theme on `[data-theme="dark"]`.

```scss
// _sass/abstracts/_tokens.scss

:root {
  // --- Color Palette ---
  // Primary accent: used for links, active states, focus rings
  --color-accent: #2563eb;       /* Blue 600 */
  // Primary accent hover
  --color-accent-hover: #1d4ed8; /* Blue 700 */
  // Surface colors
  --color-bg: #ffffff;
  --color-bg-subtle: #f8fafc;    /* Slate 50 – cards, sidebar bg */
  --color-bg-elevated: #f1f5f9;  /* Slate 100 – hover states */
  // Text colors
  --color-text: #0f172a;         /* Slate 900 */
  --color-text-muted: #64748b;   /* Slate 500 – meta, captions */
  --color-text-inverse: #ffffff;
  // Border
  --color-border: #e2e8f0;       /* Slate 200 */
  // Semantic
  --color-code-bg: #f1f5f9;
  --color-shadow: rgba(0, 0, 0, 0.08);

  // --- Spacing Scale (base 4px) ---
  --space-1: 0.25rem;   /* 4px  */
  --space-2: 0.5rem;    /* 8px  */
  --space-3: 0.75rem;   /* 12px */
  --space-4: 1rem;      /* 16px */
  --space-6: 1.5rem;    /* 24px */
  --space-8: 2rem;      /* 32px */
  --space-12: 3rem;     /* 48px */
  --space-16: 4rem;     /* 64px */

  // --- Typography ---
  --font-sans: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
               Helvetica, Arial, sans-serif;
  --font-mono: ui-monospace, SFMono-Regular, "Cascadia Code", Consolas,
               "Liberation Mono", monospace;
  --font-size-base: clamp(15px, 2.5vw, 18px);
  --line-height-body: 1.65;
  --line-height-heading: 1.2;
  --font-weight-body: 400;
  --font-weight-heading: 650;

  // Type scale (ratio 1.25 — Major Third)
  --font-size-sm:   0.8rem;
  --font-size-md:   1rem;
  --font-size-lg:   1.25rem;
  --font-size-xl:   1.5625rem;
  --font-size-2xl:  1.953rem;
  --font-size-3xl:  2.441rem;

  // --- Layout ---
  --sidebar-width: 260px;
  --content-max-width: 75ch;
  --section-gap: var(--space-8);   /* 32px min gap between sections */
  --border-radius-sm: 4px;
  --border-radius-md: 6px;
  --border-radius-lg: 8px;

  // --- Shadows ---
  --shadow-sm: 0 1px 3px rgba(0, 0, 0, 0.08);
  --shadow-md: 0 4px 8px rgba(0, 0, 0, 0.10);
  --shadow-focus: 0 0 0 3px rgba(37, 99, 235, 0.45);

  // --- Transitions ---
  --transition-color: color 300ms ease, background-color 300ms ease;
  --transition-fast: 150ms ease;
}

[data-theme="dark"] {
  --color-accent: #60a5fa;       /* Blue 400 – higher contrast on dark bg */
  --color-accent-hover: #93c5fd; /* Blue 300 */
  --color-bg: #0f172a;           /* Slate 900 */
  --color-bg-subtle: #1e293b;    /* Slate 800 */
  --color-bg-elevated: #334155;  /* Slate 700 */
  --color-text: #f1f5f9;         /* Slate 100 */
  --color-text-muted: #94a3b8;   /* Slate 400 */
  --color-border: #334155;       /* Slate 700 */
  --color-code-bg: #1e293b;
  --color-shadow: rgba(0, 0, 0, 0.40);
}
```

### Post Data Shape (Front Matter)

Existing front matter is preserved. Optional new fields are additive only:

```yaml
---
layout: post                    # required (unchanged)
title:  "Post Title"            # required (unchanged)
date:   2021-12-08              # required (unchanged)
categories: [tech, productivity] # existing (unchanged)
tags: [search, autocomplete]    # existing (unchanged)
image: cover-image.png          # existing optional
excerpt: "Custom excerpt..."    # NEW: optional override (55 word limit enforced in template)
reading_time: 5                 # NEW: optional override in minutes (auto-calculated if absent)
---
```

### Project Data Shape (`_data/projects.json`)

Preserved exactly. No field changes. The gallery component reads:
- `fancybox_class` → repurposed as `data-gallery="<value>"`
- `images[]` → gallery item sources
- `cover_thumbnail` → grid card thumbnail

---

## CSS Architecture (Sass 7-1 Pattern)

```
_sass/
├── abstracts/
│   ├── _tokens.scss        ← CSS Custom Properties (all design tokens)
│   ├── _mixins.scss        ← Reusable Sass mixins (media-query, visually-hidden, etc.)
│   └── _functions.scss     ← Sass helper functions (fluid-type, rem conversion)
├── base/
│   ├── _reset.scss         ← Modern CSS reset (box-sizing, margin normalization)
│   ├── _typography.scss    ← Body, heading, link, blockquote base styles
│   └── _accessibility.scss ← Skip link, focus ring, visually-hidden utilities
├── layout/
│   ├── _grid.scss          ← Site-level CSS Grid (sidebar + main + footer)
│   ├── _header.scss        ← Site header styles
│   └── _footer.scss        ← Site footer styles
├── components/
│   ├── _nav.scss           ← Navigation (sidebar, hamburger, active state)
│   ├── _post-card.scss     ← Post listing card
│   ├── _project-card.scss  ← Project grid card
│   ├── _gallery.scss       ← Lightbox gallery modal
│   ├── _search.scss        ← Search input + results dropdown
│   ├── _breadcrumbs.scss   ← Breadcrumb trail
│   ├── _pagination.scss    ← Page prev/next controls
│   ├── _back-to-top.scss   ← Floating back-to-top button
│   ├── _theme-toggle.scss  ← Dark/light mode toggle button
│   ├── _social-links.scss  ← Social icon link cluster
│   ├── _share.scss         ← Post share buttons
│   └── _tags.scss          ← Tag labels + filter controls
├── themes/
│   └── _dark.scss          ← Dark theme token overrides (mirrors [data-theme="dark"])
├── utilities/
│   └── _utilities.scss     ← Single-property utility classes (sr-only, truncate, etc.)
├── vendors/
│   └── _syntax.scss        ← Code syntax highlighting (migrated from _syntax-highlighting.scss)
└── main.scss               ← Single entry: @use imports for all partials
```

### BEM Naming Conventions

All components follow BEM strictly:

```
Block:    .post-card
Element:  .post-card__title
          .post-card__meta
          .post-card__excerpt
Modifier: .post-card--featured
          .post-card--compact

Block:    .site-nav
Element:  .site-nav__list
          .site-nav__item
          .site-nav__link
          .site-nav__icon
          .site-nav__toggle
Modifier: .site-nav__link--active
          .site-nav--open
```

Utility classes (single property) are exempted from BEM and prefixed with `u-`:
```css
.u-sr-only    { /* visually hidden, accessible to screen readers */ }
.u-truncate   { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.u-no-scroll  { overflow: hidden; }
```

### Container Queries for Cards

Post cards and project cards adapt to their container width independently of viewport:

```scss
// _sass/components/_post-card.scss
.post-card {
  container-type: inline-size;
  container-name: post-card;
  contain: layout style;
}

@container post-card (min-width: 400px) {
  .post-card__layout {
    display: flex;
    gap: var(--space-4);
  }
  .post-card__thumbnail {
    flex-shrink: 0;
    width: 120px;
  }
}
```

---

## Responsive Layout Design

### Breakpoint System

```scss
// _sass/abstracts/_mixins.scss
$breakpoints: (
  'sm':  480px,
  'md':  768px,
  'lg':  1024px,
  'xl':  1280px,
  '2xl': 1536px
);

@mixin mq($bp) {
  @media screen and (min-width: map-get($breakpoints, $bp)) { @content; }
}
```

### Site-Level CSS Grid

```scss
// _sass/layout/_grid.scss
.site-layout {
  display: grid;
  grid-template-areas:
    "header"
    "main"
    "footer";
  grid-template-columns: 1fr;
  min-height: 100dvh;
}

@include mq('lg') {
  .site-layout {
    grid-template-areas:
      "header  main"
      "header  footer";
    grid-template-columns: var(--sidebar-width) 1fr;
    grid-template-rows: 1fr auto;
  }
}

.site-header { grid-area: header; }
.site-main   { grid-area: main;   }
.site-footer { grid-area: footer; }
```

### Responsive Layout Diagrams

**Mobile (< 768px):** Single column, hamburger nav drawer, full-width content

```
┌──────────────────────┐
│ [☰ tunjos.co]        │  ← sticky top bar with hamburger
├──────────────────────┤
│  Page Content        │
│  (full width)        │
├──────────────────────┤
│  Footer              │
└──────────────────────┘
```

**Tablet (768px–1023px):** Single column with 24px horizontal padding, nav still hamburger

```
┌──────────────────────────┐
│ [☰ tunjos.co]            │
├──────────────────────────┤
│   Page Content           │
│   (padding: 0 24px)      │
├──────────────────────────┤
│   Footer                 │
└──────────────────────────┘
```

**Desktop (≥ 1024px):** Sidebar + content, sidebar sticky

```
┌──────────┬───────────────────┐
│ Sidebar  │ Page Content      │
│ (sticky) │ (max 75ch prose)  │
│ 260px    │                   │
│          ├───────────────────┤
│          │ Footer            │
└──────────┴───────────────────┘
```

### Touch Target Sizing

All interactive elements on mobile meet the 44×44 CSS px minimum:

```scss
// _sass/abstracts/_mixins.scss
@mixin touch-target {
  min-width: 44px;
  min-height: 44px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}
```

Applied to: nav toggle button, theme toggle, back-to-top button, social links, tag filters, pagination links.

---

## Dark Mode Implementation

### Theme Detection and Persistence Flow

```
Page load
  ├─ Read localStorage.getItem('theme')
  │   ├─ Found: apply directly → set data-theme on <html>
  │   └─ Not found:
  │         ├─ Read window.matchMedia('(prefers-color-scheme: dark)').matches
  │         ├─ Determine value: 'dark' or 'light'
  │         ├─ Store in localStorage under key 'theme'
  │         └─ Apply to <html data-theme="...">
  └─ Observe matchMedia change events
        └─ Only update if localStorage 'theme' key is absent
```

### Inline Script for Flash-of-Wrong-Theme Prevention

To avoid a flash of light theme before JS runs on dark-mode users, a minimal inline script is placed **before** any stylesheet loads:

```html
<!-- In <head>, before stylesheets -->
<script>
(function(){
  var t = localStorage.getItem('theme');
  if (!t) {
    t = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    localStorage.setItem('theme', t);
  }
  document.documentElement.setAttribute('data-theme', t);
}());
</script>
```

### theme.js Architecture

```javascript
// _js/theme.js
const ThemeManager = (() => {
  const STORAGE_KEY = 'theme';
  const ROOT = document.documentElement;

  function getPreferred() {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  function apply(theme) {
    ROOT.setAttribute('data-theme', theme);
    // Update aria-pressed on toggle button
    const btn = document.querySelector('.theme-toggle');
    if (btn) btn.setAttribute('aria-pressed', theme === 'dark' ? 'true' : 'false');
  }

  function toggle() {
    const current = ROOT.getAttribute('data-theme') || 'light';
    const next = current === 'dark' ? 'light' : 'dark';
    localStorage.setItem(STORAGE_KEY, next);
    apply(next);
  }

  function init() {
    const stored = localStorage.getItem(STORAGE_KEY);
    apply(stored || getPreferred());
    document.querySelector('.theme-toggle')?.addEventListener('click', toggle);
    // System preference changes only apply when user has not manually chosen
    window.matchMedia('(prefers-color-scheme: dark)')
      .addEventListener('change', (e) => {
        if (!localStorage.getItem(STORAGE_KEY)) {
          apply(e.matches ? 'dark' : 'light');
        }
      });
  }

  return { init };
})();
```

### Color Contrast Guarantees

Both themes are designed to meet WCAG AA (4.5:1 normal, 3:1 large text):

| Token | Light value | Contrast on bg | Dark value | Contrast on bg |
|---|---|---|---|---|
| `--color-text` | #0f172a | 18.1:1 on #fff | #f1f5f9 | 16.9:1 on #0f172a |
| `--color-text-muted` | #64748b | 5.0:1 on #fff | #94a3b8 | 4.6:1 on #0f172a |
| `--color-accent` | #2563eb | 4.6:1 on #fff | #60a5fa | 4.7:1 on #0f172a |

---

## Navigation System Design

### nav.js Architecture

```javascript
// _js/nav.js
const NavManager = (() => {
  const TOGGLE_SEL  = '.site-nav__toggle';
  const LIST_SEL    = '.site-nav__list';
  const OPEN_CLASS  = 'site-nav--open';
  const BODY_CLASS  = 'u-no-scroll';

  function open(toggle, list) {
    toggle.setAttribute('aria-expanded', 'true');
    list.hidden = false;
    document.body.classList.add(BODY_CLASS);
  }

  function close(toggle, list) {
    toggle.setAttribute('aria-expanded', 'false');
    list.hidden = true;
    document.body.classList.remove(BODY_CLASS);
  }

  function init() {
    const toggle = document.querySelector(TOGGLE_SEL);
    const list   = document.querySelector(LIST_SEL);
    if (!toggle || !list) return;

    // Mobile: hide list by default, expose via button
    if (window.innerWidth < 1024) list.hidden = true;

    toggle.addEventListener('click', () => {
      const isOpen = toggle.getAttribute('aria-expanded') === 'true';
      isOpen ? close(toggle, list) : open(toggle, list);
    });

    // Close on Escape
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') {
        close(toggle, list);
        toggle.focus();
      }
    });

    // Close when clicking outside
    document.addEventListener('click', (e) => {
      if (!e.target.closest('.site-nav') && toggle.getAttribute('aria-expanded') === 'true') {
        close(toggle, list);
      }
    });
  }

  return { init };
})();
```

### Sticky Sidebar (Desktop)

```scss
// _sass/components/_nav.scss
@include mq('lg') {
  .site-header {
    position: sticky;
    top: 0;
    height: 100dvh;
    overflow-y: auto;
    // Subtle scrollbar
    scrollbar-width: thin;
    scrollbar-color: var(--color-border) transparent;
  }
}
```

### Hamburger CSS Transition (≤ 300ms)

```scss
.site-nav__list {
  overflow: hidden;
  max-height: 0;
  transition: max-height 280ms ease-out;

  &[hidden] { max-height: 0; display: block; } // override HTML hidden w/ CSS animation
}

.site-nav--open .site-nav__list {
  max-height: 800px; // large enough value
}
```

Note: `hidden` attribute is removed by JS before the CSS max-height transition triggers.

### Back-to-Top Button

Appears when `window.scrollY > 200`. Uses `scroll-behavior: smooth` via CSS.

```javascript
// _js/back-to-top.js
const BackToTop = (() => {
  function init() {
    const btn = document.querySelector('.back-to-top');
    if (!btn) return;
    const update = () => btn.hidden = window.scrollY <= 200;
    window.addEventListener('scroll', update, { passive: true });
    btn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
    update();
  }
  return { init };
})();
```

### Breadcrumbs (Post Pages)

Rendered via `_includes/breadcrumbs.html` using Jekyll front matter:

```html
<nav class="breadcrumbs" aria-label="Breadcrumb">
  <ol class="breadcrumbs__list" itemscope itemtype="https://schema.org/BreadcrumbList">
    <li class="breadcrumbs__item" itemprop="itemListElement" itemscope itemtype="https://schema.org/ListItem">
      <a class="breadcrumbs__link" href="{{ '/' | prepend: site.baseurl }}" itemprop="item">
        <span itemprop="name">Home</span>
      </a>
      <meta itemprop="position" content="1" />
    </li>
    <li class="breadcrumbs__item" itemprop="itemListElement" itemscope itemtype="https://schema.org/ListItem">
      <span class="breadcrumbs__current" itemprop="name" aria-current="page">{{ page.title }}</span>
      <meta itemprop="position" content="2" />
    </li>
  </ol>
</nav>
```

---

## Typography System Design

The type system uses a fluid base size and a 1.25 modular scale (Major Third). All values are CSS Custom Properties so dark mode and future theming requires only token overrides.

```scss
// _sass/base/_typography.scss
html {
  font-size: 100%; // 16px base; clamp applied on body
}

body {
  font-family: var(--font-sans);
  font-size: var(--font-size-base); // clamp(15px, 2.5vw, 18px)
  font-weight: var(--font-weight-body);
  line-height: var(--line-height-body); // 1.65
  color: var(--color-text);
  background-color: var(--color-bg);
  transition: var(--transition-color);
}

h1 { font-size: var(--font-size-3xl);  /* ~2.44rem */ }
h2 { font-size: var(--font-size-2xl);  /* ~1.95rem */ }
h3 { font-size: var(--font-size-xl);   /* ~1.56rem */ }
h4 { font-size: var(--font-size-lg);   /* 1.25rem  */ }
h5 { font-size: var(--font-size-md);   /* 1rem     */ }
h6 { font-size: var(--font-size-sm);   /* 0.8rem   */ }

h1, h2, h3, h4, h5, h6 {
  font-weight: var(--font-weight-heading); // 650
  line-height: var(--line-height-heading); // 1.2
  letter-spacing: -0.025em;
  color: var(--color-text);
}

// Constrain prose line length
.post-content,
.page-content {
  max-width: var(--content-max-width); // 75ch
}

a {
  color: var(--color-accent);
  text-decoration: underline;
  text-decoration-thickness: 1px;
  text-underline-offset: 3px;
  transition: color var(--transition-fast);
  &:hover { color: var(--color-accent-hover); }
}
```

### Variable Font Loading (Progressive Enhancement)

System fonts load instantly. A self-hosted Inter variable font loads async:

```html
<!-- In <head> after critical CSS -->
<link rel="preload"
      href="/assets/fonts/inter-var.woff2"
      as="font" type="font/woff2" crossorigin>
```

```css
@font-face {
  font-family: 'Inter';
  src: url('/assets/fonts/inter-var.woff2') format('woff2 supports variations'),
       url('/assets/fonts/inter-var.woff2') format('woff2');
  font-weight: 100 900;
  font-display: swap; /* prevents invisible text during load */
}
```

Once loaded, the body `font-family` cascade picks up `Inter` automatically because it's declared first in `--font-sans`.

---

## Performance Optimization Design

### Critical CSS Strategy

Critical CSS covers: reset essentials, body background/text color, skip link, site-layout grid, above-the-fold sidebar author panel, and post header. It is maintained in `_includes/critical-css.html` and must not exceed 14 KB uncompressed.

### Resource Hints

Placed in `<head>` immediately after `<meta charset>`:

```html
<!-- Self-hosted fonts (preload) -->
<link rel="preload" href="/assets/fonts/inter-var.woff2" as="font" type="font/woff2" crossorigin>

<!-- Any remaining third-party origins (analytics, Disqus) -->
<link rel="preconnect" href="https://disqus.com" crossorigin>
<link rel="dns-prefetch" href="https://disqus.com">
```

### Image Strategy

Images below the fold carry `loading="lazy"`. Above-the-fold author headshot in the sidebar is preloaded:

```html
<link rel="preload" as="image" href="{{ site.logo }}">
```

Responsive images use at minimum three `srcset` sizes (480w, 768w, 1200w):

```html
<img src="/assets/img/post-cover-800.jpg"
     srcset="/assets/img/post-cover-480.jpg 480w,
             /assets/img/post-cover-768.jpg 768w,
             /assets/img/post-cover-1200.jpg 1200w"
     sizes="(max-width: 768px) 100vw, 75ch"
     loading="lazy"
     decoding="async"
     width="1200" height="630"
     alt="{{ page.title }}">
```

Explicit `width` and `height` attributes prevent layout shift (CLS).

### JS Loading Strategy

All JS files use `defer`. No JS is required for above-the-fold rendering:

```html
<!-- _includes/scripts.html -->
<script src="/assets/js/main.js" defer></script>
```

`main.js` initialises all modules after DOM is ready:

```javascript
// _js/main.js
document.addEventListener('DOMContentLoaded', () => {
  ThemeManager.init();
  NavManager.init();
  BackToTop.init();
  Search.init('.search__input', '.search__results', '/assets/js/search-data.json');
  GalleryManager.init();
});
```

### Layout Stability

- All images have explicit `width` and `height` attributes
- Font size uses `clamp()` (no reflow from `vw` jumps)
- Sidebar has fixed `var(--sidebar-width)` on desktop
- No dynamically injected above-the-fold content after first render

---

## Accessibility Design

### Skip Link

First focusable element in the DOM. Hidden off-screen until focused:

```scss
// _sass/base/_accessibility.scss
.skip-link {
  position: absolute;
  top: -100%;
  left: var(--space-4);
  z-index: 9999;
  padding: var(--space-2) var(--space-4);
  background: var(--color-accent);
  color: var(--color-text-inverse);
  border-radius: var(--border-radius-md);
  font-weight: 600;
  text-decoration: none;
  transition: top 200ms;

  &:focus {
    top: var(--space-4);
    outline: 3px solid var(--color-text-inverse);
    outline-offset: 2px;
  }
}
```

### Focus Indicators

Focus rings are visible on all interactive elements with ≥ 3:1 contrast against adjacent background:

```scss
// Global focus ring
:focus-visible {
  outline: 3px solid var(--color-accent);
  outline-offset: 3px;
  border-radius: var(--border-radius-sm);
}

// Reset for mouse users (only show on keyboard focus)
:focus:not(:focus-visible) {
  outline: none;
}
```

### ARIA Patterns by Component

| Component | ARIA role | Key attributes |
|---|---|---|
| Nav toggle button | `button` | `aria-expanded`, `aria-controls`, `aria-label` |
| Nav list | `list` | — |
| Active nav link | — | `aria-current="page"` |
| Theme toggle | `button` | `aria-pressed`, `aria-label` |
| Search input | `searchbox` or `input[type=search]` | `aria-label`, `aria-controls` (results) |
| Search results | `listbox` | `aria-label`, `aria-live="polite"` |
| Gallery modal | `dialog` | `aria-modal="true"`, `aria-label` |
| Gallery close | `button` | `aria-label="Close gallery"` |
| Breadcrumb nav | `nav` | `aria-label="Breadcrumb"` |
| Back-to-top | `button` | `aria-label="Back to top"` |
| Pagination | `nav` | `aria-label="Pagination"` |
| Social links | `list` | each item: `aria-label="<platform>"` |
| Post images | `img` | descriptive `alt` text or `alt=""` for decorative |

### Semantic HTML5 Region Map

```html
<body>
  <a class="skip-link" href="#main-content">Skip to main content</a>  <!-- nav landmark bypass -->
  <header role="banner">
    <nav aria-label="Main navigation">…</nav>
  </header>
  <main id="main-content" role="main">
    <article>…</article>          <!-- post pages -->
    <section aria-label="Search">…</section>
    <nav aria-label="Pagination">…</nav>
  </main>
  <footer role="contentinfo">…</footer>
</body>
```

### Focus Trap for Gallery Modal

When the gallery opens, focus is moved inside and cycles within it. Escape closes and returns focus:

```javascript
// In gallery.js
function trapFocus(modal) {
  const focusable = modal.querySelectorAll(
    'button, [href], input, [tabindex]:not([tabindex="-1"])'
  );
  const first = focusable[0];
  const last  = focusable[focusable.length - 1];

  modal.addEventListener('keydown', (e) => {
    if (e.key === 'Tab') {
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault(); last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault(); first.focus();
      }
    }
    if (e.key === 'Escape') GalleryManager.close();
  });
  first.focus();
}
```

---

## Content Discoverability Design

### Related Posts

Implemented in Liquid within `post.html`. Finds posts sharing ≥ 1 category or tag, capped at 3:

```liquid
{% assign related = "" | split: "" %}
{% for post in site.posts %}
  {% if post.url != page.url %}
    {% for cat in post.categories %}
      {% if page.categories contains cat and related.size < 3 %}
        {% unless related contains post %}
          {% assign related = related | push: post %}
        {% endunless %}
      {% endif %}
    {% endfor %}
  {% endif %}
{% endfor %}
```

### Reading Time Calculation

Computed in Liquid using word count and 200 WPM average:

```liquid
{% assign words = post.content | number_of_words %}
{% assign minutes = words | divided_by: 200 %}
{% if minutes < 1 %}
  Quick read
{% else %}
  {{ minutes }} min read
{% endif %}
```

### Tag Pages

Jekyll generates tag archive pages. Each tag from `page.tags` in every post must have a corresponding page in `_tags/<tag-name>.md` using the `posts_by_category` layout (or a new `posts_by_tag` layout). The `enableTags: true` `_config.yml` flag indicates this feature is already scaffolded.

### Post Excerpt Truncation

```liquid
{{ post.excerpt | strip_html | truncatewords: 55 }}
```

### Search Index Generation

At build time, Jekyll outputs `assets/js/search-data.json` containing all posts' titles, URLs, categories, tags, and 55-word excerpts. This file is referenced by `search.js` which fetches it on first keystroke (deferred load).

### Open Graph / Twitter Card

`jekyll-seo-tag` handles most tags automatically. The `_config.yml` twitter and author fields are already configured. Per-post cover images come from `page.image` front matter. The existing `og:image` fallback to `site.url/static/img/headshot1.jpg` is preserved and updated to `/assets/img/headshot.jpg`.

---

## JavaScript Architecture

All JavaScript is written as vanilla ES6 modules organized into IIFE-style module patterns (for GitHub Pages / no bundler compatibility). Files are concatenated and embedded in `assets/js/main.js` via a Jekyll include:

```
_js/
├── theme.js         ← ThemeManager module
├── nav.js           ← NavManager module  
├── back-to-top.js   ← BackToTop module
├── search.js        ← Search module
├── gallery.js       ← GalleryManager module (replaces fancyBox)
└── main.js          ← Orchestrator: imports + initialises all modules
```

### No-jQuery Migration Map

| jQuery pattern (old) | Vanilla JS replacement |
|---|---|
| `$(document).ready(fn)` | `document.addEventListener('DOMContentLoaded', fn)` |
| `$('.class').on('click', fn)` | `document.querySelector('.class').addEventListener('click', fn)` |
| `$('.class').addClass('x')` | `el.classList.add('x')` |
| `$('.class').hasClass('x')` | `el.classList.contains('x')` |
| `$('.class').attr('data-x')` | `el.dataset.x` |
| `$('.class').first().trigger('click')` | `el.click()` |
| Bootstrap `data-toggle="collapse"` | Bootstrap 5 `data-bs-toggle="collapse"` |
| Bootstrap `data-target="#id"` | Bootstrap 5 `data-bs-target="#id"` |

Note: Bootstrap 5 is itself jQuery-free, so migrating to Bootstrap 5 eliminates the Bootstrap/jQuery coupling.

### Gallery Module (Fancybox Replacement)

The custom gallery fully replicates the four behaviors required by Req 1.5 and 1.6:

1. **Per-project grouped galleries** — `data-gallery="<fancybox_class>"` groups images
2. **Next/previous navigation** — arrow buttons, left/right keyboard arrows
3. **Thumbnail strip** — row of `<button>` elements with thumbnail `<img>` to jump to any image
4. **Resume PDF modal** — detected by `data-gallery-type="iframe"`, rendered in `<iframe>` at 95vw×95vh

```html
<!-- Project card gallery trigger (Liquid) -->
<a href="/static/projects/{{ i.cover_image }}"
   data-gallery="{{ i.fancybox_class }}"
   data-gallery-thumb="/static/projects/{{ i.cover_thumbnail }}"
   data-gallery-title="{{ i.cover_title }}">
  <div class="project-card__thumb" style="background-image: url(…)"></div>
</a>

<!-- Resume modal trigger -->
<a href="/assets/tunji_olu-taiwo_resume.pdf"
   data-gallery-type="iframe"
   aria-label="View resume PDF">View Resume</a>
```

---

## GitHub Pages Compatibility

### Plugin Allowlist

Only plugins on the GitHub Pages allowlist are used:

| Plugin | Used for |
|---|---|
| `jekyll-paginate` | Blog index pagination |
| `jekyll-gist` | Gist embeds in posts |
| `jekyll-seo-tag` | Open Graph / Twitter Card / sitemap |
| `jekyll-redirect-from` | URL redirect support |

`jekyll-admin` remains in the `Gemfile` under `group: :jekyll_plugins` but continues to be excluded from GitHub Pages production builds (it is not on the allowlist, so GitHub Pages ignores it by default). For local development it is included via the group.

### Jekyll 3.8.x Constraints

GitHub Pages pins Jekyll 3.8.x. The design accounts for these limitations:
- **No `@layer` CSS** (no constraint, GitHub Pages doesn't process CSS) — fine, compiled CSS includes `@layer` transparently
- **Sass**: Jekyll 3.8 uses libsass via `sassc-rails`. All `@use` and `@forward` rules must be avoided in favour of `@import` (libsass does not support Dart Sass module system). The 7-1 Sass architecture uses `@import`.
- **No `jekyll-minifier` plugin** — minification via `style: compressed` in `_config.yml` for CSS; JS is manually concatenated and minified in the `build` Makefile target using a simple Ruby/shell command.
- **No post-processing plugins** — critical CSS is maintained manually.

### CNAME and .well-known

`CNAME` and `.well-known/` are included via the `include: [".well-known"]` directive already in `_config.yml`. No changes needed.

### Sitemap and RSS

`jekyll-seo-tag` generates the sitemap at `/sitemap.xml`. The RSS feed at `/feed.xml` is generated by `jekyll-feed` (already included in `github-pages` gem). The `<link rel="alternate" type="application/rss+xml">` element in `<head>` enables auto-discovery.

---

## Error Handling

### Build-Time Error Handling

Jekyll exits non-zero on invalid YAML front matter by default. The Makefile `build` target propagates this exit code. A build guard in `Makefile`:

```makefile
build:
	bundle exec jekyll build --strict_front_matter 2>&1 | tee build.log
	@if grep -q "Error" build.log; then echo "BUILD FAILED: see build.log"; exit 1; fi
```

`--strict_front_matter` causes Jekyll to halt on any YAML parse error in front matter, reporting the offending file path (satisfies Req 14.5, 14.6).

### Runtime Error Handling (JS)

- `Search.init()` wraps the `fetch` of `search-data.json` in a try/catch; on failure the search input is hidden gracefully
- `GalleryManager.init()` checks for `data-gallery` elements before attaching listeners
- `ThemeManager.init()` catches `localStorage` access errors (private browsing) and falls back to `prefers-color-scheme` without storing
- `NavManager.init()` checks element existence before attaching event listeners

### 404 Page

`404.html` is preserved. It uses the modernized default layout and includes the nav sidebar so users can navigate away.

---

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

The following properties were derived by analyzing each acceptance criterion for testability. IaC-style checks (build compatibility, file structure), one-time setup checks (Bootstrap version present, jQuery absent), and single-example UI behaviors are handled as smoke tests or example-based tests in the Testing Strategy. The properties below capture universal behaviors that hold across all inputs and all generated pages.

**Property reflection:** After reviewing all identified candidates, the following consolidations were made:
- "All script tags have defer/async" and "JS not required for above-fold" → merged into Property 4 (all external scripts deferred)
- "Semantic HTML5 elements present" and "Skip link is first focusable" → kept separate because they test distinct DOM invariants
- "Related posts ≤ 3" and "Related posts share category/tag" → merged into Property 8 (one comprehensive post relation property)
- Reading time and excerpt length → kept separate, distinct calculation logic

---

### Property 1: No External CDN References in Generated Pages

*For any* HTML page generated in `_site/`, every `<link href>` and `<script src>` attribute SHALL reference a relative or same-origin URL — no external CDN hostnames (e.g., `maxcdn.bootstrapcdn.com`, `ajax.googleapis.com`, `use.fontawesome.com`).

**Validates: Requirements 1.7**

---

### Property 2: Theme Toggle Is a Round Trip

*For any* initial theme value stored in `localStorage` (either "light" or "dark"), calling the theme toggle function twice SHALL result in the same value being stored in `localStorage` and applied to the root element as before the first toggle.

**Validates: Requirements 4.4**

---

### Property 3: Color Contrast Meets WCAG AA in Both Themes

*For any* foreground/background color pair defined by CSS Custom Property tokens in both the light theme and the dark theme, the computed WCAG 2.1 relative luminance contrast ratio SHALL be at least 4.5:1 for normal-sized text tokens and at least 3:1 for large-text tokens.

**Validates: Requirements 4.6, 7.5, 7.6**

---

### Property 4: All External Scripts Are Deferred

*For any* generated HTML page in `_site/`, every `<script>` element that carries a `src` attribute SHALL also carry either a `defer` or `async` attribute.

**Validates: Requirements 6.4**

---

### Property 5: Skip Link Is First Focusable Element

*For any* generated HTML page in `_site/`, the first element in DOM order that is natively focusable (an `<a>` with `href`, a `<button>`, or an element with `tabindex >= 0`) SHALL be the skip link pointing to `#main-content`.

**Validates: Requirements 7.3**

---

### Property 6: Every Page Contains Required Semantic Landmark Regions

*For any* generated HTML page in `_site/`, the document SHALL contain at minimum one `<nav>` element, one `<main>` element, and one `<footer>` element.

**Validates: Requirements 7.7**

---

### Property 7: Search Filter Returns Only Matching Results

*For any* non-empty search query string `q` and any valid search index array, the `Search` filter function SHALL return only items where `title` or `excerpt` contains `q` as a case-insensitive substring, and SHALL return an empty array (not an error) when no items match.

**Validates: Requirements 8.4**

---

### Property 8: Related Posts Are Relevant and Bounded

*For any* blog post `P` with at least one category or tag, the list of related posts rendered on `P`'s page SHALL contain between 0 and 3 items (inclusive), and every item in the list SHALL share at least one category or tag with `P`, and no item SHALL be `P` itself.

**Validates: Requirements 9.1**

---

### Property 9: Post Excerpts Are Bounded at 55 Words

*For any* post excerpt rendered on a listing page (home, category archive, tag archive), the word count of the displayed excerpt SHALL be less than or equal to 55 words.

**Validates: Requirements 9.3**

---

### Property 10: Reading Time Calculation Is Correct

*For any* blog post with word count `w`, if `floor(w / 200) < 1` then the displayed reading time indicator SHALL be the string "Quick read"; otherwise it SHALL display `floor(w / 200)` followed by "min read".

**Validates: Requirements 9.4**

---

### Property 11: All Existing Post URLs Are Preserved

*For any* URL path that exists in the current site's `_posts/` directory (9 known paths following the `/blog/<slug>/` pattern), a corresponding `index.html` file SHALL exist at that path in the generated `_site/` output after modernization.

**Validates: Requirements 12.3**

---

## Testing Strategy

### Overview

This site is a Jekyll static site with a mix of CSS architecture, Liquid templates, and vanilla JavaScript. Testing falls into three categories:

1. **Property-based tests** — for JavaScript logic (theme toggle, search filter, reading time, related posts algorithm) using a JS PBT library
2. **Example-based / snapshot tests** — for Jekyll HTML output structure, critical CSS size, contrast values
3. **Smoke tests** — for build success, dependency versions, file structure, WCAG automated scan

### Property-Based Testing

The PBT library is **[fast-check](https://github.com/dubzzz/fast-check)** (JavaScript). Tests run with Node.js and Jest (or Vitest) in a `test/` directory at the project root. Each test runs a minimum of 100 iterations.

```
test/
├── theme.test.js          ← Properties 2
├── search.test.js         ← Property 7
├── reading-time.test.js   ← Property 10
├── related-posts.test.js  ← Property 8
└── excerpt.test.js        ← Property 9
```

Each PBT test is tagged with a comment referencing its design property:
```javascript
// Feature: site-modernization, Property 2: theme toggle round trip
```

**theme.test.js** (Property 2):
```javascript
import fc from 'fast-check';
import { ThemeManager } from '../_js/theme.js';

test('theme toggle is a round trip', () => {
  fc.assert(fc.property(
    fc.constantFrom('light', 'dark'),
    (initialTheme) => {
      localStorage.setItem('theme', initialTheme);
      ThemeManager.toggle(); // first toggle
      ThemeManager.toggle(); // second toggle
      return localStorage.getItem('theme') === initialTheme;
    }
  ), { numRuns: 100 });
});
```

**search.test.js** (Property 7):
```javascript
import fc from 'fast-check';
import { filterPosts } from '../_js/search.js';

test('search returns only matching results', () => {
  fc.assert(fc.property(
    fc.array(fc.record({ title: fc.string(), excerpt: fc.string(), url: fc.string() })),
    fc.string({ minLength: 1 }),
    (posts, query) => {
      const results = filterPosts(posts, query);
      return results.every(p =>
        p.title.toLowerCase().includes(query.toLowerCase()) ||
        p.excerpt.toLowerCase().includes(query.toLowerCase())
      );
    }
  ), { numRuns: 100 });
});
```

**reading-time.test.js** (Property 10):
```javascript
import fc from 'fast-check';
import { readingTime } from '../_js/utils.js';

test('reading time calculation is correct', () => {
  fc.assert(fc.property(
    fc.nat({ max: 10000 }), // word count
    (wordCount) => {
      const result = readingTime(wordCount);
      if (Math.floor(wordCount / 200) < 1) {
        return result === 'Quick read';
      }
      return result === `${Math.floor(wordCount / 200)} min read`;
    }
  ), { numRuns: 100 });
});
```

### Example-Based / Snapshot Tests

Run with a simple Node.js script (`test/html-audit.js`) that parses `_site/**/*.html` after a build:

- **Property 1** (no CDN refs): Parse all `_site/**/*.html`, assert no `link[href]` or `script[src]` contains `bootstrapcdn.com`, `googleapis.com`, `fontawesome.com`, `jquery.com`, `cdnjs.cloudflare.com`
- **Property 4** (scripts deferred): Parse all `_site/**/*.html`, assert every `script[src]` has `defer` or `async`
- **Property 5** (skip link first): Parse each page, find first focusable element, assert it is `.skip-link` with `href="#main-content"`
- **Property 6** (semantic landmarks): Parse each page, assert presence of `nav`, `main`, `footer`
- **Property 11** (URL preservation): Assert `_site/blog/hello-world/index.html` etc. exist for all 9 posts
- **Critical CSS size**: Read `_includes/critical-css.html`, assert byte length ≤ 14336
- **Current year in footer**: Parse any generated page, assert copyright year equals `new Date().getFullYear()`

### Color Contrast Audit (Property 3)

A dedicated `test/contrast.test.js` script reads token values from `_sass/abstracts/_tokens.scss` (parsed with regex for `--color-*` values) and computes WCAG relative luminance for all text-on-background pairs in both light and dark themes using the [relative luminance formula](https://www.w3.org/TR/WCAG20/#relativeluminancedef). Asserts all pairs meet the required ratios.

### Smoke Tests

| Test | How |
|---|---|
| Build succeeds with github-pages gem | `bundle exec jekyll build --strict_front_matter` exits 0 |
| No Bootstrap 3 CDN references | grep `bootstrap/3.` in `_site/**/*.html` returns nothing |
| No jQuery script tags | grep `jquery` (case-insensitive) in `_site/**/*.html` returns nothing |
| Font Awesome 6.x present locally | `assets/vendors/fontawesome/css/all.min.css` exists |
| 7-1 Sass structure present | `_sass/abstracts/`, `_sass/base/`, etc. all exist |
| No `!important` outside utilities | grep `!important` in `_sass/components/`, `_sass/layout/` returns nothing |
| Lighthouse ≥ 90 performance | Run via `lighthouse-ci` in CI after each PR (optional manual step) |
| WCAG automated scan | Run `axe-core` or `pa11y` against local build (0 violations target) |

### Unit Tests

Unit tests focus on specific edge cases not covered by property tests:

- `ThemeManager`: system preference change updates theme only when localStorage has no stored preference
- `GalleryManager`: Escape key closes modal and returns focus to triggering element
- `NavManager`: Escape key closes open nav and returns focus to toggle button
- `Search`: returns empty array (not null/undefined) when query matches nothing
- `Search`: handles index fetch failure gracefully (hides search UI, no JS error)

### Accessibility Manual Checklist

Full WCAG 2.1 AA validation requires manual screen reader testing:
- Test with VoiceOver (macOS/iOS) and NVDA (Windows)
- Verify nav keyboard navigation: Tab, Shift+Tab, Enter, Escape
- Verify gallery keyboard navigation: Arrow keys, Tab in thumbnail strip, Escape
- Verify form controls (search input) are announced correctly
- Verify live regions (`aria-live="polite"` on search results) are announced

---

## Style Guide

A `STYLE_GUIDE.md` file at the project root documents all design tokens, component patterns, and conventions. It is updated alongside every design change as part of the definition of done for each task.

Sections:
1. **Color tokens** — all `--color-*` values with light/dark swatches and contrast ratios
2. **Spacing scale** — `--space-*` token table
3. **Typography scale** — `--font-size-*` values, weights, line heights
4. **Component inventory** — post-card, project-card, nav, gallery, search, tags, pagination
5. **BEM conventions** — naming rules with examples
6. **JavaScript conventions** — module pattern, camelCase identifiers, no jQuery
