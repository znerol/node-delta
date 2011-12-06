var fnv132 = require('../lib/delta/fnv132');

exports['should return expected value for empty string'] = function(test) {
    var hash = new fnv132.Hash();
    var result = hash.update();

    test.strictEqual(result, 0x811c9dc5, "fnv132 of an empty string should be 0x811c9dc5");
    test.done();
};

exports['should return expected value for short string'] = function(test) {
    var hash = new fnv132.Hash();
    var result = hash.update('test');

    test.strictEqual(result, 0xbc2c0be9, "fnv132 of the string 'test' should be 0xbc2c0be9");
    test.done();
};

exports['should return hash value if subject is null or undefined'] = function(test) {
    var hash = new fnv132.Hash();
    var result1 = hash.update('test');
    var result2 = hash.update();
    var result3 = hash.update(undefined);
    var result4 = hash.update(null);

    test.equal(result1, result2);
    test.equal(result1, result3);
    test.equal(result1, result4);
    test.equal(result2, result3);
    test.equal(result2, result4);
    test.equal(result3, result4);

    test.done();
}

exports['should convert numbers to byte-strings before calculating the hash value'] = function(test) {
    var hash1 = new fnv132.Hash();
    var hash2 = new fnv132.Hash();
    var result1 = hash1.update('ABCD');
    var result2 = hash2.update(0x41424344);

    test.equal(result1, result2);

    test.done();
}

exports['should throw an exception for unsupported types'] = function(test) {
    var hash = new fnv132.Hash();

    // should throw exception for objects
    test.throws(function() {
        hash.update({});
    });

    // should throw exception for arrays
    test.throws(function() {
        hash.update([]);
    });

    // should throw exception for booleans
    test.throws(function() {
        hash.update(true);
    });
    test.throws(function() {
        hash.update(false);
    });

    // should throw exception for regex
    test.throws(function() {
        hash.update(/^/);
    });

    test.done();
}
