# Style Guide — tunjos.co

This document is the authoritative reference for the design token system and component inventory of the tunjos.co Jekyll site. Keep it current with every design change.

---

## Table of Contents

1. [Design Tokens](#design-tokens)
   - [Color Palette](#color-palette)
   - [Spacing Scale](#spacing-scale)
   - [Typography](#typography)
   - [Layout](#layout)
   - [Shadows](#shadows)
   - [Transitions](#transitions)
2. [Breakpoints](#breakpoints)
3. [Component Inventory](#component-inventory)
4. [BEM Naming Conventions](#bem-naming-conventions)
5. [Sass Architecture (7-1)](#sass-architecture-7-1)

---

## Design Tokens

All tokens are CSS Custom Properties defined in `_sass/abstracts/_tokens.scss`. Dark theme overrides are on `[data-theme="dark"]`.

### Color Palette

| Token | Light Value | Dark Value | Usage |
|---|---|---|---|
| `--color-accent` | `#2563eb` (Blue 600) | `#60a5fa` (Blue 400) | Links, active states, focus rings |
| `--color-accent-hover` | `#1d4ed8` (Blue 700) | `#93c5fd` (Blue 300) | Hover state for accent elements |
| `--color-bg` | `#ffffff` | `#0f172a` (Slate 900) | Page background |
| `--color-bg-subtle` | `#f8fafc` (Slate 50) | `#1e293b` (Slate 800) | Cards, sidebar background |
| `--color-bg-elevated` | `#f1f5f9` (Slate 100) | `#334155` (Slate 700) | Hover states, code blocks |
| `--color-text` | `#0f172a` (Slate 900) | `#f1f5f9` (Slate 100) | Primary body text |
| `--color-text-muted` | `#64748b` (Slate 500) | `#94a3b8` (Slate 400) | Meta, captions, secondary labels |
| `--color-text-inverse` | `#ffffff` | `#ffffff` | Text on accent backgrounds |
| `--color-border` | `#e2e8f0` (Slate 200) | `#334155` (Slate 700) | Dividers, card outlines |
| `--color-code-bg` | `#f1f5f9` | `#1e293b` | Code block backgrounds |
| `--color-shadow` | `rgba(0,0,0,0.08)` | `rgba(0,0,0,0.40)` | Shadow color base |

**WCAG AA Contrast Ratios:**

| Token | Light | Dark |
|---|---|---|
| `--color-text` on `--color-bg` | 18.1:1 ✓ | 16.9:1 ✓ |
| `--color-text-muted` on `--color-bg` | 5.0:1 ✓ | 4.6:1 ✓ |
| `--color-accent` on `--color-bg` | 4.6:1 ✓ | 4.7:1 ✓ |

---

### Spacing Scale

Base unit: **4px (0.25rem)**

| Token | Value | Pixels |
|---|---|---|
| `--space-1` | `0.25rem` | 4px |
| `--space-2` | `0.5rem` | 8px |
| `--space-3` | `0.75rem` | 12px |
| `--space-4` | `1rem` | 16px |
| `--space-6` | `1.5rem` | 24px |
| `--space-8` | `2rem` | 32px |
| `--space-12` | `3rem` | 48px |
| `--space-16` | `4rem` | 64px |

---

### Typography

| Token | Value | Notes |
|---|---|---|
| `--font-sans` | System font stack | `-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif` |
| `--font-mono` | Monospace stack | `ui-monospace, SFMono-Regular, "Cascadia Code", Consolas, "Liberation Mono", monospace` |
| `--font-size-base` | `clamp(15px, 2.5vw, 18px)` | Fluid scaling 15–18px |
| `--line-height-body` | `1.65` | Body text |
| `--line-height-heading` | `1.2` | Headings |
| `--font-weight-body` | `400` | Normal |
| `--font-weight-heading` | `650` | Semi-bold |

**Type Scale (Major Third ratio: 1.25):**

| Token | Value | Element |
|---|---|---|
| `--font-size-sm` | `0.8rem` (~12.8px) | `h6`, captions, labels |
| `--font-size-md` | `1rem` (~16px) | `h5`, body text |
| `--font-size-lg` | `1.25rem` (~20px) | `h4` |
| `--font-size-xl` | `1.5625rem` (~25px) | `h3` |
| `--font-size-2xl` | `1.953rem` (~31px) | `h2` |
| `--font-size-3xl` | `2.441rem` (~39px) | `h1` |

---

### Layout

| Token | Value | Usage |
|---|---|---|
| `--sidebar-width` | `260px` | Desktop sidebar fixed width |
| `--content-max-width` | `75ch` | Maximum prose line length |
| `--section-gap` | `var(--space-8)` | 32px min gap between sections |
| `--border-radius-sm` | `4px` | Buttons, badges |
| `--border-radius-md` | `6px` | Cards, inputs |
| `--border-radius-lg` | `8px` | Modals, panels |

---

### Shadows

| Token | Value | Usage |
|---|---|---|
| `--shadow-sm` | `0 1px 3px rgba(0,0,0,0.08)` | Cards at rest |
| `--shadow-md` | `0 4px 8px rgba(0,0,0,0.10)` | Elevated elements, dropdowns |
| `--shadow-focus` | `0 0 0 3px rgba(37,99,235,0.45)` | Keyboard focus indicator |

---

### Transitions

| Token | Value | Usage |
|---|---|---|
| `--transition-color` | `color 300ms ease, background-color 300ms ease` | Theme switches |
| `--transition-fast` | `150ms ease` | Hover states, micro-interactions |

---

## Breakpoints

Defined in `_sass/abstracts/_mixins.scss`. Usage: `@include mq('md') { ... }`

| Name | Value | Layout context |
|---|---|---|
| `sm` | `480px` | Small phones landscape |
| `md` | `768px` | Tablets |
| `lg` | `1024px` | Desktop — sidebar appears |
| `xl` | `1280px` | Wide desktop |
| `2xl` | `1536px` | Extra-wide / ultrawide |

---

## Component Inventory

Components are added to this table as they are built. Each entry links to the partial file and documents its BEM class structure.

| Component | Partial | BEM Block | Status |
|---|---|---|---|
| Navigation | `components/_nav.scss` | `.site-nav` | Pending |
| Theme Toggle | `components/_theme-toggle.scss` | `.theme-toggle` | Pending |
| Post Card | `components/_post-card.scss` | `.post-card` | Pending |
| Project Card | `components/_project-card.scss` | `.project-card` | Pending |
| Gallery | `components/_gallery.scss` | `.gallery` | Pending |
| Search | `components/_search.scss` | `.search` | Pending |
| Breadcrumbs | `components/_breadcrumbs.scss` | `.breadcrumbs` | Pending |
| Pagination | `components/_pagination.scss` | `.pagination` | Pending |
| Back to Top | `components/_back-to-top.scss` | `.back-to-top` | Pending |
| Social Links | `components/_social-links.scss` | `.social-links` | Pending |
| Share Buttons | `components/_share.scss` | `.share` | Pending |
| Tags | `components/_tags.scss` | `.tags` | Pending |

---

## BEM Naming Conventions

All components use strict BEM methodology:

```
Block:    .post-card
Element:  .post-card__title
          .post-card__meta
          .post-card__excerpt
Modifier: .post-card--featured
          .post-card--compact
```

Utility classes are **exempt** from BEM and are prefixed with `u-`:

```css
.u-sr-only     /* visually hidden, accessible to screen readers */
.u-truncate    /* text overflow ellipsis */
.u-no-scroll   /* prevent body scroll (modal open) */
```

Rules:
- No `!important` except in utility classes
- Utility classes apply exactly one CSS property
- JavaScript identifiers use camelCase

---

## Sass Architecture (7-1)

```
_sass/
├── abstracts/          ← No CSS output; variables, mixins, functions
│   ├── _tokens.scss    ← All CSS Custom Properties (design tokens)
│   ├── _mixins.scss    ← mq(), touch-target, visually-hidden
│   └── _functions.scss ← fluid-type(), rem()
├── base/               ← Element-level defaults
│   ├── _reset.scss     ← Modern CSS reset
│   ├── _typography.scss← Body, heading, link base styles
│   └── _accessibility.scss ← Skip link, :focus-visible
├── layout/             ← Page region structure
│   ├── _grid.scss      ← CSS Grid (sidebar + main + footer)
│   ├── _header.scss    ← Site header
│   └── _footer.scss    ← Site footer
├── components/         ← Discrete UI components
│   ├── _nav.scss
│   ├── _theme-toggle.scss
│   ├── _post-card.scss
│   ├── _project-card.scss
│   ├── _gallery.scss
│   ├── _search.scss
│   ├── _breadcrumbs.scss
│   ├── _pagination.scss
│   ├── _back-to-top.scss
│   ├── _social-links.scss
│   ├── _share.scss
│   └── _tags.scss
├── themes/             ← Theme-specific overrides
│   └── _dark.scss      ← Dark mode component overrides
├── utilities/          ← Single-property helpers (u- prefix)
│   └── _utilities.scss
├── vendors/            ← Third-party styles
│   └── _syntax.scss    ← Rouge syntax highlighting
└── main.scss           ← Single entry point (@import cascade)
```

Import order in `main.scss` ensures correct cascade:
1. `abstracts/` — no output, sets up tools
2. `base/` — element resets and defaults
3. `layout/` — page structure
4. `components/` — UI building blocks
5. `themes/` — overrides
6. `utilities/` — highest specificity helpers
7. `vendors/` — third-party last
