(function(exports, editgraph) {

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

    exports.testSnakeHeadCommonSymbolForward = function(test) {
        var expected_common_symbols = [
            [0,2],
            [1,3]
        ];
        var actual_common_symbols = [];

        p1 = new editgraph.SnakeHead(0, 0);
        p2 = new editgraph.SnakeHead(-1, 0);
        p3 = new editgraph.SnakeHead(-2, 2);

        s1 = new editgraph.Snake(p1, p2);
        s2 = new editgraph.Snake(p2, p3);

        [s1, s2].forEach(function(snake) {
            snake.forEachCommonSymbolForward(function(x, y) {
                actual_common_symbols.push([x,y]);
            });
        });

        test.deepEqual(actual_common_symbols, expected_common_symbols);
        test.done();
    };

    exports.testSnakeHeadCommonSymbolBackward = function(test) {
        var expected_common_symbols = [
            [1,3],
            [0,2]
        ];
        var actual_common_symbols = [];

        p1 = new editgraph.SnakeHead(0, 0);
        p2 = new editgraph.SnakeHead(-1, 0);
        p3 = new editgraph.SnakeHead(-2, 2);

        s1 = new editgraph.Snake(p1, p2);
        s2 = new editgraph.Snake(p2, p3);

        [s1, s2].forEach(function(snake) {
            snake.forEachCommonSymbolBackward(function(x, y) {
                actual_common_symbols.push([x,y]);
            });
        });

        test.deepEqual(actual_common_symbols, expected_common_symbols);
        test.done();
    };

    exports.testReverseSnakeHeadCommonSymbolForward = function(test) {
        var expected_common_symbols = [
            [5, 3],
            [6, 4]
        ];
        var actual_common_symbols = [];

        p1 = new editgraph.SnakeHead(1, 7);
        p2 = new editgraph.SnakeHead(2, 7);
        p3 = new editgraph.SnakeHead(1, 4);

        s1 = new editgraph.Snake(p2, p1);
        s2 = new editgraph.Snake(p3, p2);

        [s2, s1].forEach(function(snake) {
            snake.forEachCommonSymbolForward(function(x, y) {
                actual_common_symbols.push([x,y]);
            });
        });

        test.deepEqual(actual_common_symbols, expected_common_symbols);
        test.done();
    };

    exports.testReverseSnakeHeadCommonSymbolBackward = function(test) {
        var expected_common_symbols = [
            [6, 4],
            [5, 3]
        ];
        var actual_common_symbols = [];

        p1 = new editgraph.SnakeHead(1, 7);
        p2 = new editgraph.SnakeHead(2, 7);
        p3 = new editgraph.SnakeHead(1, 4);

        s1 = new editgraph.Snake(p2, p1);
        s2 = new editgraph.Snake(p3, p2);

        [s1, s2].forEach(function(snake) {
            snake.forEachCommonSymbolBackward(function(x, y) {
                actual_common_symbols.push([x,y]);
            });
        });

        test.deepEqual(actual_common_symbols, expected_common_symbols);
        test.done();
    };
}(
    typeof exports === 'undefined' ? (this.editgraphTest={}) : exports,
    typeof require === 'undefined' ? this.editgraph : require('deltajs').editgraph
));
