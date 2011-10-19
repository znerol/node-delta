(function(exports, xcc, tree){
    /**
     * Test two trees consisting of only one node each. Node values are equal.
     * Roots must be matched as partners.
     */
    exports.testMatchRootOnlyEqual = function(test) {
        var a = new tree.Node('x');
        var b = new tree.Node('x');
        var diff = new xcc.Diff(a, b);

        diff.matchTrees();

        test.equals(b.partner, a);

        test.done();
    };

    /**
     * Test two trees consisting of only one node each. Node values are not
     * equal. Nevertheless roots must be matched as partners.
     */
    exports.testMatchRootOnlyModified = function(test) {
        var a = new tree.Node('x');
        var b = new tree.Node('y');
        var diff = new xcc.Diff(a, b);

        diff.matchTrees();

        test.equals(b.partner, a);

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

        var diff = new xcc.Diff(a, b);

        diff.matchTrees();

        test.equals(b1.partner, undefined);
        test.equals(b2.partner, a1);

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

        var diff = new xcc.Diff(a, b);

        diff.matchTrees();

        test.equals(b1.partner, undefined);
        test.equals(b2.partner, undefined);

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

        var diff = new xcc.Diff(a, b);

        diff.matchTrees();

        test.equals(b11.partner, a11);
        test.equals(b22.partner, undefined);

        test.done();
    }
}(
    typeof exports === 'undefined' ? (DeltaJS.xccTest={}) : exports,
    typeof require === 'undefined' ? (DeltaJS.xcc) : require('deltajs').xcc,
    typeof require === 'undefined' ? (DeltaJS.tree) : require('deltajs').tree
));
