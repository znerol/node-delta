BROWSER=firefox
JSCOV=jscoverage
JSDOCTK=/home/lo/sw/jsdoc-toolkit
BROWSERIFY=node_modules/.bin/browserify
RJS=node_modules/.bin/r.js
XMLSHIM_AMD=node_modules/xmlshim/amd.js

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
	cp $(XMLSHIM_AMD) dist/amd/xmlshim.js

examples: browser amd
	cp dist/browser/delta.js examples/xcc/delta.js
	cp dist/browser/delta.js examples/lcs/delta.js
	$(BROWSERIFY) examples/srcdiff/srcdiff-entry.js > examples/srcdiff/srcdiff.js
	rm -rf examples/vizmerge/delta
	cp -r dist/amd/delta examples/vizmerge/delta
	cp dist/amd/xmlshim.js examples/vizmerge/xmlshim.js

dist/browser-test:
	mkdir -p dist/browser-test/
	cp -r browser-test/* dist/browser-test/

dist/browser-test/delta-test.js: dist/browser-test
	$(BROWSERIFY) test-browserify-entry.js > dist/browser-test/deltajs-test.js

dist/browser-test-cov: dist/browser-test
	$(JSCOV) dist/browser-test dist/browser-test-cov

browser-test: dist/browser-test/delta-test.js test/fixtures
	$(BROWSER) dist/browser-test/test.html >/dev/null 2>&1 &
	
browser-coverage: dist/browser-test-cov
	$(BROWSER) dist/browser-test-cov/jscoverage.html?test.html >/dev/null 2>&1 &

jsdoc:
	java -jar $(JSDOCTK)/jsrun.jar $(JSDOCTK)/app/run.js --verbose --recursive --template=./doc/_themes/jsdoc-for-sphinx/ --directory=./doc/jsdoc/ ./lib/delta/

doc: jsdoc
	make -C doc html

dist/apiref: doc
	mkdir -p dist/apiref
	cp -r doc/_build/html/* dist/apiref

clean:
	rm -rf dist
	make -C doc clean
	make -C test/fixtures clean

.PHONY: test test/fixtures browser-test clean
