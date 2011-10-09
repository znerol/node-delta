/**
 * @file:   Implementation of Myers longest common subsequence algorithm using
 *          an edit graph.
 * @see:
 * * http://dx.doi.org/10.1007/BF01840446
 * * http://citeseer.ist.psu.edu/viewdoc/summary?doi=10.1.1.4.6927
 */

(function(exports){

    function Editgraph(a, b) {
        this.a = a;
        this.b = b;
    }

    Editgraph.prototype.equals = function(a, b) {
        return (a === b);
    };


    /**
     * Call a function for each D-Path identified using myers basic greedy lcs
     * algorithm.
     *
     * Returns the length of the shortest edit script, i.e. the minimal number
     * of insert and delete operations required to turn a into b.
     *
     * @param a Sequence
     * @param b Sequence
     * @param dmax Integer <= a.length + b.length
     * @param onpath function(d, x, k, x0, k0)
     */
    Editgraph.prototype.forEachDpath = function (dmax, onpath) {
        var N = this.a.length;
        var M = this.b.length;
        var d, k0, k, x0, x, y;
        var V = [];

        if (!dmax) dmax = N + M;

        V[1] = 0;
        for (d = 0; d <= dmax; d++) {
            for (k = -d; k <= d; k+=2) {
                // figure out if we have to move down or right from the previous
                // k-line.
                if (k === -d || (k !== d && V[k-1] < V[k+1])) {
                    // down
                    k0 = k+1;
                    x = V[k0];
                }
                else {
                    // right
                    k0 = k-1;
                    x = V[k0]+1;
                }

                x0 = x;
                y = x-k;

                // follow the diagonal
                while (x < N && y < M && this.equals(this.a[x], this.b[y])) {
                    x++;
                    y++;
                }

                // store endpoint
                V[k] = x;

                // invoke d-path callback
                if (onpath) onpath(d, x, k, x0, k0);

                // check if we are done
                if (x >= N && y >= M) {
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
    Editgraph.prototype.editgraph_simple = function (builder, dmax) {
        var d;

        d = this.forEachDpath(dmax, function(d, x, k, x0, k0) {
            var vertical = (k0 > k);
            if (vertical) {
                builder.down(x0, x0-k);
            }
            else {
                builder.right(x0, x0-k);
            }

            while(x0++ < x) {
                builder.diag(x0, x0-k);
            }
        });

        return d;
    };


    /**
     * Calculates the longest common subsequence of a and b.
     */
    Editgraph.prototype.lcs_simple = function (dmax) {
        var paths = [];
        var last_path;
        var path;
        var result;
        var x;

        this.forEachDpath(dmax, function(d, x, k, x0, k0) {
            var prev_path = paths[k0];
            last_path = {
                'prev'  : prev_path,
                'x0'    : x0,
                'x'     : x,
            };
            paths[k] = last_path;
        });

        if (last_path.x !== this.a.length) {
            throw new Error('Programming error: end-point of last path must match the length of the input array.\n');
        }

        result = [];
        for (path = last_path; path; path = path.prev) {
            for (x=path.x; x > path.x0; x--) {
                result.unshift(this.a[x-1]);
            }
        }

        return result;
    };


    /**
     * Create the shortest edit script turning a into b. Editor should be an
     * object with the following two methods:
     *
     * * insert(idx, symbol)
     * * remove(idx)
     */
    Editgraph.prototype.ses_simple = function (editor, dmax) {
        var paths = [];
        var last_path;
        var path;

        this.forEachDpath(dmax, function(d, x, k, x0, k0) {
            var prev_path = paths[k0];
            last_path = {
                'prev'  : prev_path,
                'insert': (k0 > k),
                'x0'    : x0,
                'y0'    : x0-k,
            };
            paths[k] = last_path;
        });

        result = [];
        for (path = last_path; path.prev; path = path.prev) {
            if (path.insert) {
                editor.insert(path.x0, this.b[path.y0-1]);
            }
            else {
                editor.remove(path.x0-1);
            }
        }
    };

    // CommonJS exports
    exports.Editgraph = Editgraph;

}(typeof exports === 'undefined' ? (this.editgraph={}) : exports));
