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
    var head = ctxgen.head(a, 0);
    var tail = ctxgen.tail(b, 0);

    test.deepEqual(head, []);
    test.deepEqual(tail, []);

    test.done();
};

exports['if radius is 2, head should return 2 nodes including the anchor'] = function(test) {
    var ctxgen = new deltamod.ContextGenerator(2, nodeindex, valindex);
    var head = ctxgen.head(b, 0);

    test.deepEqual(head, ['a', 'b']);

    test.done();
};

exports['if radius is 2, tail should return 2 nodes following the anchor'] = function(test) {
    var ctxgen = new deltamod.ContextGenerator(2, nodeindex, valindex);
    var tail = ctxgen.tail(b, 0);

    test.deepEqual(tail, ['c', 'd']);

    test.done();
};
