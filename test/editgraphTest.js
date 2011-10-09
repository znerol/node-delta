(function(exports, editgraph) {

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

        var builder = {
            'down': function(x, y) {
                actual_downs.push([x, y]);
            },
            'right': function(x, y) {
                actual_rights.push([x, y]);
            },
            'diag': function(x, y) {
                actual_diags.push([x, y]);
            }
        };

        var graph = new editgraph.Editgraph('abcabba', 'cbabac');
        var d = graph.editgraph_simple(builder);

        test.equal(d, 5);
        test.deepEqual(actual_downs, expect_downs);
        test.deepEqual(actual_rights, expect_rights);
        test.deepEqual(actual_diags, expect_diags);
        test.done();
    };

    /**
     * Test simple lcs algorithm. Expected graph is taken from the example in myers
     * paper on page 3.
     */
    exports.testSimpleLcs = function(test) {
        var expect_lcs = ['c','a','b','a'];

        var graph = new editgraph.Editgraph('abcabba', 'cbabac');
        var actual_lcs = graph.lcs_simple();

        test.deepEqual(actual_lcs, expect_lcs);
        test.done();
    };

    /**
     * Test simple shortest edit script algorithm. Expected graph is taken from the
     * example in myers paper on page 3.
     */
    exports.testSimpleSes = function(test) {
        var a = 'abcabba';
        var b = 'cbabac';

        // There is no String.splice function, so we just operate on an array.
        var result = a.split('');
        var editor = {
            'insert': function(idx, symbol) {
                result.splice(idx, 0, symbol);
            },
            'remove': function(idx) {
                result.splice(idx, 1);
            }
        };

        var graph = new editgraph.Editgraph('abcabba', 'cbabac');
        graph.ses_simple(editor);
        result = result.join('');

        test.deepEqual(result, b);
        test.done();
    };

    exports.testForwardDpathChainEdges = function(test) {
        var expected_edges = [
            [0, 0, 0, 1],
            [0, 1, 0, 2],
            [0, 2, 2, 4]
        ];
        var actual_edges = [];

        p1 = new editgraph.Dpath(0, 0, 0, 1, editgraph.Dpath.FORWARD);
        p2 = new editgraph.Dpath(0, 0, -1, 0, editgraph.Dpath.FORWARD);
        p2.prepend(p1);
        p3 = new editgraph.Dpath(2, 0, -2, -1, editgraph.Dpath.FORWARD);
        p3.prepend(p2);

        [p1, p2, p3].forEach(function(p) {
            p.forEachEdge(function(start, end) {
                actual_edges.push([start.x, start.y, end.x, end.y]);
            });
        });

        test.deepEqual(actual_edges, expected_edges);
        test.done();
    };

    exports.testBackwardDpathChainEdges = function(test) {
        var expected_edges = [
            [7, 6, 7, 5],
            [7, 5, 5, 3],
            [5, 3, 4, 3],
            [4, 3, 3, 2]
        ];
        var actual_edges = [];

        p1 = new editgraph.Dpath(7, 7, 1, 0, editgraph.Dpath.BACKWARD);
        p2 = new editgraph.Dpath(5, 7, 2, 1, editgraph.Dpath.BACKWARD);
        p2.prepend(p1);
        p3 = new editgraph.Dpath(3, 4, 1, 2, editgraph.Dpath.BACKWARD);
        p3.prepend(p2);

        [p1, p2, p3].forEach(function(p) {
            p.forEachEdge(function(start, end) {
                actual_edges.push([start.x, start.y, end.x, end.y]);
            });
        });

        test.deepEqual(actual_edges, expected_edges);
        test.done();
    };
}(
    typeof exports === 'undefined' ? (this.editgraphTest={}) : exports,
    typeof require === 'undefined' ? this.editgraph : require('deltajs').editgraph
));
