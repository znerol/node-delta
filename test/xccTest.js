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
    }

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
    }

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
    }

    /**
     * Tree a and b both have one leave but with different node values.
     * Extended update detection should match them nevertheless.
     */
    exports.testExtendedUpdateDetectionOnSubtrees = function(test) {
        var a = new tree.Node();
        var a1 = new tree.Node();
        var a11 = new tree.Node('x');
        var a12 = new tree.Node('y');
        var b = new tree.Node();
        var b1 = new tree.Node();
        var b11 = new tree.Node('z');
        var b12 = new tree.Node('w');

        a.append(a1);
        a1.append(a11);
        a1.append(a12);
        b.append(b1);
        b1.append(b11);
        b1.append(b12);

        var matching = new tree.Matching();
        var diff = new xcc.Diff(a, b);

        diff.matchTrees(matching);

        test.equals(matching.get(b1), a1);
        test.equals(matching.get(b11), a11);
        test.equals(matching.get(b12), a12);

        test.done();
    }

    /**
     * Results taken from diffing the following xml trees with the original
     * java based xcc implementation:
     *
     * a.xml: <R><A/></R>
     * b.xml: <R><A><X/></A></R>
     */
    exports['leaf update detection should match node when subtree is added'] = function(test) {
        var a = new tree.Node('R');
        var a1 = new tree.Node('A');
        var b = new tree.Node('R');
        var b1 = new tree.Node('A');
        var b11 = new tree.Node('X');

        a.append(a1);
        b.append(b1);
        b1.append(b11);

        var matching = new tree.Matching();
        var diff = new xcc.Diff(a, b);

        diff.matchTrees(matching);

        test.equals(matching.get(b1), a1); // A -> A

        test.done();
    }

    /**
     * Results taken from diffing the following xml trees with the original
     * java based xcc implementation:
     *
     * a.xml: <R><M><A/><B/></M><M><C/><D/></M></R>
     * b.xml: <R><M><Ax/></M><M><Bx/><Cx/></M><M><Dx/></M></R>
     */
    exports['leaf update detection should produce same results like java implementation (1)'] = function(test) {
        var a = new tree.Node('R');
        var a1 = new tree.Node('M');
        var a11 = new tree.Node('A');
        var a12 = new tree.Node('B');
        var a2 = new tree.Node('M');
        var a21 = new tree.Node('C');
        var a22 = new tree.Node('D');
        var b = new tree.Node('R');
        var b1 = new tree.Node('M');
        var b11 = new tree.Node('Ax');
        var b2 = new tree.Node('M');
        var b21 = new tree.Node('Bx');
        var b22 = new tree.Node('Cx');
        var b3 = new tree.Node('M');
        var b31 = new tree.Node('Dx');

        a.append(a1);
        a1.append(a11);
        a1.append(a12);
        a.append(a2);
        a2.append(a21);
        a2.append(a22);

        b.append(b1);
        b1.append(b11);
        b.append(b2);
        b2.append(b21);
        b2.append(b22);
        b.append(b3);
        b3.append(b31);

        var matching = new tree.Matching();
        var diff = new xcc.Diff(a, b);

        diff.matchTrees(matching);

        test.equals(matching.get(b11), a11); // A -> Ax
        test.equals(matching.get(a12), undefined); // delete B
        test.equals(matching.get(b21), a21); // C -> Bx
        test.equals(matching.get(b22), a22); // D -> Cx
        test.equals(matching.get(b31), undefined); // insert Dx

        test.done();
    }


    /**
     * Results taken from diffing the following xml trees with the original
     * java based xcc implementation:
     *
     * a.xml: <R><A/><X/><C/></R>
     * b.xml: <R><Y/><A/><Z/><C/></R>
     */
    exports['leaf update detection should produce same results like java implementation (2)'] = function(test) {
        var a = new tree.Node('R');
        var a1 = new tree.Node('A');
        var a2 = new tree.Node('X');
        var a3 = new tree.Node('C');
        var b = new tree.Node('R');
        var b1 = new tree.Node('Y');
        var b2 = new tree.Node('A');
        var b3 = new tree.Node('Z');
        var b4 = new tree.Node('C');

        a.append(a1);
        a.append(a2);
        a.append(a3);

        b.append(b1);
        b.append(b2);
        b.append(b3);
        b.append(b4);

        var matching = new tree.Matching();
        var diff = new xcc.Diff(a, b);

        diff.matchTrees(matching);

        test.equals(matching.get(b1), undefined); // insert Y
        test.equals(matching.get(b2), a1); // A -> A
        test.equals(matching.get(b3), a2); // X -> Z
        test.equals(matching.get(b4), a3); // C -> C

        test.done();
    }

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
    }

    exports['should generate one update operation for two different one-node trees'] = function(test) {
        var a = new tree.Node('x');
        var b = new tree.Node('y');
        var matching = new tree.Matching();
        var diff = new xcc.Diff(a, b);

        var expect_patch = {'insert': [], 'remove': [], 'update': [[a, b]]};
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
    }

    exports['should generate one remove operation for consecutive sequence of nodes'] = function(test) {
        var a = new tree.Node();
        var a1 = new tree.Node();
        var a2 = new tree.Node();
        var b = new tree.Node();
        var matching = new tree.Matching();
        var diff = new xcc.Diff(a, b);

        var expect_patch = {'insert': [], 'remove': [[a1,a2]], 'update': []};
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
    }

    exports['should generate one insert operation for consecutive sequence of nodes'] = function(test) {
        var a = new tree.Node();
        var b = new tree.Node();
        var b1 = new tree.Node();
        var b2 = new tree.Node();
        var matching = new tree.Matching();
        var diff = new xcc.Diff(a, b);

        var expect_patch = {'insert': [[b1, b2]], 'remove': [], 'update': []};
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
    }
}(
    typeof exports === 'undefined' ? (DeltaJS.xccTest={}) : exports,
    typeof require === 'undefined' ? (DeltaJS.xcc) : require('deltajs').xcc,
    typeof require === 'undefined' ? (DeltaJS.tree) : require('deltajs').tree
));
