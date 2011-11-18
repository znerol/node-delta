(function(exports, domtree, fnv132, platform) {
    var doc = platform.createDocument();
    var a = doc.createElement('a');

    var b = doc.createElement('b');
    b.setAttribute('class', 'test');

    exports['should calculate correct value for plain element'] = function(test) {
        var domhash = new domtree.DOMHash();
        var hash = new fnv132.Hash();

        domhash.process(a, hash);
        test.equals(hash.get(), 0xec585be5);

        test.done();
    };

    exports['should calculate correct value for plain element with attribute'] = function(test) {
        var domhash = new domtree.DOMHash();
        var hash = new fnv132.Hash();

        domhash.process(b, hash);
        test.equals(hash.get(), 0x08f81618);

        test.done();
    };
}(
    typeof exports === 'undefined' ? (DeltaJS.DOMHashTest={}) : exports,
    typeof require === 'undefined' ? DeltaJS.domtree : require('../lib/delta/domtree.js'),
    typeof require === 'undefined' ? DeltaJS.fnv132 : require('../lib/delta/fnv132.js'),
    typeof require === 'undefined' ? DeltaJS.platform : require('../lib/delta/platform.js')
));
