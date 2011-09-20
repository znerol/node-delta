var deltajs = require('../lib/delta.js');

exports.testFNVHashEmptyString = function(test) {
    hash = new deltajs.fnv132.Hash();
    result = hash.update();

    test.strictEqual(result, 0x811c9dc5, "fnv132 of an empty string should be 0x811c9dc5");
    test.done();
}

exports.testFNVHashShortString = function(test) {
    hash = new deltajs.fnv132.Hash();
    result = hash.update('test');

    test.strictEqual(result, 0xbc2c0be9, "fnv132 of the string 'test' should be 0xbc2c0be9");
    test.done();
}
