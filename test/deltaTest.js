(function(exports, deltamod, tree){
    /**
     * Fake context generator returning an empty array on every input
     */
    var nullctxgen = {
        'head': function() {return []},
        'tail': function() {return []}
    };

    exports['must not generate any operation for two equal one-node trees'] = function(test) {
        var a = new tree.Node('x');
        var b = new tree.Node('x');
        var delta = new deltamod.Delta();
        var matching = new tree.Matching();
        var updater = deltamod.defaultMatchingUpdater(matching);

        var expect_operations = [];

        // Manually match trees
        matching.put(a, b);

        // Generate patch
        delta.collect(a, matching, nullctxgen, updater);

        test.deepEqual(delta.operations, expect_operations);

        test.done();
    };

    exports['should generate one update operation for two different one-node trees'] = function(test) {
        var a = new tree.Node('x');
        var b = new tree.Node('y');
        var delta = new deltamod.Delta();
        var matching = new tree.Matching();
        var updater = deltamod.defaultMatchingUpdater(matching);

        var expect_operations = [
            new deltamod.Operation(deltamod.UPDATE_TYPE, [], [], [], [a], [b])
        ];

        // Manually match trees
        matching.put(a, b);

        // Generate patch
        delta.collect(a, matching, nullctxgen, updater);

        test.deepEqual(delta.operations, expect_operations);

        test.done();
    };

    exports['should generate one remove operation for consecutive sequence of nodes'] = function(test) {
        var a = new tree.Node();
        var a1 = new tree.Node();
        var a2 = new tree.Node();
        var b = new tree.Node();
        var delta = new deltamod.Delta();
        var matching = new tree.Matching();
        var updater = deltamod.defaultMatchingUpdater(matching);

        var expect_operations = [
            new deltamod.Operation(deltamod.REMOVE_TYPE, [0], [], [], [a1, a2], [])
        ];

        // Manually build tree
        a.append(a1);
        a.append(a2);

        // Manually match trees, b1 and b2 do not have any corresponding nodes
        // in a.
        matching.put(a, b);

        // Generate patch
        delta.collect(a, matching, nullctxgen, updater);

        test.deepEqual(delta.operations, expect_operations);

        test.done();
    };

    exports['should generate one insert operation for consecutive sequence of nodes'] = function(test) {
        var a = new tree.Node();
        var b = new tree.Node();
        var b1 = new tree.Node();
        var b2 = new tree.Node();
        var delta = new deltamod.Delta();
        var matching = new tree.Matching();
        var updater = deltamod.defaultMatchingUpdater(matching);

        var expect_operations = [
            new deltamod.Operation(deltamod.INSERT_TYPE, [0], [], [], [], [b1, b2])
        ];

        // Manually build tree
        b.append(b1);
        b.append(b2);

        // Manually match trees, b1 and b2 do not have any corresponding nodes
        // in a.
        matching.put(a, b);

        // Generate patch
        delta.collect(a, matching, nullctxgen, updater);

        test.deepEqual(delta.operations, expect_operations);

        test.done();
    };
}(
    typeof exports === 'undefined' ? (DeltaJS.deltaTest={}) : exports,
    typeof require === 'undefined' ? (DeltaJS.delta) : require('../lib/delta/delta.js'),
    typeof require === 'undefined' ? (DeltaJS.tree) : require('../lib/delta/tree.js')
));
