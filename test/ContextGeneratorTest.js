var deltamod = require('../lib/delta/delta');
var tree = require('../lib/delta/tree');

var r = new tree.Node('r');
var a = new tree.Node('a');
var b = new tree.Node('b');
var c = new tree.Node('c');
var d = new tree.Node('d');

r.append(a);
r.append(b);
r.append(c);
r.append(d);

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

exports['if radius is 2, head should return 2 nodes up to and including anchor'] = function(test) {
    var ctxgen = new deltamod.ContextGenerator(2, nodeindex, valindex);
    var head = ctxgen.head(b);

    test.deepEqual(head, ['a', 'b']);

    test.done();
};

exports['if radius is 2, tail should return 2 nodes following the anchor'] = function(test) {
    var ctxgen = new deltamod.ContextGenerator(2, nodeindex, valindex);
    var tail = ctxgen.tail(b);

    test.deepEqual(tail, ['c', 'd']);

    test.done();
};

exports['head context must be undefined for undefined anchor'] = function(test) {
    var ctxgen = new deltamod.ContextGenerator(2, nodeindex, valindex);
    var head = ctxgen.head(undefined);

    test.deepEqual(head, [undefined, undefined]);

    test.done();
}

exports['head context must contain root node if root is the anchor'] = function(test) {
    var ctxgen = new deltamod.ContextGenerator(2, nodeindex, valindex);
    var head = ctxgen.head(r);

    test.deepEqual(head, [undefined, 'r']);

    test.done();
}

exports['by default tail context must start with the following sibling'] = function(test) {
    var ctxgen = new deltamod.ContextGenerator(2, nodeindex, valindex);
    var tail = ctxgen.tail(r);

    test.deepEqual(tail, [undefined, undefined]);

    test.done();
}

exports['when flatbody is true, tail context must be nodes following root in docorder'] = function(test) {
    var ctxgen = new deltamod.ContextGenerator(2, nodeindex, valindex);
    var tail = ctxgen.tail(r, true);

    test.deepEqual(tail, ['a', 'b']);

    test.done();
}

exports['should return proper head when anchor falls behind eof'] = function(test) {
    var ctxgen = new deltamod.ContextGenerator(2, nodeindex, valindex);
    var head = ctxgen.head(d);

    test.deepEqual(head, ['c', 'd']);

    test.done();
}
