var resolver = require('deltajs').resolver;
var tree = require('deltajs').tree;

//     ------------ a ------------
//   /            /        \       \
//  a1          a2          a3      a4
//  |         /  |  \       |       |
//  a11    a21  a22  a23    a31     a41
//              / \         |
//          a221   a222     a311


var a       = new tree.Node('a'     );
var a1      = new tree.Node('a1'    );
var a11     = new tree.Node('a11'   );
var a2      = new tree.Node('a2'    );
var a21     = new tree.Node('a21'   );
var a22     = new tree.Node('a22'   );
var a221    = new tree.Node('a221'  );
var a222    = new tree.Node('a222'  );
var a23     = new tree.Node('a23'   );
var a3      = new tree.Node('a3'    );
var a31     = new tree.Node('a31'   );
var a311    = new tree.Node('a311'  );
var a4      = new tree.Node('a4'    );
var a41     = new tree.Node('a41'   );

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

var nodeindex = new tree.DocumentOrderIndex(a);
nodeindex.buildAll();

exports['should resolve 0-depth path to root node'] = function(test) {
    var r = new resolver.ContextResolver(a, nodeindex);
    var body, head, tail, result;

    body = [new tree.Node('a')];
    head = [undefined, undefined, undefined, undefined];
    tail = ['a1', 'a11', 'a2', 'a21'];
    result = r.find([], body, head, tail);

    test.deepEqual(result, [a]);
    test.done();
};

exports['should resolve correct path to existing nodes (depth:1)'] = function(test) {
    var r = new resolver.ContextResolver(a, nodeindex);
    var body, head, tail, result;

    // NODE UPDATE
    // resolve a1
    body = [new tree.Node('a1')];
    head = [undefined, undefined, undefined, 'a'];
    tail = ['a11', 'a2', 'a21', 'a22'];
    result = r.find([0], body, head, tail);
    test.deepEqual(result, [a, a1]);

    // resolve a2
    body = [new tree.Node('a2')];
    head = [undefined, 'a', 'a1', 'a11'];
    tail = ['a21', 'a22', 'a221', 'a222'];
    result = r.find([1], body, head, tail);

    // SUBTREE UPDATE
    // resolve a3..a4
    var b3      = new tree.Node('a3'    );
    var b31     = new tree.Node('a31'   );
    var b311    = new tree.Node('a311'  );
    var b4      = new tree.Node('a4'    );
    b3.append(b31);
    b31.append(b311);

    debugger;
    body = [b3, b4];
    head = ['a22', 'a221', 'a222', 'a23'];
    tail = ['a41', undefined, undefined, undefined];
    result = r.find([2], body, head, tail);

    test.deepEqual(result, [a, a3]);
    test.done();
};

/*
exports['should not resolve path with depth 2 if there are no nodes with depth 1'] = function(test) {
    var a = new tree.Node();
    var r = new resolver.UniformDepthResolver();
    var generation = [];
    var best = r.resolvePath(a, [0, 0], generation);

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

exports['should not resolve path with depth 3 if there are no nodes with depth 2'] = function(test) {
    var a = new tree.Node();
    var a1 = new tree.Node();
    var r = new resolver.UniformDepthResolver();
    var generation = [];
    var best;

    a.append(a1);
    best = r.resolvePath(a, [0, 0, 0], generation);

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
    var b3 = new tree.Node();
    var r = new resolver.UniformDepthResolver();
    var generation = [];
    var best;

    a.append(a1);
    a.append(b1);
    b1.append(b2);
    b2.append(b3);
    best = r.resolvePath(a, [0, 0, 0], generation);

    test.equals(best.node, b3);
    test.equals(generation[0], b3);
    test.equals(best.index, 0);
    test.done();
};

exports['should pick nearest node in same generation'] = function(test) {
    var a = new tree.Node();
    var a1 = new tree.Node();
    var a2 = new tree.Node();
    var a21 = new tree.Node();
    var a211 = new tree.Node();
    var a212 = new tree.Node();
    var r = new resolver.UniformDepthResolver();
    var generation = [];
    var best;

    a.append(a1);
    a.append(a2);
    a2.append(a21);
    a21.append(a211);
    a21.append(a212);

    best = r.resolvePath(a, [0, 1, 1], generation);

    test.equals(best.node, a211);
    test.equals(generation[0], a211);
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

exports['should resolve path to non-existant nodes to parent'] = function(test) {
    var a = new tree.Node();
    var r = new resolver.UniformDepthResolver();
    var generation = [];
    var best;

    best = r.resolvePath(a, [0], generation);

    test.equals(best.node, undefined);
    test.equals(best.par, a);
    test.equals(best.index, -1);
    test.equals(generation.length, 0);
    test.done();
};

exports['should resolve path to non-existant node to nearest node in generation'] = function(test) {
    var a = new tree.Node();
    var a1 = new tree.Node();
    var r = new resolver.UniformDepthResolver();
    var generation = [];
    var best;

    a.append(a1);
    best = r.resolvePath(a, [1], generation);

    test.equals(best.node, a1);
    test.equals(best.index, 0);
    test.equals(generation.length, 1);
    test.done();
};

exports['should resolve path to non-existant node to nearest node and parent'] = function(test) {
    var a = new tree.Node();
    var a1 = new tree.Node();
    var a11 = new tree.Node();
    var a2 = new tree.Node();
    var a3 = new tree.Node();
    var a31 = new tree.Node();
    var r = new resolver.UniformDepthResolver();
    var generation = [];
    var best;

    a.append(a1);
    a1.append(a11);
    a.append(a2);
    a.append(a3);
    a3.append(a31);

    best = r.resolvePath(a, [1, 0], generation);

    test.equals(best.node, a11);
    test.equals(best.par, a2);
    test.equals(best.index, 0);
    test.equals(generation.length, 2);
    test.done();
};
*/
