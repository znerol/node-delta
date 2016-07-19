Delta.js - A JavaScript diff and patch engine for DOM trees
===========================================================

[![Build Status](https://travis-ci.org/znerol/node-delta.svg?branch=master)](https://travis-ci.org/znerol/node-delta)

Requirements
------------

* node.js: Tested on v4, v5, v6, iojs-v2, iojs-v3
* GNU make

The instructions have been tested on Linux. They probably also work on Mac OS X
machines with installed XCode Developer Tools. There is currently no support
for Microsoft Windows.


Build instructions for node.js
------------------------------

Delta.js runs within modern web browsers as well as under node.js. In order to
use it as a module for node.js based projects, just drop this directory into an
appropriate module path. For example the `node\_modules` folder of your
project.

The delta.js source directory is organized as an npm package. Invoking the
command `npm install` will download any dependencies and install them into the
directory `node\_modules`.

It is recommended to verify the installation by running the automated test
suite once by invoking `make test`.


Building AMD modules
--------------------

In order to build a version suitable for AMD module loaders like dojo or
require.js, invoke `make amd`. The built modules are put into the directory
`dist/amd`.


Building single file browser version
------------------------------------

A single-file browser version of the framework can be built using the command
`make browser`. The result is placed into `dist/browser/delta.js`. Note that
this version is not compatible with AMD modules.


Running the command line version
--------------------------------

The command line utilities are located in the `bin` directory. They may be
invoked directly without a prior build. There are some sample XML files in
`test/fixtures` which are useful to quickly test the command line interfaces.

Follow this example in order to produce a patch by diffing two versions of an
XML file as well as apply it afterwards back to the original version.

```bash
./bin/djdiff.js -p xml ./test/fixtures/logo-1.svg ./test/fixtures/logo-2.svg > /tmp/logo-diff.xml
./bin/djpatch.js -p xml ./test/fixtures/logo-1.svg /tmp/logo-diff.xml > /tmp/logo-1-patched.svg
```

The file `/tmp/logo-diff.xml` will contain the changes between `logo-1.svg` and
`logo-2.svg` while the file `/tmp/logo-1-patched.svg` will contain the same
contents as `logo-2.svg`.


Running the browser based examples
----------------------------------

In order to build the examples, invoke `make examples`. Run
`node scripts/http.js examples/lcs` in order to start a local webserver for the
LCS example. Then point your browser at http://localhost:3000 in order to
access the LCS web application.

The following examples are available:

* `example/lcs`
  A visualization of Myers Longest Common Subsequence algorithm.
* `example/xcc`
  A web application allowing to step through the XCC tree matching algorithm.
* `example/srcdiff`
  Given two versions of an XML file, this web application will highlight the
  differencies on the XML source code.
* `example/vizmerge/src`
  A web application allowing diffing and selectively merging of changes in XMl
  documents. This demo application also features a live preview where the
  effects of a change are shown in realtime.


Bulding the API reference
-------------------------

In order to build the API reference, the Python Documentation Generatior Sphinx
and the jsdoc toolkit version 2 is required. After invoking `make doc`, the
directory `doc/\_build/html` contains the built documentation in HTML format.

Lincense
--------

This project is licensed under the terms of the MIT license.
