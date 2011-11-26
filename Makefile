BROWSER=firefox

test:
	node test.js

browser:
	node scripts/browserify-test.js

browser-test: browser
	 $(BROWSER) dist/browser-test/test.html

.PHONY: test browser-test
