BROWSER=firefox
JSCOV=jscoverage

test:
	node test.js

browser:
	node_modules/.bin/browserify test-browserify-entry.js > dist/browser-test/deltajs-test.js

browser-coverage: browser
	$(JSCOV) dist/browser-test dist/browser-test-cov

browser-test: browser
	 $(BROWSER) dist/browser-test/test.html >/dev/null 2>&1 &

.PHONY: test browser-test
