.PHONY: install serve build

# Install Ruby and Node dependencies
install:
	bundle install
	npm install

# Start local development server with live reload
serve:
	bundle exec jekyll serve --livereload

# Build production output: Jekyll + JS concatenation
build:
	bundle exec jekyll build --strict_front_matter
	cat _js/theme.js \
	    _js/nav.js \
	    _js/back-to-top.js \
	    _js/search.js \
	    _js/gallery.js \
	    _js/main.js \
	    > assets/js/main.js
