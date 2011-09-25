var deltajs = require('deltajs');

/**
 * Test simple edit graph algorithm. Expected graph is taken from the example
 * in myers paper on page 7.
 */
exports.testSimple = function(test) {
    var expect_downs = [
        // d=0
        [ 0, 0 ],
        // d=1
        [ 0, 1 ],
        // d=2
        [ 0, 2 ],
        [ 1, 1 ],
        // d=3
        [ 2, 5 ],
        [ 3, 2 ],
        // d=4
        [ 3, 7 ],
        [ 4, 6 ],
        [ 5, 5 ],
        // d=5
        [ 3, 8 ],
        [ 4, 7 ],
        [ 5, 6 ],
        [ 7, 6 ]
    ];
    var expect_rights = [
        // d=1
        [1, 0],
        // d=2
        [2, 0],
        // d=3
        [3, 4],
        [4, 1],
        // d=4
        [6, 4],
        [6, 2],
    ];
    var expect_diags = [
        // d=2
        [1, 3],
        [2, 4],
        [2, 2],
        [3, 1],
        // d=3
        [3, 6],
        [4, 5],
        [4, 3],
        [5, 4],
        [5, 2],
        // d=4
        [7, 5],
        [7, 3],
    ];
    var actual_downs = [];
    var actual_rights = [];
    var actual_diags = [];

    var graph = new deltajs.editgraph.Editgraph();
    graph.down = function(x, y) {
        actual_downs.push([x, y]);
    };
    graph.right = function(x, y) {
        actual_rights.push([x, y]);
    };
    graph.diag = function(x, y) {
        actual_diags.push([x, y]);
    };

    graph.editgraph_simple('abcabba', 'cbabac');

    test.deepEqual(actual_downs, expect_downs);
    test.deepEqual(actual_rights, expect_rights);
    test.deepEqual(actual_diags, expect_diags);
    test.done();
}
