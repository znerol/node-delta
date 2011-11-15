(function(exports, xcc, tree){
    /**
     * Test two trees consisting of only one node each. Node values are equal.
     * Roots must be matched as partners.
     */
    exports.testMatchRootOnlyEqual = function(test) {
        var a = new tree.Node('x');
        var b = new tree.Node('x');
        var matching = new tree.Matching();
        var diff = new xcc.Diff(a, b);

        diff.matchTrees(matching);

        test.equals(matching.get(b), a);

        test.done();
    };

    /**
     * Test two trees consisting of only one node each. Node values are not
     * equal. Nevertheless roots must be matched as partners.
     */
    exports.testMatchRootOnlyModified = function(test) {
        var a = new tree.Node('x');
        var b = new tree.Node('y');
        var matching = new tree.Matching();
        var diff = new xcc.Diff(a, b);

        diff.matchTrees(matching);

        test.equals(matching.get(b), a);

        test.done();
    };

    /**
     * Test two trees, tree a having one leave (a1=y), tree b having two leaves
     * (b1=z, b2=y). Ensure that b1 is not matched and b2 is matched to a1.
     */
    exports.testMatchLeaves = function(test) {
        var a = new tree.Node();
        var a1 = new tree.Node('y');
        var b = new tree.Node();
        var b1 = new tree.Node('z');
        var b2 = new tree.Node('y');

        a.append(a1);
        b.append(b1);
        b.append(b2);

        var matching = new tree.Matching();
        var diff = new xcc.Diff(a, b);

        diff.matchTrees(matching);

        test.equals(matching.get(b1), undefined);
        test.equals(matching.get(b2), a1);

        test.done();
    };

    /**
     * Tree a has one leave (a1=x) at depth=1 and tree b has one leave (b2=x)
     * at depth=2. Ensure that those leaves are not matched because of
     * different depth and despite of same values.
     */
    exports.testNoMatchForLeavesWhenDepthIsDifferent = function(test) {
        var a = new tree.Node();
        var a1 = new tree.Node('x');
        var b = new tree.Node();
        var b1 = new tree.Node();
        var b2 = new tree.Node('x');

        a.append(a1);
        b.append(b1);
        b1.append(b2);

        var matching = new tree.Matching();
        var diff = new xcc.Diff(a, b);

        diff.matchTrees(matching);

        test.equals(matching.get(b1), undefined);
        test.equals(matching.get(b2), undefined);

        test.done();
    };

    /**
     * Tree a has two leaves (a11=x, a12=y) at depth=2 an tree b has two leaves
     * (b11=x, b22=y) at depth=2 but with separate parents. Ensure that a2 and
     * b2 are not matched because their parents are not matched either.
     */
    exports.testNoMatchForLeavesOnDifferentBranches = function(test) {
        var a = new tree.Node();
        var a1 = new tree.Node();
        var a11 = new tree.Node('x');
        var a12 = new tree.Node('y');
        var b = new tree.Node();
        var b1 = new tree.Node();
        var b2 = new tree.Node();
        var b11 = new tree.Node('x');
        var b22 = new tree.Node('y');

        a.append(a1);
        a1.append(a11);
        a1.append(a12);
        b.append(b1);
        b.append(b2);
        b1.append(b11);
        b2.append(b22);

        var matching = new tree.Matching();
        var diff = new xcc.Diff(a, b);

        diff.matchTrees(matching);

        test.equals(matching.get(b11), a11);
        test.equals(matching.get(b22), undefined);

        test.done();
    };

    /**
     * Tree a and b both have one leave but with different node values.
     * Extended update detection should match them nevertheless.
     */
    exports.testExtendedUpdateDetectionOnLeaveNodes = function(test) {
        var a = new tree.Node();
        var b = new tree.Node();
        var a1 = new tree.Node('x');
        var b1 = new tree.Node('y');

        a.append(a1);
        b.append(b1);

        var matching = new tree.Matching();
        var diff = new xcc.Diff(a, b);

        diff.matchTrees(matching);

        test.equals(matching.get(b1), a1);

        test.done();
    };


    exports['must not generate any operation for two equal one-node trees'] = function(test) {
        var a = new tree.Node('x');
        var b = new tree.Node('x');
        var matching = new tree.Matching();
        var diff = new xcc.Diff(a, b);

        var expect_patch = {'insert': [], 'remove': [], 'update': []};
        var actual_patch = {'insert': [], 'remove': [], 'update': []};
        var editor = {
            'insert': function(nodes) {
                actual_patch.insert.push(nodes);
            },
            'remove': function(nodes) {
                actual_patch.remove.push(nodes);
            },
            'update': function(o, n) {
                actual_patch.update.push([o, n]);
            }
        };

        // Manually match trees
        matching.put(a, b);

        // Generate patch
        diff.generatePatch(matching, editor);

        test.deepEqual(actual_patch, expect_patch);

        test.done();
    };

    exports['should generate one update operation for two different one-node trees'] = function(test) {
        var a = new tree.Node('x');
        var b = new tree.Node('y');
        var matching = new tree.Matching();
        var diff = new xcc.Diff(a, b);

        var expect_patch = {'insert': [], 'remove': [], 'update': [[[], a, b]]};
        var actual_patch = {'insert': [], 'remove': [], 'update': []};
        var editor = {
            'insert': function(path, nodes) {
                actual_patch.insert.push([path, nodes]);
            },
            'remove': function(path, nodes) {
                actual_patch.remove.push([path, nodes]);
            },
            'update': function(path, o, n) {
                actual_patch.update.push([path, o, n]);
            }
        };

        // Manually match trees
        matching.put(a, b);

        // Generate patch
        diff.generatePatch(matching, editor);

        test.deepEqual(actual_patch, expect_patch);

        test.done();
    };

    exports['should generate one remove operation for consecutive sequence of nodes'] = function(test) {
        var a = new tree.Node();
        var a1 = new tree.Node();
        var a2 = new tree.Node();
        var b = new tree.Node();
        var matching = new tree.Matching();
        var diff = new xcc.Diff(a, b);

        var expect_patch = {'insert': [], 'remove': [[[0], [a1, a2]]], 'update': []};
        var actual_patch = {'insert': [], 'remove': [], 'update': []};
        var editor = {
            'insert': function(path, nodes) {
                actual_patch.insert.push([path, nodes]);
            },
            'remove': function(path, nodes) {
                actual_patch.remove.push([path, nodes]);
            },
            'update': function(path, o, n) {
                actual_patch.update.push([path, o, n]);
            }
        };

        // Manually build tree
        a.append(a1);
        a.append(a2);

        // Manually match trees, b1 and b2 do not have any corresponding nodes
        // in a.
        matching.put(a, b);

        // Generate patch
        diff.generatePatch(matching, editor);

        test.deepEqual(actual_patch, expect_patch);

        test.done();
    };

    exports['should generate one insert operation for consecutive sequence of nodes'] = function(test) {
        var a = new tree.Node();
        var b = new tree.Node();
        var b1 = new tree.Node();
        var b2 = new tree.Node();
        var matching = new tree.Matching();
        var diff = new xcc.Diff(a, b);

        var expect_patch = {'insert': [[[0], [b1, b2]]], 'remove': [], 'update': []};
        var actual_patch = {'insert': [], 'remove': [], 'update': []};
        var editor = {
            'insert': function(path, nodes) {
                actual_patch.insert.push([path, nodes]);
            },
            'remove': function(path, nodes) {
                actual_patch.remove.push([path, nodes]);
            },
            'update': function(path, o, n) {
                actual_patch.update.push([path, o, n]);
            }
        };

        // Manually build tree
        b.append(b1);
        b.append(b2);

        // Manually match trees, b1 and b2 do not have any corresponding nodes
        // in a.
        matching.put(a, b);

        // Generate patch
        diff.generatePatch(matching, editor);

        test.deepEqual(actual_patch, expect_patch);

        test.done();
    };
}(
    typeof exports === 'undefined' ? (DeltaJS.xccTest={}) : exports,
    typeof require === 'undefined' ? (DeltaJS.xcc) : require('deltajs').xcc,
    typeof require === 'undefined' ? (DeltaJS.tree) : require('deltajs').tree
));
