BROWSER=firefox
JSCOV=jscoverage

test:
	node test.js

browser:
	node scripts/browserify-test.js

browser-coverage: browser
	$(JSCOV) dist/browser-test dist/browser-test-cov

browser-test: browser
	 $(BROWSER) dist/browser-test/test.html &

.PHONY: test browser-test
