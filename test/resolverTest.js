(function(exports, resolver, tree) {
    exports['should resolve 0-depth path to reference node'] = function(test) {
        var a = new tree.Node();
        var r = new resolver.UniformDepthResolver();
        var generation = [];
        var best = r.resolvePath(a, [], generation);

        test.equals(best.node, a);
        test.equals(generation[0], a);
        test.equals(best.index, 0);
        test.done();
    };

    exports['should resolve perfect path with depth 1'] = function(test) {
        var a = new tree.Node();
        var a1 = new tree.Node();
        var r = new resolver.UniformDepthResolver();
        var generation = [];
        var best;

        a.append(a1);
        best = r.resolvePath(a, [0], generation);

        test.equals(best.node, a1);
        test.equals(generation[0], a1);
        test.equals(best.index, 0);
        test.done();
    };

    exports['should not resolve path with depth 1 if there are no nodes with depth 1'] = function(test) {
        var a = new tree.Node();
        var r = new resolver.UniformDepthResolver();
        var generation = [];
        var best = r.resolvePath(a, [0], generation);

        test.equals(best, undefined);
        test.equals(generation.length, 0);
        test.done();
    };

    exports['should resolve perfect path with depth 2'] = function(test) {
        var a = new tree.Node();
        var a1 = new tree.Node();
        var a2 = new tree.Node();
        var r = new resolver.UniformDepthResolver();
        var generation = [];
        var best;

        a.append(a1);
        a1.append(a2);
        best = r.resolvePath(a, [0,0], generation);

        test.equals(best.node, a2);
        test.equals(generation[0], a2);
        test.equals(best.index, 0);
        test.done();
    };

    exports['should not resolve path with depth 2 if there are no nodes with depth 2'] = function(test) {
        var a = new tree.Node();
        var a1 = new tree.Node();
        var r = new resolver.UniformDepthResolver();
        var generation = [];
        var best;

        a.append(a1);
        best = r.resolvePath(a, [0,0], generation);

        test.equals(best, undefined);
        test.equals(generation.length, 0);
        test.done();
    };

    exports['too big path components should fallback to nearest node in same generation'] = function(test) {
        var a = new tree.Node();
        var a1 = new tree.Node();
        var a2 = new tree.Node();
        var r = new resolver.UniformDepthResolver();
        var generation = [];
        var best;

        a.append(a1);
        a1.append(a2);
        best = r.resolvePath(a, [1,0], generation);

        test.equals(best.node, a2);
        test.equals(generation[0], a2);
        test.equals(best.index, 0);

        best = r.resolvePath(a, [0,1], generation);
        test.equals(best.node, a2);

        best = r.resolvePath(a, [1,1], generation);
        test.equals(best.node, a2);

        test.done();
    };

    exports['too small path components should fallback to nearest node in same generation'] = function(test) {
        var a = new tree.Node();
        var a1 = new tree.Node();
        var b1 = new tree.Node();
        var b2 = new tree.Node();
        var r = new resolver.UniformDepthResolver();
        var generation = [];
        var best;

        a.append(a1);
        a.append(b1);
        b1.append(b2);
        best = r.resolvePath(a, [0,0], generation);

        test.equals(best.node, b2);
        test.equals(generation[0], b2);
        test.equals(best.index, 0);
        test.done();
    };

    exports['should pick nearest node in same generation'] = function(test) {
        var a = new tree.Node();
        var a1 = new tree.Node();
        var a2 = new tree.Node();
        var a21 = new tree.Node();
        var a22 = new tree.Node();
        var r = new resolver.UniformDepthResolver();
        var generation = [];
        var best;

        a.append(a1);
        a.append(a2);
        a2.append(a21);
        a2.append(a22);

        best = r.resolvePath(a, [0, 1], generation);

        test.equals(best.node, a21);
        test.equals(generation[0], a21);
        test.equals(best.index, 0);
        test.done();
    };

    exports['generation should contain all nodes with the requested depth'] = function(test) {
        var a = new tree.Node();
        var a1 = new tree.Node();
        var a11 = new tree.Node();
        var a2 = new tree.Node();
        var a21 = new tree.Node();
        var a22 = new tree.Node();
        var a221 = new tree.Node();
        var a222 = new tree.Node();
        var a23 = new tree.Node();
        var a3 = new tree.Node();
        var a31 = new tree.Node();
        var a311 = new tree.Node();
        var a4 = new tree.Node();
        var a41 = new tree.Node();
        var r = new resolver.UniformDepthResolver();
        var generation = [];
        var best;
        var expect_generation = [a11, a21, a22, a23, a31, a41];
        var expect_index = 4;
        var expect_node = a31;

        a.append(a1);
        a1.append(a11);
        a.append(a2);
        a2.append(a21);
        a2.append(a22);
        a22.append(a221);
        a22.append(a222);
        a2.append(a23);
        a.append(a3);
        a3.append(a31);
        a31.append(a311);
        a.append(a4);
        a4.append(a41);

        best = r.resolvePath(a, [2, 0], generation);

        test.equals(best.node, expect_node);
        test.equals(best.index, expect_index);
        test.equals(generation[best.index], expect_node);
        test.deepEqual(generation, expect_generation);

        test.done();
    };
}(
    typeof exports === 'undefined' ? (DeltaJS.resolverTest ={}) : exports,
    typeof require === 'undefined' ? DeltaJS.resolver : require('deltajs').resolver,
    typeof require === 'undefined' ? DeltaJS.tree : require('deltajs').tree
));
