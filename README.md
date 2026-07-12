# tunjos.co

Personal blog and portfolio site built with [Jekyll](https://jekyllrb.com) and hosted on [GitHub Pages](https://pages.github.com).

## Prerequisites

- **Ruby** ≥ 2.7 (with Bundler: `gem install bundler`)
- **Node.js** ≥ 18 (with npm)

## Install

Install all Ruby and Node dependencies:

```bash
make install
```

Or manually:

```bash
bundle install
npm install
```

## Serve (local development)

Start a local development server with live reload at `http://localhost:4000`:

```bash
make serve
```

Or manually:

```bash
bundle exec jekyll serve --livereload
```

Changes to source files are reflected in the browser within seconds.

## Build (production)

Generate the static site into `_site/` and concatenate JavaScript modules into `assets/js/main.js`:

```bash
make build
```

Or manually:

```bash
bundle exec jekyll build --strict_front_matter
cat _js/theme.js _js/nav.js _js/back-to-top.js _js/search.js _js/gallery.js _js/main.js > assets/js/main.js
```

The build halts and reports an error if any content file contains invalid front matter or `_config.yml` contains invalid YAML (`--strict_front_matter` flag).
