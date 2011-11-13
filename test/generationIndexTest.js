(function(exports, tree) {
    exports['should return same node if offset is zero'] = function(test) {
        var a = new tree.Node();
        var a1 = new tree.Node();
        var a2 = new tree.Node();
        var g = new tree.GenerationIndex(a);
        var result;

        a.append(a1);
        a.append(a2);
        g.buildAll();

        result = g.get(a);
        test.equals(result, a);

        result = g.get(a1);
        test.equals(result, a1);

        result = g.get(a2);
        test.equals(result, a2);

        test.done();
    };

    exports['should return undefined for nodes which are not part of the tree'] = function(test) {
        var a = new tree.Node();
        var b = new tree.Node();
        var g = new tree.GenerationIndex(a);
        var result;

        g.buildAll();

        result = g.get(a);
        test.equals(result, a);

        result = g.get(b);
        test.equals(result, undefined);

        test.done();
    }

    exports['should return correct nodes if offset is specified'] = function(test) {
        var a = new tree.Node();
        var a1 = new tree.Node();
        var a11 = new tree.Node();
        var a2 = new tree.Node();
        var a21 = new tree.Node();
        var a22 = new tree.Node();
        var g = new tree.GenerationIndex(a);

        a.append(a1);
        a1.append(a11);
        a.append(a2);
        a2.append(a21);
        a2.append(a22);

        g.buildAll();

        // Depth = 1
        result = g.get(a1, 0);
        test.equals(result, a1);

        result = g.get(a1, 1);
        test.equals(result, a2);

        result = g.get(a2, 0);
        test.equals(result, a2);

        result = g.get(a2, -1);
        test.equals(result, a1);

        // Depth = 2
        result = g.get(a11, 0);
        test.equals(result, a11);

        result = g.get(a11, 1);
        test.equals(result, a21);

        result = g.get(a11, 2);
        test.equals(result, a22);

        result = g.get(a21, 0);
        test.equals(result, a21);

        result = g.get(a21, -1);
        test.equals(result, a11);

        result = g.get(a21, 1);
        test.equals(result, a22);

        result = g.get(a22, 0);
        test.equals(result, a22);

        result = g.get(a22, -2);
        test.equals(result, a11);

        result = g.get(a22, -1);
        test.equals(result, a21);

        test.done();
    }

    exports['should return undefined if offset is out of tree bounds'] = function(test) {
        var a = new tree.Node();
        var a1 = new tree.Node();
        var a11 = new tree.Node();
        var a2 = new tree.Node();
        var a21 = new tree.Node();
        var a22 = new tree.Node();
        var g = new tree.GenerationIndex(a);

        a.append(a1);
        a1.append(a11);
        a.append(a2);
        a2.append(a21);
        a2.append(a22);

        g.buildAll();

        // Depth = 1
        result = g.get(a1, -1);
        test.equals(result, undefined);

        result = g.get(a1, 2);
        test.equals(result, undefined);

        result = g.get(a2, 1);
        test.equals(result, undefined);

        result = g.get(a2, -2);
        test.equals(result, undefined);

        // Depth = 2
        result = g.get(a11, -1);
        test.equals(result, undefined);

        result = g.get(a11, 3);
        test.equals(result, undefined);

        result = g.get(a21, -2);
        test.equals(result, undefined);

        result = g.get(a21, 2);
        test.equals(result, undefined);

        result = g.get(a22, -3);
        test.equals(result, undefined);

        result = g.get(a22, 1);
        test.equals(result, undefined);

        test.done();
    }

    exports['should return first and last node of a specified generation'] = function(test) {
        var a = new tree.Node();
        var a1 = new tree.Node();
        var a11 = new tree.Node();
        var a2 = new tree.Node();
        var a21 = new tree.Node();
        var a22 = new tree.Node();
        var g = new tree.GenerationIndex(a);

        a.append(a1);
        a1.append(a11);
        a.append(a2);
        a2.append(a21);
        a2.append(a22);

        g.buildAll();

        // Depth = 0
        result = g.first(0);
        test.equals(result, a);

        result = g.last(0);
        test.equals(result, a);

        // Depth = 1
        result = g.first(1);
        test.equals(result, a1);

        result = g.last(1);
        test.equals(result, a2);

        // Depth = 2
        result = g.first(2);
        test.equals(result, a11);

        result = g.last(2);
        test.equals(result, a22);

        test.done();
    }

    exports['should return undefined for first and last if depth is out of bounds'] = function(test) {
        var a = new tree.Node();
        var a1 = new tree.Node();
        var a11 = new tree.Node();
        var a2 = new tree.Node();
        var a21 = new tree.Node();
        var a22 = new tree.Node();
        var g = new tree.GenerationIndex(a);

        a.append(a1);
        a1.append(a11);
        a.append(a2);
        a2.append(a21);
        a2.append(a22);

        g.buildAll();

        // Depth = 3
        result = g.first(3);
        test.equals(result, undefined);

        result = g.last(3);
        test.equals(result, undefined);

        test.done();
    }
}(
    typeof exports === 'undefined' ? (DeltaJS.generationIndexTest={}) : exports,
    typeof require === 'undefined' ? DeltaJS.tree : require('deltajs').tree
));
