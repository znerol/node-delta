/**
 * @file:   Implementation of Myers longest common subsequence algorithm using
 *          an edit graph.
 * @see:
 * * http://dx.doi.org/10.1007/BF01840446
 * * http://citeseer.ist.psu.edu/viewdoc/summary?doi=10.1.1.4.6927
 */

(function(exports){

    function Editgraph() {
    }

    Editgraph.prototype.equals = function(a, b) {
        return (a === b);
    };

    Editgraph.prototype.down = function(x, y) {
        throw new Error('Editgraph.down(x, y) is an abstract method. Please implement it in your object');
    };

    Editgraph.prototype.right = function(x, y) {
        throw new Error('Editgraph.right(x, y) is an abstract method. Please implement it in your object');
    };

    Editgraph.prototype.right = function(x, y) {
        throw new Error('Editgraph.diag(x, y) is an abstract method. Please implement it in your object');
    };


    /**
     * Call a function for each snake identified using myers simple lcs algorithm.
     * Returns the length of the shortest edit script, i.e. the minimal number of
     * insert and delete operations required to turn a into b.
     */
    Editgraph.prototype.eachSnakeSimple = function (a, b, dmax, onsnake, ond) {
        var N = a.length;
        var M = b.length;
        var vertical;
        var d, k, x1, x;
        var V = [];

        if (!dmax) dmax = N + M;

        V[1] = 0;
        for (d = 0; d <= dmax; d++) {
            // invoke d-callback
            if (ond) ond(d);
            for (k = -d; k <= d; k+=2) {
                // figure out if we have to move down or right from the previous
                // k-line.
                vertical = (k === -d || (k !== d && V[k-1] < V[k+1]));

                x = vertical ? V[k+1] : V[k-1]+1;
                x1 = x;

                // follow the diagonal
                while (x < N && x-k < M && this.equals(a[x], b[x-k])) {
                    x++;
                }

                // store endpoint
                V[k] = x;

                // invoke snake callback
                if (onsnake) onsnake(x1, x, k, vertical);

                // check if we are done
                if (x >= N && x-k >= M) {
                    return d;
                }
            }
        }

        // We did not manage to come up with a good solution within dmax.
        return undefined;
    };


    /**
     * Calculates the longest common subsequence from arrays a and b. Returns the
     * length of the shortest edit script, i.e. the minimal number of insert and
     * delete operations required to turn a into b.
     */
    Editgraph.prototype.editgraph_simple = function (a, b, dmax) {
        var d;
        var that = this;

        d = this.eachSnakeSimple(a, b, dmax, function(x1, x2, k, vertical) {
            if (vertical) {
                that.down(x1, x1-k);
            }
            else {
                that.right(x1, x1-k);
            }

            while(x1++ < x2) {
                that.diag(x1, x1-k);
            }
        });

        return d;
    };


    /**
     * Calculates the longest common subsequence of a and b.
     */
    Editgraph.prototype.lcs_simple = function (a, b, dmax) {
        var snake_heads = [];
        var last_snake;
        var snake;
        var result;
        var x;

        this.eachSnakeSimple(a, b, dmax, function(x1, x2, k, vertical) {
            var prev_snake = snake_heads[vertical ? k+1 : k-1];
            last_snake = {
                'prev'  : prev_snake,
                'x1'    : x1,
                'x2'    : x2,
            };
            snake_heads[k] = last_snake;
        });

        if (last_snake.x2 !== a.length) {
            throw new Error('Programming error: end-point of last snake must match the length of the input array.\n');
        }

        result = [];
        for (snake = last_snake; snake; snake = snake.prev) {
            for (x=snake.x2; x > snake.x1; x--) {
                result.unshift(a[x-1]);
            }
        }

        return result;
    };


    /**
     * Create the shortest edit script turning a into b. Editor should be an object
     * with the following two methods:
     * * insert(idx, symbol)
     * * remove(idx)
     */
    Editgraph.prototype.ses_simple = function (a, b, editor, dmax) {
        var snake_heads = [];
        var last_snake;
        var snake;
        var x;

        this.eachSnakeSimple(a, b, dmax, function(x1, x2, k, vertical) {
            var prev_snake = snake_heads[vertical ? k+1 : k-1];
            last_snake = {
                'prev'  : prev_snake,
                'vert'  : vertical,
                'x1'    : x1,
                'x2'    : x2,
                'y1'    : x1-k,
            };
            snake_heads[k] = last_snake;
        });

        if (last_snake.x2 !== a.length) {
            throw new Error('Programming error: end-point of last snake must match the length of the input array.\n');
        }

        result = [];
        for (snake = last_snake; snake.prev; snake = snake.prev) {
            if (snake.vert) {
                editor.insert(snake.x1, b[snake.y1-1]);
            }
            else {
                editor.remove(snake.x1-1);
            }
        }
    };

    // CommonJS exports
    exports.Editgraph = Editgraph;

}(typeof exports === 'undefined' ? (this.editgraph={}) : exports));
