(function(exports, resolver, tree) {
    // Setup
    var a = new tree.Node();
    var a1 = new tree.Node();
    var a11 = new tree.Node();
    var a2 = new tree.Node();
    var a21 = new tree.Node();
    var a22 = new tree.Node();
    var r = new resolver.TopDownPathResolver(a);

    a.append(a1);
    a1.append(a11);
    a.append(a2);
    a2.append(a21);
    a2.append(a22);

    exports['should resolve to root node if path is empty'] = function(test) {
        var result;

        result = r.resolve([]);
        test.deepEqual(result, [a]);

        test.done();
    };

    exports['should resolve to correct node if path exists'] = function(test) {
        var result;

        result = r.resolve([0]);
        test.deepEqual(result, [a, a1]);

        result = r.resolve([0, 0]);
        test.deepEqual(result, [a, a1, a11]);

        result = r.resolve([1]);
        test.deepEqual(result, [a, a2]);

        result = r.resolve([1, 0]);
        test.deepEqual(result, [a, a2, a21]);

        result = r.resolve([1, 1]);
        test.deepEqual(result, [a, a2, a22]);

        test.done();
    };

    exports['should resolve to deepest matching node if path does not exist'] = function(test) {
        var result;

        result = r.resolve([-1]);
        test.deepEqual(result, [a]);

        result = r.resolve([2]);
        test.deepEqual(result, [a]);

        result = r.resolve([0, -1]);
        test.deepEqual(result, [a, a1]);

        result = r.resolve([0, 0, 1]);
        test.deepEqual(result, [a, a1, a11]);

        result = r.resolve([0, 1]);
        test.deepEqual(result, [a, a1]);

        test.done();
    };
}(
    typeof exports === 'undefined' ? (DeltaJS.TopDownPathResolverTest={}) : exports,
    typeof require === 'undefined' ? DeltaJS.resolver : require('../lib/delta/resolver.js'),
    typeof require === 'undefined' ? DeltaJS.tree : require('../lib/delta/tree.js')
));
