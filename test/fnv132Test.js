(function(exports, fnv132){

    exports.testFNVHashEmptyString = function(test) {
        hash = new fnv132.Hash();
        result = hash.update();

        test.strictEqual(result, 0x811c9dc5, "fnv132 of an empty string should be 0x811c9dc5");
        test.done();
    };

    exports.testFNVHashShortString = function(test) {
        hash = new fnv132.Hash();
        result = hash.update('test');

        test.strictEqual(result, 0xbc2c0be9, "fnv132 of the string 'test' should be 0xbc2c0be9");
        test.done();
    };

}(
    typeof exports === 'undefined' ? (DeltaJS.fnv132Test={}) : exports,
    typeof require === 'undefined' ? DeltaJS.fnv132 : require('deltajs').fnv132
));
