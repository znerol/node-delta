var tree = require('../lib/delta/tree');
var domtree = require('../lib/delta/domtree');
var fnv132 = require('../lib/delta/fnv132');
var xmlshim = require('xmlshim');
var doc;

exports.setUp = function(callback) {
    doc = xmlshim.implementation.createDocument('', '', null);
    callback();
}

exports['should calculate correct value for plain element'] = function(test) {
    var domhash = new domtree.DOMNodeHash(fnv132.Hash);
    var a = new tree.Node('a', doc.createElementNS(null, 'a'));

    var hash = domhash.process(a);
    test.equals(hash, 0xec585be5);

    test.done();
};

exports['should calculate correct value for plain element with attribute'] = function(test) {
    var domhash = new domtree.DOMNodeHash(fnv132.Hash);
    var b = new tree.Node('b', doc.createElementNS(null, 'b'));
    b.data.setAttribute('class', 'test');

    var hash = domhash.process(b);
    test.equals(hash, 0x08f81618);

    test.done();
};

exports['must not consider order of attributes'] = function(test) {
    var dh1 = new domtree.DOMNodeHash();
    var dh2 = new domtree.DOMNodeHash();
    var hash1 = new fnv132.Hash();
    var hash2 = new fnv132.Hash();

    var c1 = doc.createElementNS(null, 'c');
    c1.setAttribute('one', '1');
    c1.setAttribute('two', '2');

    var c2 = doc.createElementNS(null, 'c');
    c2.setAttribute('two', '2');
    c2.setAttribute('one', '1');

    dh1.processElement(c1, hash1);
    dh2.processElement(c2, hash2);

    test.equals(hash1.get(), hash2.get());

    test.done();
}

exports['should return same hash if qualified element names are equal'] = function(test) {
    var dh1 = new domtree.DOMNodeHash();
    var dh2 = new domtree.DOMNodeHash();
    var dh3 = new domtree.DOMNodeHash();
    var dh4 = new domtree.DOMNodeHash();
    var hash1 = new fnv132.Hash();
    var hash2 = new fnv132.Hash();
    var hash3 = new fnv132.Hash();
    var hash4 = new fnv132.Hash();

    var c1 = doc.createElementNS('urn:test', 'pfx1:c');
    var c2 = doc.createElementNS('urn:test', 'pfx2:c');
    var c3 = doc.createElementNS('urn:test', 'c');
    var c4 = doc.createElementNS(null, 'c');

    dh1.processElement(c1, hash1);
    dh2.processElement(c2, hash2);
    dh3.processElement(c3, hash3);
    dh4.processElement(c3, hash4);

    test.equals(hash1.get(), hash2.get());
    test.equals(hash1.get(), hash3.get());
    test.equals(hash1.get(), hash4.get());

    test.done();
}

exports['should return different hash if element namespace uris differ'] = function(test) {
    var dh1 = new domtree.DOMNodeHash();
    var dh2 = new domtree.DOMNodeHash();
    var dh3 = new domtree.DOMNodeHash();
    var hash1 = new fnv132.Hash();
    var hash2 = new fnv132.Hash();
    var hash3 = new fnv132.Hash();

    var c1 = doc.createElementNS('urn:test1', 'pfx:c');
    var c2 = doc.createElementNS('urn:test2', 'pfx:c');
    var c3 = doc.createElementNS('urn:test3', 'c');

    dh1.processElement(c1, hash1);
    dh2.processElement(c2, hash2);
    dh2.processElement(c3, hash3);

    test.notEqual(hash1.get(), hash2.get());
    test.notEqual(hash1.get(), hash3.get());

    test.done();
}

exports['should return same hash if qualified attribute names are equal'] = function(test) {
    var dh1 = new domtree.DOMNodeHash();
    var dh2 = new domtree.DOMNodeHash();
    var dh3 = new domtree.DOMNodeHash();
    var hash1 = new fnv132.Hash();
    var hash2 = new fnv132.Hash();
    var hash3 = new fnv132.Hash();

    var c1 = doc.createAttributeNS('urn:test', 'pfx1:c');
    var c2 = doc.createAttributeNS('urn:test', 'pfx2:c');
    var c3 = doc.createAttributeNS('urn:test', 'c');

    dh1.processAttribute(c1, hash1);
    dh2.processAttribute(c2, hash2);
    dh2.processAttribute(c3, hash3);

    test.equals(hash1.get(), hash2.get());
    test.equals(hash1.get(), hash3.get());

    test.done();
}


exports['should return different hash if attribute namespace uris differ'] = function(test) {
    var dh1 = new domtree.DOMNodeHash();
    var dh2 = new domtree.DOMNodeHash();
    var dh3 = new domtree.DOMNodeHash();
    var dh4 = new domtree.DOMNodeHash();
    var hash1 = new fnv132.Hash();
    var hash2 = new fnv132.Hash();
    var hash3 = new fnv132.Hash();
    var hash4 = new fnv132.Hash();

    var c1 = doc.createAttributeNS('urn:test1', 'pfx:c');
    var c2 = doc.createAttributeNS('urn:test2', 'pfx:c');
    var c3 = doc.createAttributeNS('urn:test3', 'c');
    var c4 = doc.createAttribute('c');

    dh1.processAttribute(c1, hash1);
    dh2.processAttribute(c2, hash2);
    dh3.processAttribute(c3, hash3);
    dh4.processAttribute(c3, hash4);

    test.notEqual(hash1.get(), hash2.get());
    test.notEqual(hash1.get(), hash3.get());
    test.notEqual(hash1.get(), hash4.get());

    test.done();
}


exports['should return same hash for equal texts'] = function(test) {
    var dh1 = new domtree.DOMNodeHash();
    var dh2 = new domtree.DOMNodeHash();
    var hash1 = new fnv132.Hash();
    var hash2 = new fnv132.Hash();

    var c1 = doc.createTextNode('thanks for the fish');
    var c2 = doc.createTextNode('thanks for the fish');

    dh1.processText(c1, hash1);
    dh2.processText(c2, hash2);

    test.equals(hash1.get(), hash2.get());

    test.done();
}


exports['should return different hash for non-equal texts'] = function(test) {
    var dh1 = new domtree.DOMNodeHash();
    var dh2 = new domtree.DOMNodeHash();
    var hash1 = new fnv132.Hash();
    var hash2 = new fnv132.Hash();

    var c1 = doc.createTextNode('thanks for the fish');
    var c2 = doc.createTextNode('Thanks for the fish');

    dh1.processText(c1, hash1);
    dh2.processText(c2, hash2);

    test.notEqual(hash1.get(), hash2.get());

    test.done();
}
