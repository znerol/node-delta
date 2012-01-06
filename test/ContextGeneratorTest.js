var deltamod = require('../lib/delta/delta');
var tree = require('../lib/delta/tree');

var r = new tree.Node('r');
var a = new tree.Node('a');
var b = new tree.Node('b');
var c = new tree.Node('c');
var d = new tree.Node('d');

var e = new tree.Node('e');
var f = new tree.Node('f');
var g = new tree.Node('g');

r.append(a);
r.append(b);
r.append(c);
r.append(d);

b.append(e);
b.append(f);
f.append(g);

/**
 * Node index: use document order
 */
var nodeindex = new tree.DocumentOrderIndex(r);
nodeindex.buildAll();

/**
 * Value index: simply return the node value
 */
var valindex = {'get': function(n) {return n && n.value}};


exports['should return empty context when radius is zero'] = function(test) {
    var ctxgen = new deltamod.ContextGenerator(0, nodeindex, valindex);
    var head = ctxgen.head(a);
    var tail = ctxgen.tail(b);

    test.deepEqual(head, []);
    test.deepEqual(tail, []);

    test.done();
};

exports['if radius is 2, head should return 2 nodes up to par'] = function(test) {
    var ctxgen = new deltamod.ContextGenerator(2, nodeindex, valindex);
    var head = ctxgen.head(b);

    test.deepEqual(head, ['r', 'a']);

    test.done();
};

exports['if radius is 2, tail should return 2 nodes following par in docorder'] = function(test) {
    var ctxgen = new deltamod.ContextGenerator(2, nodeindex, valindex);
    var tail = ctxgen.tail(b);

    test.deepEqual(tail, ['e', 'f']);

    test.done();
};

exports['context must be undefined for undefined anchor'] = function(test) {
    var ctxgen = new deltamod.ContextGenerator(2, nodeindex, valindex);
    var head = ctxgen.head(undefined);
    var tail = ctxgen.tail(undefined);

    test.deepEqual(head, [undefined, undefined]);
    test.deepEqual(tail, [undefined, undefined]);

    test.done();
}

exports['head context must not contain root node if root is the anchor'] = function(test) {
    var ctxgen = new deltamod.ContextGenerator(2, nodeindex, valindex);
    var head = ctxgen.head(r);

    test.deepEqual(head, [undefined, undefined]);

    test.done();
}

exports['when deep is true, tail context must begin with the following sibling'] = function(test) {
    var ctxgen = new deltamod.ContextGenerator(2, nodeindex, valindex);
    var tail = ctxgen.tail(b, undefined, true);

    test.deepEqual(tail, ['c', 'd']);

    test.done();
}

exports['tail context must not contain root node if root is the anchor and deep is true'] = function(test) {
    var ctxgen = new deltamod.ContextGenerator(2, nodeindex, valindex);
    var tail = ctxgen.tail(r, undefined, true);

    test.deepEqual(tail, [undefined, undefined]);

    test.done();
}

exports['if radius is 2, head should return 2 nodes up to given index'] = function(test) {
    var ctxgen = new deltamod.ContextGenerator(2, nodeindex, valindex);
    var head = ctxgen.head(r, 1);

    test.deepEqual(head, ['r', 'a']);

    test.done();
};

exports['if radius is 2, tail should return 2 nodes following given index in docorder'] = function(test) {
    var ctxgen = new deltamod.ContextGenerator(2, nodeindex, valindex);
    var tail = ctxgen.tail(r, 1);

    test.deepEqual(tail, ['e', 'f']);

    test.done();
};

exports['when deep is true, tail context must begin with the sibling following index'] = function(test) {
    var ctxgen = new deltamod.ContextGenerator(2, nodeindex, valindex);
    var tail = ctxgen.tail(r, 1, true);

    test.deepEqual(tail, ['c', 'd']);

    test.done();
}

exports['head should end with parent when index is 0'] = function(test) {
    var ctxgen = new deltamod.ContextGenerator(2, nodeindex, valindex);
    var head = ctxgen.head(b, 0);

    test.deepEqual(head, ['a', 'b']);

    test.done();
}

exports['head should end with last node in docorder if index is > children'] = function(test) {
    var ctxgen = new deltamod.ContextGenerator(2, nodeindex, valindex);
    var head = ctxgen.head(b, 2);

    test.deepEqual(head, ['f', 'g']);

    test.done();
}

exports['tail should begin with first child when index is -1'] = function(test) {
    var ctxgen = new deltamod.ContextGenerator(2, nodeindex, valindex);
    var tail = ctxgen.tail(b, -1);

    test.deepEqual(tail, ['e', 'f']);

    test.done();
}

exports['tail should begin with next node in docorder when index is > children'] = function(test) {
    var ctxgen = new deltamod.ContextGenerator(2, nodeindex, valindex);
    var tail = ctxgen.tail(b, 2);
    test.deepEqual(tail, ['c', 'd']);

    tail = ctxgen.tail(b, 2, true);
    test.deepEqual(tail, ['c', 'd']);

    test.done();
}
