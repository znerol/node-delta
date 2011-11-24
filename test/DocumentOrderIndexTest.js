(function(exports, tree) {
    // Setup
    var a = new tree.Node();
    var a1 = new tree.Node();
    var a11 = new tree.Node();
    var a2 = new tree.Node();
    var a21 = new tree.Node();
    var a22 = new tree.Node();
    var d = new tree.DocumentOrderIndex(a);

    a.append(a1);
    a1.append(a11);
    a.append(a2);
    a2.append(a21);
    a2.append(a22);

    d.buildAll();

    exports['should return same node if offset is not specified'] = function(test) {
        var result;

        result = d.get(a);
        test.equals(result, a);

        result = d.get(a1);
        test.equals(result, a1);

        result = d.get(a2);
        test.equals(result, a2);

        test.done();
    };

    exports['should return undefined for nodes which are not part of the tree'] = function(test) {
        var b = new tree.Node();
        var result;

        result = d.get(a);
        test.equals(result, a);

        result = d.get(b);
        test.equals(result, undefined);

        test.done();
    }

    exports['should return correct nodes if offset is specified'] = function(test) {
        var result;

        // departing from first node in document
        result = d.get(a, 1);
        test.equals(result, a1);

        result = d.get(a, 2);
        test.equals(result, a11);

        result = d.get(a, 3);
        test.equals(result, a2);

        result = d.get(a, 4);
        test.equals(result, a21);

        result = d.get(a, 5);
        test.equals(result, a22);

        // departing from a leaf-node
        result = d.get(a11, -2);
        test.equals(result, a);

        result = d.get(a11, -1);
        test.equals(result, a1);

        result = d.get(a11, 1);
        test.equals(result, a2);

        result = d.get(a11, 2);
        test.equals(result, a21);

        result = d.get(a11, 3);
        test.equals(result, a22);

        // departing from the last node
        result = d.get(a22, -5);
        test.equals(result, a);

        result = d.get(a22, -4);
        test.equals(result, a1);

        result = d.get(a22, -3);
        test.equals(result, a11);

        result = d.get(a22, -2);
        test.equals(result, a2);

        result = d.get(a22, -1);
        test.equals(result, a21);

        test.done();
    }

    exports['should return undefined if offset is out of tree bounds'] = function(test) {
        var result;

        // departing from first node in document
        result = d.get(a, -1);
        test.equals(result, undefined);

        result = d.get(a, 6);
        test.equals(result, undefined);

        // departing from a leaf-node
        result = d.get(a11, -3);
        test.equals(result, undefined);

        result = d.get(a11, 4);
        test.equals(result, undefined);

        // departing from the last node
        result = d.get(a22, -6);
        test.equals(result, undefined);

        result = d.get(a22, 1);
        test.equals(result, undefined);

        test.done();
    }
}(
    typeof exports === 'undefined' ? (DeltaJS.DocumentOrderIndexTest={}) : exports,
    typeof require === 'undefined' ? DeltaJS.tree : require('../lib/delta/tree.js')
));
