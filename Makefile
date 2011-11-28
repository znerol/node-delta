BROWSER=firefox
JSCOV=jscoverage
JSDOC=/home/lo/sw/jsdoc-3/jsdoc

test:
	node test.js

browser:
	node_modules/.bin/browserify test-browserify-entry.js > dist/browser-test/deltajs-test.js
	node_modules/.bin/browserify deltajs-browserify-entry.js > dist/browser/delta.js

examples: browser
	cp dist/browser/delta.js examples/xcc/delta.js
	cp dist/browser/delta.js examples/lcs/delta.js

browser-coverage: browser
	$(JSCOV) dist/browser-test dist/browser-test-cov

browser-test: browser
	 $(BROWSER) dist/browser-test/test.html >/dev/null 2>&1 &

jsdoc:
	$(JSDOC) --recurse --destination doc/jsdoc/ lib/delta/

.PHONY: test browser-test
