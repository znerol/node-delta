BROWSER=firefox
JSCOV=jscoverage
JSDOC=/home/lo/sw/jsdoc-3/jsdoc
JSDOCTK=/home/lo/sw/jsdoc-toolkit

test:
	node test.js

browser:
	node_modules/.bin/browserify --ignore fixtures --plugin 'fileify:["fixtures", "test/fixtures"]' test-browserify-entry.js > dist/browser-test/deltajs-test.js
	node_modules/.bin/browserify deltajs-browserify-entry.js > dist/browser/delta.js

examples: browser
	cp dist/browser/delta.js examples/xcc/delta.js
	cp dist/browser/delta.js examples/lcs/delta.js
	cp dist/browser/delta.js examples/srcdiff/delta.js

browser-coverage: browser
	$(JSCOV) dist/browser-test dist/browser-test-cov

browser-test: browser
	 $(BROWSER) dist/browser-test/test.html >/dev/null 2>&1 &

jsdoc:
	java -jar $(JSDOCTK)/jsrun.jar $(JSDOCTK)/app/run.js --verbose --recursive --template=./doc/_themes/jsdoc-for-sphinx/ --directory=./doc/jsdoc/ ./lib/delta/

doc: jsdoc
	(cd doc && make html)

.PHONY: test browser-test
