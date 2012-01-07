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
    test.equal(result.isComplete(), true);
    test.deepEqual(result.getTarget(), a);

    test.done();
};

exports['should resolve to correct node if path exists'] = function(test) {
    var result;

    result = r.resolve([0]);
    test.equal(result.isComplete(), true);
    test.deepEqual(result.getTarget(), a1);

    result = r.resolve([0, 0]);
    test.equal(result.isComplete(), true);
    test.deepEqual(result.getTarget(), a11);

    result = r.resolve([1]);
    test.equal(result.isComplete(), true);
    test.deepEqual(result.getTarget(), a2);

    result = r.resolve([1, 0]);
    test.equal(result.isComplete(), true);
    test.deepEqual(result.getTarget(), a21);

    result = r.resolve([1, 1]);
    test.equal(result.isComplete(), true);
    test.deepEqual(result.getTarget(), a22);

    test.done();
};

exports['should resolve to anchor if leaf does not exist'] = function(test) {
    var result;

    result = r.resolve([-1]);
    test.equal(result.isComplete(), true);
    test.equal(result.getTarget(), undefined);
    test.equal(result.getAnchor(), a);
    test.equal(result.getTargetIndex(), -1);

    result = r.resolve([2]);
    test.equal(result.isComplete(), true);
    test.equal(result.getTarget(), undefined);
    test.equal(result.getAnchor(), a);
    test.equal(result.getTargetIndex(), 2);

    result = r.resolve([0, -1]);
    test.equal(result.isComplete(), true);
    test.equal(result.getTarget(), undefined);
    test.equal(result.getAnchor(), a1);
    test.equal(result.getTargetIndex(), -1);

    result = r.resolve([0, 0, 1]);
    test.equal(result.isComplete(), true);
    test.equal(result.getTarget(), undefined);
    test.equal(result.getAnchor(), a11);
    test.equal(result.getTargetIndex(), 1);

    result = r.resolve([0, 1]);
    test.equal(result.isComplete(), true);
    test.equal(result.getTarget(), undefined);
    test.equal(result.getAnchor(), a1);
    test.equal(result.getTargetIndex(), 1);

    test.done();
};

exports['should report failure if path is not resolvable'] = function(test) {
    var result;

    result = r.resolve([0, 3, 5, 0, 1]);
    test.equal(result.isComplete(), false);
    test.equal(result.getTarget(), undefined);
    test.equal(result.getAnchor(), undefined);

    test.done();
};
