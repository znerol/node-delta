var resolver = require('../lib/delta/resolver');
var tree = require('../lib/delta/tree');

// Setup
var a = new tree.Node('a');
var a1 = new tree.Node('a1');
var a11 = new tree.Node('a11');
var a2 = new tree.Node('a2');
var a21 = new tree.Node('a21');
var a22 = new tree.Node('a22');
var r = new resolver.TopDownPathResolver(a);

a.append(a1);
a1.append(a11);
a.append(a2);
a2.append(a21);
a2.append(a22);

exports['should resolve to root node if path is empty'] = function(test) {
    var result;

    result = r.resolve([]);
    test.equal(result.tail.length, 0);
    test.deepEqual(result.anchor.target, a);

    test.done();
};

exports['should resolve to correct node if path exists'] = function(test) {
    var result;

    result = r.resolve([0]);
    test.equal(result.tail.length, 0);
    test.deepEqual(result.anchor.target, a1);

    result = r.resolve([0, 0]);
    test.equal(result.tail.length, 0);
    test.deepEqual(result.anchor.target, a11);

    result = r.resolve([1]);
    test.equal(result.tail.length, 0);
    test.deepEqual(result.anchor.target, a2);

    result = r.resolve([1, 0]);
    test.equal(result.tail.length, 0);
    test.deepEqual(result.anchor.target, a21);

    result = r.resolve([1, 1]);
    test.equal(result.tail.length, 0);
    test.deepEqual(result.anchor.target, a22);

    test.done();
};

exports['should resolve to anchor if leaf does not exist'] = function(test) {
    var result;

    result = r.resolve([-1]);
    test.equal(result.tail.length, 0);
    test.equal(result.anchor.target, undefined);
    test.equal(result.anchor.base, a);
    test.equal(result.anchor.index, -1);

    result = r.resolve([2]);
    test.equal(result.tail.length, 0);
    test.equal(result.anchor.target, undefined);
    test.equal(result.anchor.base, a);
    test.equal(result.anchor.index, 2);

    result = r.resolve([0, -1]);
    test.equal(result.tail.length, 0);
    test.equal(result.anchor.target, undefined);
    test.equal(result.anchor.base, a1);
    test.equal(result.anchor.index, -1);

    result = r.resolve([0, 0, 1]);
    test.equal(result.tail.length, 0);
    test.equal(result.anchor.target, undefined);
    test.equal(result.anchor.base, a11);
    test.equal(result.anchor.index, 1);

    result = r.resolve([0, 1]);
    test.equal(result.tail.length, 0);
    test.equal(result.anchor.target, undefined);
    test.equal(result.anchor.base, a1);
    test.equal(result.anchor.index, 1);

    test.done();
};

exports['should resolve as far as possible and report unresolvable part of path in tail'] = function(test) {
    var result;

    result = r.resolve([0, 3, 5, 0, 1]);
    test.deepEqual(result.tail, [5, 0, 1]);
    test.equal(result.anchor.target, undefined);
    test.equal(result.anchor.base, a1);
    test.equal(result.anchor.index, 3);

    test.done();
};
