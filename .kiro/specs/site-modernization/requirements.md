# Requirements Document

## Introduction

This document specifies requirements for modernizing the tunjos.co Jekyll personal blog/portfolio website. The current site uses outdated dependencies (Bootstrap 3, jQuery 1.x, Font Awesome 4.x) and lacks contemporary design patterns, responsive design optimization, and modern web standards. The modernization will upgrade the technical stack, improve mobile-first responsiveness, enhance accessibility, optimize performance, and introduce dark mode support while maintaining the existing content structure (blog posts, projects, about page).

## Glossary

- **Site**: The tunjos.co Jekyll static website
- **Content_System**: The Jekyll static site generator and its content management components
- **Layout_Engine**: The CSS framework and layout system responsible for responsive design
- **Navigation_System**: The sidebar and mobile navigation components
- **Theme_System**: The styling system including colors, typography, and dark/light mode
- **Performance_Monitor**: The system tracking Core Web Vitals and load performance
- **Accessibility_Validator**: The system ensuring WCAG 2.1 AA compliance
- **Asset_Manager**: The system managing CSS, JavaScript, fonts, and image resources

## Requirements

### Requirement 1: Dependency Modernization

**User Story:** As a site maintainer, I want to upgrade outdated frontend dependencies, so that the site benefits from security patches, performance improvements, and modern features.

#### Acceptance Criteria

1. THE Site SHALL use Bootstrap 5.3 or later instead of Bootstrap 3.3.6
2. THE Site SHALL eliminate jQuery as a dependency, including migrating all Bootstrap `data-toggle` attributes to `data-bs-*` equivalents and converting all jQuery DOM-ready initialization patterns to vanilla JavaScript
3. THE Site SHALL use Font Awesome 6.x instead of Font Awesome 4.x
4. THE Site SHALL remove the Bootstrap Material Design theme dependency
5. THE Site SHALL replace fancyBox with a vanilla JavaScript implementation that supports grouped project galleries with next/previous navigation and thumbnail strips, plus a resume modal sized to at least 95% of viewport width and height
6. WHEN dependencies are updated, THE Site SHALL maintain all four existing behaviors: mobile navigation collapse/expand, per-project image gallery, resume PDF modal, and blog category link navigation, replacing the Bootstrap 3 `data-toggle` API with the Bootstrap 5 `data-bs-*` equivalents
7. THE Asset_Manager SHALL load all CSS, JavaScript, and web font files from local project files instead of external CDNs

### Requirement 2: Mobile-First Responsive Design

**User Story:** As a mobile user, I want the site to display optimally on my device, so that I can easily read content and navigate without layout issues.

#### Acceptance Criteria

1. THE Layout_Engine SHALL use a mobile-first design approach with min-width media queries
2. WHEN viewport width is less than 768px, THE Navigation_System SHALL display a hamburger menu button that is collapsed by default and expands to show navigation items when the button is activated
3. WHEN viewport width is less than 768px, THE Layout_Engine SHALL display content in a single column
4. IF viewport width is between 768px and 1023px (inclusive), THEN THE Layout_Engine SHALL apply a minimum of 24px horizontal padding to content areas and 32px vertical spacing between major sections
5. WHEN viewport width is 1024px or greater (inclusive), THE Navigation_System SHALL display a sidebar navigation
6. THE Layout_Engine SHALL use CSS Grid or Flexbox instead of Bootstrap float-based grid
7. THE Site SHALL prevent horizontal scrolling on all viewport sizes from 320px to 2560px wide
8. WHEN images are displayed, THE Asset_Manager SHALL serve at least two size variants — one for viewports below 768px and one for viewports 768px and above — using the HTML srcset attribute
9. THE Site SHALL achieve a score of 90 or higher on Google Lighthouse Mobile Performance
10. THE Navigation_System SHALL render all interactive touch targets at a minimum of 44×44 CSS pixels on mobile viewports

### Requirement 3: Modern CSS Architecture

**User Story:** As a developer, I want to use modern CSS patterns, so that the site is easier to maintain and performs better.

#### Acceptance Criteria

1. THE Layout_Engine SHALL use CSS Grid for the main page layout structure, including the sidebar and content area arrangement
2. THE Layout_Engine SHALL use Flexbox for component-level layouts such as navigation item lists, post card internals, and header content alignment
3. THE Theme_System SHALL define all color, spacing, and typography values as CSS Custom Properties (variables) with no hard-coded values remaining in component styles
4. THE Site SHALL apply `contain: layout style` to repeating self-contained components such as post cards and project cards, and SHALL apply `will-change` only to elements with active CSS transitions or animations
5. THE Layout_Engine SHALL implement container queries for components that adapt to their container width independently of viewport width, including post cards and project cards
6. THE Site SHALL contain zero `!important` declarations except in utility classes, where each utility class applies exactly one CSS property
7. THE Site SHALL organize all CSS class names using BEM (Block__Element--Modifier) methodology

### Requirement 4: Dark Mode Support

**User Story:** As a user, I want to toggle between light and dark themes, so that I can read comfortably in different lighting conditions.

#### Acceptance Criteria

1. THE Theme_System SHALL provide both light and dark color schemes
2. WHEN the user first visits and no theme preference is stored in localStorage, THE Theme_System SHALL read the `prefers-color-scheme` media query and store the detected value ("light" or "dark") as the initial preference in localStorage before applying it
3. THE Site SHALL provide a visible toggle control for switching themes, with a minimum size of 44×44 CSS pixels and a visible label or icon distinguishing the current mode
4. WHEN the user activates the theme toggle, THE Theme_System SHALL update the stored value in localStorage under the key `theme` to either "light" or "dark"
5. WHEN theme is changed, THE Theme_System SHALL apply the transition within 300ms using a CSS transition on color and background-color properties
6. THE Theme_System SHALL ensure text contrast ratios meet WCAG AA standards (at least 4.5:1 for normal text and 3:1 for large text) in both light and dark themes
7. THE Theme_System SHALL update the applied theme class on the root element without page reload
8. WHEN the system `prefers-color-scheme` value changes, THE Theme_System SHALL update the active theme ONLY IF no `theme` key exists in localStorage

### Requirement 5: Enhanced Typography

**User Story:** As a reader, I want modern, readable typography, so that content is pleasant and easy to consume.

#### Acceptance Criteria

1. THE Theme_System SHALL use a system font stack (`-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif`) as the base, with variable fonts loaded as a progressive enhancement
2. THE Theme_System SHALL set base font size using `clamp(15px, 2.5vw, 18px)` to provide fluid scaling between a minimum of 15px and a maximum of 18px
3. THE Theme_System SHALL maintain a line height between 1.5 and 1.8 for body text, and between 1.1 and 1.3 for headings
4. THE Theme_System SHALL use a font size scale with a ratio between 1.2 and 1.333 for steps between heading levels
5. THE Theme_System SHALL set maximum line length to between 65ch and 75ch for readability in post and page content areas
6. THE Theme_System SHALL apply font weights of 600–700 to headings and 400 to body text
7. THE Theme_System SHALL implement proper heading hierarchy where each heading level (h1 through h6) has a strictly smaller font size than the level above it, and no heading levels are skipped in the document outline
8. THE Theme_System SHALL apply letter-spacing of −0.02em to −0.03em for headings and 0 to 0.01em for body text

### Requirement 6: Performance Optimization

**User Story:** As a user, I want fast page loads, so that I can access content quickly.

#### Acceptance Criteria

1. THE Asset_Manager SHALL implement lazy loading for images below the fold using the HTML `loading="lazy"` attribute
2. THE Asset_Manager SHALL generate and serve responsive images with `srcset` attributes providing at least three size variants: 480px, 768px, and 1200px wide
3. THE Asset_Manager SHALL inline critical CSS for above-the-fold content in a `<style>` block in the document `<head>`, with the inlined CSS not exceeding 14KB
4. THE Asset_Manager SHALL load all JavaScript not required for above-the-fold rendering using the `defer` or `async` attribute
5. THE Asset_Manager SHALL produce minified and bundled CSS and JavaScript output files that are smaller than the sum of their unminified source files
6. THE Site SHALL achieve a Largest Contentful Paint (LCP) under 2.5 seconds measured on a simulated mobile device using Lighthouse v10+ with the Slow 4G throttling profile
7. THE Site SHALL achieve an Interaction to Next Paint (INP) under 200ms measured on a simulated mobile device using Lighthouse v10+ with the Slow 4G throttling profile
8. THE Site SHALL achieve a Cumulative Layout Shift (CLS) score under 0.1 measured on a simulated mobile device using Lighthouse v10+ with the Slow 4G throttling profile
9. THE Site SHALL score 90 or above on Google Lighthouse Performance audit measured on a simulated mobile device using Lighthouse v10+ with the Slow 4G throttling profile
10. THE Asset_Manager SHALL implement `preconnect` and `dns-prefetch` resource hints for all third-party origins referenced in the critical rendering path

### Requirement 7: Accessibility Compliance

**User Story:** As a user with disabilities, I want the site to be accessible, so that I can navigate and consume content using assistive technologies.

#### Acceptance Criteria

1. THE Site SHALL achieve WCAG 2.1 Level AA compliance, verified by an automated accessibility audit with zero violations and a manual review with a screen reader confirming all interactive flows are operable
2. THE Navigation_System SHALL be fully keyboard navigable with visible focus indicators that have a minimum contrast ratio of 3:1 between the focus indicator color and the adjacent background
3. THE Site SHALL provide a skip-to-content link as the first focusable element in the page, which becomes visible on keyboard focus
4. THE Site SHALL include ARIA labels on all interactive elements where the label programmatically describes the element's purpose and is announced by screen readers
5. WHEN the Accessibility_Validator evaluates body text, THE Accessibility_Validator SHALL confirm color contrast ratios of at least 4.5:1 between foreground and background
6. WHEN the Accessibility_Validator evaluates large text (18px or 14px bold and above), THE Accessibility_Validator SHALL confirm color contrast ratios of at least 3:1 between foreground and background
7. THE Site SHALL use semantic HTML5 elements (`nav`, `main`, `article`, `section`, `aside`) for all major page regions
8. THE Site SHALL provide descriptive `alt` text for all informative images and `alt=""` for all decorative images
9. THE Navigation_System SHALL announce active page changes using `aria-current="page"`, expanded/collapsed state using `aria-expanded`, and focused menu items using `aria-activedescendant` where applicable
10. THE Site SHALL ensure that when a modal or overlay traps focus, pressing the Escape key closes the modal and returns focus to the element that triggered it

### Requirement 8: Improved Navigation UX

**User Story:** As a visitor, I want intuitive navigation, so that I can easily find content I'm interested in.

#### Acceptance Criteria

1. WHEN viewport width is less than 768px and the hamburger button is activated, THE Navigation_System SHALL expand or collapse the menu using a CSS transition that completes within 300ms
2. THE Navigation_System SHALL apply a distinct visual indicator (such as a background color change, border, or bold weight) to the menu item corresponding to the current page
3. THE Navigation_System SHALL render breadcrumb navigation for blog post pages showing at minimum the Home and current post title as links
4. THE Site SHALL implement search functionality that filters blog posts and projects by title and content in real time, returning results within 500ms of input, and SHALL display a "No results found" message when no matches exist
5. THE Site SHALL provide tag and category filters that, when activated, hide non-matching posts and display a distinct active-state indicator on the selected filter
6. WHEN the user scrolls to a position greater than 200px from the top of the page, THE Navigation_System SHALL display a "back to top" button; WHEN the button is clicked, THE Navigation_System SHALL scroll the viewport to the top of the page
7. THE Navigation_System SHALL apply a CSS state change to all clickable elements within 150ms of pointer hover
8. WHILE viewport width is 1024px or greater, THE Navigation_System SHALL use CSS `position: sticky` to keep the sidebar navigation visible during scroll

### Requirement 9: Content Discoverability

**User Story:** As a reader, I want to discover related content easily, so that I can explore topics I'm interested in.

#### Acceptance Criteria

1. THE Site SHALL display up to 3 related posts on each post page, where a related post shares at least 1 category or tag with the current post
2. THE Site SHALL provide a tag list where activating a tag navigates to a page listing all posts assigned that tag
3. THE Site SHALL display post excerpts truncated to a maximum of 55 words on post listing pages
4. IF a blog post's content, when divided by an average reading speed of 200 words per minute, calculates to less than 1 minute, THEN THE Site SHALL display "Quick read" instead of a zero or sub-minute estimate
5. THE Site SHALL provide pagination with a previous link labeled "Previous" or "←" and a next link labeled "Next" or "→" visible on listing pages with more posts than the configured per-page limit
6. THE Site SHALL include Open Graph meta tags (`og:title`, `og:description`, `og:image`, `og:url`) and Twitter Card meta tags (`twitter:card`, `twitter:title`, `twitter:description`) on every page, with per-post cover images where available
7. THE Site SHALL generate an XML sitemap at `/sitemap.xml` for search engine indexing
8. THE Site SHALL include an RSS/Atom feed auto-discovery `<link>` element in the `<head>` of every page

### Requirement 10: Layout Modernization

**User Story:** As a visitor, I want a clean, modern design aesthetic, so that the site feels contemporary and professional.

#### Acceptance Criteria

1. THE Layout_Engine SHALL use a minimum of 24px spacing between all major page sections
2. THE Theme_System SHALL implement shadows using `box-shadow` values with a blur radius no greater than 8px and an alpha opacity no greater than 0.15, replacing all Material Design elevation styles
3. THE Layout_Engine SHALL apply border-radius values between 4px and 8px to all card and button elements
4. THE Theme_System SHALL define a color palette of no more than 5 primary or accent colors plus no more than 4 neutral shades
5. THE Site SHALL contain no third-party ad scripts or ad-container elements in the footer
6. THE Site SHALL display the current year in the copyright notice using a dynamically evaluated value (e.g., Jekyll's `site.time | date: '%Y'`) instead of the static text "This Year"
7. WHEN a page contains 3 or more distinct content sections, THE Layout_Engine SHALL apply an asymmetric layout (such as alternating left/right content alignment) to those sections for visual interest
8. WHEN a user activates an anchor link, THE Site SHALL scroll to the target element using `scroll-behavior: smooth` set in CSS

### Requirement 11: Code Quality and Maintainability

**User Story:** As a developer, I want clean, maintainable code, so that future updates are easier to implement.

#### Acceptance Criteria

1. THE Content_System SHALL organize Sass partials into at least 7 distinct responsibility areas: base, layout, components, utilities, abstracts (variables and mixins), themes, and vendors
2. THE Site SHALL use Sass with one partial file per responsibility area and a single `main.scss` entry file that imports all partials
3. THE Site SHALL include an inline comment for each CSS Custom Property declaration stating its purpose and accepted values at the point of declaration
4. THE Site SHALL use BEM (Block__Element--Modifier) naming for all CSS classes and camelCase naming for all JavaScript identifiers, with no mixing of conventions within the same context
5. WHEN the site is built, THE Site SHALL contain only CSS and JavaScript that is referenced by at least one page in the generated output
6. WHEN the site is built, THE Content_System SHALL validate all generated HTML pages and produce zero W3C validation errors
7. THE Site SHALL maintain a style guide file documenting all design tokens (colors, spacing scale, type scale) and all reusable UI components, kept current with each design change

### Requirement 12: Content Structure Preservation

**User Story:** As a content creator, I want to maintain existing content structure, so that no blog posts or projects are lost during modernization.

#### Acceptance Criteria

1. THE Content_System SHALL preserve all existing markdown files in the `_posts` directory without modification to their content or filenames
2. THE Content_System SHALL preserve all existing data files in the `_data` directory (`books.yml`, `projects.json`, `videos.yml`) without modification
3. THE Content_System SHALL maintain all existing URL paths so that no previously published URL returns a 404 after modernization
4. THE Content_System SHALL preserve all front matter fields present in existing content files, adding new fields only as optional additions
5. THE Content_System SHALL continue to generate category archive pages and tag pages for all categories and tags used in existing posts
6. THE Content_System SHALL render the projects showcase from `_data/projects.json` with all existing project entries displayed
7. THE Content_System SHALL render the about page with its existing content intact
8. WHEN the site is rebuilt after modernization, THE Content_System SHALL generate one output HTML page for each existing markdown source file using the new layout and styles

### Requirement 13: GitHub Pages Compatibility

**User Story:** As a site maintainer, I want continued GitHub Pages hosting support, so that deployment remains simple and cost-free.

#### Acceptance Criteria

1. THE Site SHALL remain compatible with the Jekyll version pinned by the `github-pages` gem (currently Jekyll 3.8.x as declared in `Gemfile.lock`)
2. THE Site SHALL use only Jekyll plugins present in the `github-pages` gem dependency list; `jekyll-admin` SHALL be excluded from the production build configuration since it is absent from the GitHub Pages allowlist
3. THE Content_System SHALL generate output consisting entirely of static HTML, CSS, JavaScript, and media files that can be served without any server-side script execution
4. THE Site SHALL maintain the `CNAME` file at the repository root to preserve the `tunjos.co` custom domain mapping
5. THE Site SHALL preserve the `.well-known` directory and its contents for domain verification
6. THE Content_System SHALL build without errors using the Jekyll version pinned by the installed `github-pages` gem

### Requirement 14: Developer Experience

**User Story:** As a developer, I want efficient local development workflow, so that I can preview changes quickly.

#### Acceptance Criteria

1. THE Content_System SHALL provide a `README` file containing at minimum: system prerequisites, step-by-step install commands, a local serve command, and a production build command
2. WHEN a source file is saved during local development, THE Content_System SHALL reload the browser and reflect the change within 3 seconds
3. WHEN a single existing file is edited during local development, THE Content_System SHALL complete an incremental rebuild in under 5 seconds
4. THE Content_System SHALL provide at minimum three documented scripts or Makefile targets: `install` (install dependencies), `serve` (start local development server), and `build` (generate production output)
5. WHEN the site is built and IF any content file contains invalid front matter syntax or `_config.yml` contains invalid YAML, THE Content_System SHALL halt the build and report the offending file path and field name before producing any output
6. IF a build error occurs, THE Content_System SHALL output a message identifying the source file, the type of failure, and no partial output files from the failed build
7. THE Content_System SHALL include a `.browserslistrc` file, and the generated CSS SHALL include vendor prefixes and property fallbacks consistent with the browser targets defined in that file
