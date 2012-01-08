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
    var matching = new tree.Matching();
    var collector = new deltamod.DeltaCollector(matching, a, b);

    // Manually match trees
    matching.put(a, b);

    // Generate patch
    collector.forEachChange(function(op) {
        throw new Error('Encountered unexpected operation ' + op.toString());
    });

    test.done();
};

exports['should generate one update operation for two different one-node trees'] = function(test) {
    var a = new tree.Node('x');
    var b = new tree.Node('y');
    var matching = new tree.Matching();
    var collector = new deltamod.DeltaCollector(matching, a, b);

    // Manually match trees
    matching.put(a, b);

    var expect_operations = [
        new deltamod.AttachedOperation(new tree.Anchor(a),
                deltamod.UPDATE_NODE_TYPE, [], [a], [b])
        ];
    var actual_operations = [];

    // Generate patch
    collector.forEachChange(function(op) {
        actual_operations.push(op);
    });

    test.deepEqual(actual_operations, expect_operations);

    test.done();
};

exports['should generate one remove operation for consecutive sequence of nodes'] = function(test) {
    var a = new tree.Node('a');
    var a1 = new tree.Node('a1');
    var a2 = new tree.Node('a2');
    var b = new tree.Node('a');
    var matching = new tree.Matching();
    var collector = new deltamod.DeltaCollector(matching, a, b);

    // Manually build tree
    a.append(a1);
    a.append(a2);

    // Manually match trees, b1 and b2 do not have any corresponding nodes
    // in a.
    matching.put(a, b);

    var expect_operations = [
        new deltamod.AttachedOperation(new tree.Anchor(a, a1),
                deltamod.UPDATE_FOREST_TYPE, [0], [a1, a2], [])
        ];
    var actual_operations = [];

    // Generate patch
    collector.forEachChange(function(op) {
        actual_operations.push(op);
    });

    test.deepEqual(actual_operations, expect_operations);

    test.done();
};

exports['should generate one insert operation for consecutive sequence of nodes'] = function(test) {
    var a = new tree.Node();
    var b = new tree.Node();
    var b1 = new tree.Node();
    var b2 = new tree.Node();
    var matching = new tree.Matching();
    var collector = new deltamod.DeltaCollector(matching, a, b);

    // Manually build tree
    b.append(b1);
    b.append(b2);

    // Manually match trees, b1 and b2 do not have any corresponding nodes
    // in a.
    matching.put(a, b);

    var expect_operations = [
        new deltamod.AttachedOperation(new tree.Anchor(a, a, 0),
                deltamod.UPDATE_FOREST_TYPE, [0], [], [b1, b2])
        ];
    var actual_operations = [];

    // Generate patch
    collector.forEachChange(function(op) {
        actual_operations.push(op);
    });

    test.deepEqual(actual_operations, expect_operations);

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

    var matching = new tree.Matching();
    var collector = new deltamod.DeltaCollector(matching, a, b);

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

    var expect_operations = [
        new deltamod.AttachedOperation(new tree.Anchor(a, a2),
                deltamod.UPDATE_FOREST_TYPE, [1], [a2], [b2]),
        new deltamod.AttachedOperation(new tree.Anchor(a, a4),
                deltamod.UPDATE_FOREST_TYPE, [3], [a4], [b4])
        ];
    var actual_operations = [];

    // Generate patch
    collector.forEachChange(function(op) {
        actual_operations.push(op);
    });

    test.deepEqual(actual_operations, expect_operations);

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

    var dummyresolver = {
        find: function(path) {
                  if (path.length === 0) {
                      return new resolver.ResolverResult(new tree.Anchor(a));
                  }
                  else if (path.length === 1 && path[0] === 1) {
                      return new resolver.ResolverResult(
                              new tree.Anchor(a, a2));
                  }
                  else {
                      throw new Error('dummyresolver: unexpected path');
                  }
              }
    };

    var attacher = new deltamod.Attacher(dummyresolver);
    var actual_op;

    // Manually build up tree
    a.append(a1);
    a.append(a2);
    a.append(a3);

    actual_op = attacher.attach({
        'type': deltamod.UPDATE_NODE_TYPE,
        'path': [],
        'remove': [a],
        'insert': [b]
    });
    test.deepEqual(actual_op, new deltamod.AttachedOperation(
                new tree.Anchor(a), deltamod.UPDATE_NODE_TYPE, [], [a], [b]));

    actual_op = attacher.attach({
        'type': deltamod.UPDATE_FOREST_TYPE,
        'path': [1],
        'remove': [a2],
        'insert': [b21, b22]
    });
    test.deepEqual(actual_op, new deltamod.AttachedOperation(
                new tree.Anchor(a, a2), deltamod.UPDATE_FOREST_TYPE, [1], [a2], [b21, b22]));

    test.done();
};
