BROWSER=firefox
JSCOV=jscoverage
JSDOC=/home/lo/sw/jsdoc-3/jsdoc
JSDOCTK=/home/lo/sw/jsdoc-toolkit
BROWSERIFY=node_modules/.bin/browserify
RJS=node_modules/.bin/r.js

test: test/fixtures
	node test.js

test/fixtures:
	make -C test/fixtures

browser:
	$(BROWSERIFY) test-browserify-entry.js > dist/browser-test/deltajs-test.js
	$(BROWSERIFY) deltajs-browserify-entry.js > dist/browser/delta.js

awm:
	mkdir -p dist/awm
	$(RJS) -convert lib/delta dist/awm/delta
	$(RJS) -convert lib/profiles dist/awm/profiles

examples: browser
	cp dist/browser/delta.js examples/xcc/delta.js
	cp dist/browser/delta.js examples/lcs/delta.js
	$(BROWSERIFY) examples/srcdiff/srcdiff-entry.js > examples/srcdiff/srcdiff.js
	$(RJS) -convert lib/delta examples/vizmerge/src/delta
	$(RJS) -convert lib/profiles examples/vizmerge/src/profiles

browser-coverage: browser test/fixtures
	$(JSCOV) dist/browser-test dist/browser-test-cov

browser-test: browser test/fixtures
	 $(BROWSER) dist/browser-test/test.html >/dev/null 2>&1 &

jsdoc:
	java -jar $(JSDOCTK)/jsrun.jar $(JSDOCTK)/app/run.js --verbose --recursive --template=./doc/_themes/jsdoc-for-sphinx/ --directory=./doc/jsdoc/ ./lib/delta/

doc: jsdoc
	(cd doc && make html)

.PHONY: test test/fixtures browser-test
