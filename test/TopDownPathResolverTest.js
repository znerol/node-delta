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
    test.deepEqual(result, {'node':a, 'tail':[]});

    test.done();
};

exports['should resolve to correct node if path exists'] = function(test) {
    var result;

    result = r.resolve([0]);
    test.deepEqual(result, {'node': a, 'tail':[0]});

    result = r.resolve([0, 0]);
    test.deepEqual(result, {'node': a1, 'tail':[0]});

    result = r.resolve([1]);
    test.deepEqual(result, {'node': a, 'tail':[1]});

    result = r.resolve([1, 0]);
    test.deepEqual(result, {'node': a2, 'tail':[0]});

    result = r.resolve([1, 1]);
    test.deepEqual(result, {'node': a2, 'tail':[1]});

    test.done();
};

exports['should resolve to deepest matching node if path does not exist'] = function(test) {
    var result;

    result = r.resolve([-1]);
    test.deepEqual(result, {'node':a, 'tail':[-1]});

    result = r.resolve([2]);
    test.deepEqual(result, {'node':a, 'tail':[2]});

    result = r.resolve([0, -1]);
    test.deepEqual(result, {'node': a1, 'tail':[-1]});

    result = r.resolve([0, 0, 1]);
    test.deepEqual(result, {'node': a11, 'tail':[1]});

    result = r.resolve([0, 1]);
    test.deepEqual(result, {'node': a1, 'tail':[1]});

    test.done();
};

exports['tail should contain the whole unresolvable path'] = function(test) {
    var result;

    result = r.resolve([0, 3, 5, 0, 1]);
    test.deepEqual(result, {'node': a1, 'tail': [3, 5, 0, 1]});

    test.done();
};
