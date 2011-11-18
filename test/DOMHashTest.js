(function(exports, domtree, fnv132, platform) {
    var doc = platform.createDocument();

    exports['should calculate correct value for plain element'] = function(test) {
        var domhash = new domtree.DOMHash();
        var hash = new fnv132.Hash();

        var a = doc.createElement('a');

        domhash.process(a, hash);
        test.equals(hash.get(), 0xec585be5);

        test.done();
    };

    exports['should calculate correct value for plain element with attribute'] = function(test) {
        var domhash = new domtree.DOMHash();
        var hash = new fnv132.Hash();

        var b = doc.createElement('b');
        b.setAttribute('class', 'test');

        domhash.process(b, hash);
        test.equals(hash.get(), 0x08f81618);

        test.done();
    };

    exports['must not consider order of attributes'] = function(test) {
        var dh1 = new domtree.DOMHash();
        var dh2 = new domtree.DOMHash();
        var hash1 = new fnv132.Hash();
        var hash2 = new fnv132.Hash();

        var c1 = doc.createElement('c');
        c1.setAttribute('one', '1');
        c1.setAttribute('two', '2');

        var c2 = doc.createElement('c');
        c2.setAttribute('two', '2');
        c2.setAttribute('one', '1');

        dh1.process(c1, hash1);
        dh2.process(c2, hash2);

        test.equals(hash1.get(), hash2.get());

        test.done();
    }

    exports['should return same hash if qualified names are equal'] = function(test) {
        var dh1 = new domtree.DOMHash();
        var dh2 = new domtree.DOMHash();
        var dh3 = new domtree.DOMHash();
        var hash1 = new fnv132.Hash();
        var hash2 = new fnv132.Hash();
        var hash3 = new fnv132.Hash();

        var c1 = doc.createElementNS('urn:test', 'pfx1:c');
        var c2 = doc.createElementNS('urn:test', 'pfx2:c');
        var c3 = doc.createElementNS('urn:test', 'c');

        dh1.process(c1, hash1);
        dh2.process(c2, hash2);
        dh2.process(c3, hash3);

        test.equals(hash1.get(), hash2.get());
        test.equals(hash1.get(), hash3.get());

        test.done();
    }

    exports['should return different hash if namespace uris differ'] = function(test) {
        var dh1 = new domtree.DOMHash();
        var dh2 = new domtree.DOMHash();
        var dh3 = new domtree.DOMHash();
        var hash1 = new fnv132.Hash();
        var hash2 = new fnv132.Hash();
        var hash3 = new fnv132.Hash();

        var c1 = doc.createElementNS('urn:test1', 'pfx:c');
        var c2 = doc.createElementNS('urn:test2', 'pfx:c');
        var c3 = doc.createElementNS('urn:test3', 'c');

        dh1.process(c1, hash1);
        dh2.process(c2, hash2);
        dh2.process(c3, hash3);

        test.notEqual(hash1.get(), hash2.get());
        test.notEqual(hash1.get(), hash3.get());

        test.done();
    }
}(
    typeof exports === 'undefined' ? (DeltaJS.DOMHashTest={}) : exports,
    typeof require === 'undefined' ? DeltaJS.domtree : require('../lib/delta/domtree.js'),
    typeof require === 'undefined' ? DeltaJS.fnv132 : require('../lib/delta/fnv132.js'),
    typeof require === 'undefined' ? DeltaJS.platform : require('../lib/delta/platform.js')
));
