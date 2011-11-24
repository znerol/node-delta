var browserify = require('browserify');
var b = browserify({
    "entry": "test/browserify-entry.js"
});

var fs = require('fs');
fs.writeFileSync('dist/browser-test/deltajs-test.js', b.bundle(), 'UTF-8');

console.log('Successfully browserified deltajs test suite.');
console.log('You may now run the tests by pointing your browser at dist/browser-test/test.html');
