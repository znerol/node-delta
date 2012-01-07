var deltamod = require('../lib/delta/delta');
var tree = require('../lib/delta/tree');
var resolver = require('../lib/delta/resolver');

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
        new deltamod.Operation(deltamod.UPDATE_NODE_TYPE, [], [], [], [a], [b])
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
        new deltamod.Operation(deltamod.UPDATE_FOREST_TYPE, [0], [], [], [a1, a2], [])
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
        new deltamod.Operation(deltamod.UPDATE_FOREST_TYPE, [0], [], [], [], [b1, b2])
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

exports['should generate separate operations for non-consecutive siblings'] = function(test) {
    var a = new tree.Node('r');     // match
    var a1 = new tree.Node('a');    // match
    var a2 = new tree.Node('x');    // no match
    var a3 = new tree.Node('b');    // match
    var a4 = new tree.Node('x');    // no match

    var b = new tree.Node('r');     // match
    var b1 = new tree.Node('a');    // match
    var b2 = new tree.Node('y');    // no match
    var b3 = new tree.Node('b');    // match
    var b4 = new tree.Node('y');    // no match

    var delta = new deltamod.Delta();
    var matching = new tree.Matching();
    var updater = deltamod.defaultMatchingUpdater(matching);

    var expect_operations = [
        new deltamod.Operation(deltamod.UPDATE_FOREST_TYPE, [1], [], [], [a2], [b2]),
        new deltamod.Operation(deltamod.UPDATE_FOREST_TYPE, [3], [], [], [a4], [b4])
        ];

    // Manually build tree
    a.append(a1);
    a.append(a2);
    a.append(a3);
    a.append(a4);

    b.append(b1);
    b.append(b2);
    b.append(b3);
    b.append(b4);

    // Manually match trees, b1 and b2 do not have any corresponding nodes
    // in a.
    matching.put(a, b);
    matching.put(a1, b1);
    matching.put(a3, b3);

    // Generate patch
    delta.collect(a, matching, nullctxgen, updater);

    test.deepEqual(delta.operations, expect_operations);

    test.done();
};

exports['should attach one handler for each operation in delta'] = function(test) {
    var a = new tree.Node('r');     // update node op
    var a1 = new tree.Node('a');    // match
    var a2 = new tree.Node('x');    // update forest op
    var a3 = new tree.Node('b');    // match

    // update node op on root
    var b = new tree.Node('p');

    // update forest op on a2
    var b21 = new tree.Node('y');
    var b22 = new tree.Node('z');

    var delta = new deltamod.Delta();
    var dummyresolver = {
        find: function(path) {
                  if (path.length === 0) {
                      return new resolver.ResolverResult(
                              new tree.Anchor(a), [], 0, 1);
                  }
                  else if (path.length === 1 && path[0] === 1) {
                      return new resolver.ResolverResult(
                              new tree.Anchor(a, a2), [], 0, 1);
                  }
                  else {
                      throw new Error('dummyresolver: unexpected path');
                  }
              }
    };

    var testfactory = {
        createNodeUpdateOperationHandler: function(anchor, newnode) {
            test.deepEqual(anchor.target, a);
            test.deepEqual(newnode, b);
        },
        createForestUpdateOperationHandler: function(anchor, length, replacement) {
            test.deepEqual(anchor.base, a);
            test.strictEqual(anchor.index, 1);
            test.strictEqual(length, 1);
            test.deepEqual(replacement, [b21, b22]);
        }
    };

    // Manually build up tree
    a.append(a1);
    a.append(a2);
    a.append(a3);

    // Manually create patch operations
    delta.add(new deltamod.Operation(deltamod.UPDATE_NODE_TYPE, [], [], [], [a], [b]));
    delta.add(new deltamod.Operation(deltamod.UPDATE_FOREST_TYPE, [1], [], [], [a2], [b21, b22]));

    // Test attach-method using the dummyresolver and the testfactory
    delta.attach(dummyresolver, testfactory);

    test.done();
};
