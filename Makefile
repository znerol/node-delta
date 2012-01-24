BROWSER=firefox
JSCOV=jscoverage
JSDOCTK=/home/lo/sw/jsdoc-toolkit
BROWSERIFY=node_modules/.bin/browserify
RJS=node_modules/.bin/r.js

test: test/fixtures
	node test.js

test/fixtures:
	make -C test/fixtures

browser:
	mkdir -p dist/browser
	$(BROWSERIFY) deltajs-browserify-entry.js > dist/browser/delta.js

amd:
	mkdir -p dist/amd
	$(RJS) -convert lib/delta dist/amd/delta
	$(RJS) -convert lib/profiles dist/amd/profiles

examples: browser
	cp dist/browser/delta.js examples/xcc/delta.js
	cp dist/browser/delta.js examples/lcs/delta.js
	$(BROWSERIFY) examples/srcdiff/srcdiff-entry.js > examples/srcdiff/srcdiff.js
	$(RJS) -convert lib/delta examples/vizmerge/delta

browser-coverage: browser test/fixtures
	$(JSCOV) dist/browser-test dist/browser-test-cov

dist/browser-test/delta-test.js:
	$(BROWSERIFY) test-browserify-entry.js > dist/browser-test/deltajs-test.js

browser-test: dist/browser-test/delta-test.js test/fixtures
	 $(BROWSER) dist/browser-test/test.html >/dev/null 2>&1 &

jsdoc:
	java -jar $(JSDOCTK)/jsrun.jar $(JSDOCTK)/app/run.js --verbose --recursive --template=./doc/_themes/jsdoc-for-sphinx/ --directory=./doc/jsdoc/ ./lib/delta/

doc: jsdoc
	(cd doc && make html)

.PHONY: test test/fixtures browser-test
