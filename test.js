#!/usr/bin/env node
var reporter = require('nodeunit').reporters.default;
var options = null
reporter.run(['test'], options, function(err) {
    process.exit(err ? 1 : 0);
});
