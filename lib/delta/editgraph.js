/**
 * @file:   Implementation of Myers longest common subsequence algorithm using
 *          an edit graph.
 * @see:
 * * http://dx.doi.org/10.1007/BF01840446
 * * http://citeseer.ist.psu.edu/viewdoc/summary?doi=10.1.1.4.6927
 */

(function(exports){
    function Editgraph(a, b, x, y, N, M, dmax) {
        this.a = a;
        this.b = b;

        this.x = (typeof x === 'undefined') ? 0 : x;
        this.y = (typeof y === 'undefined') ? 0 : y;
        this.N = (typeof N === 'undefined') ? a.length : N;
        this.M = (typeof M === 'undefined') ? b.length : M;
        this.dmax = (typeof dmax === 'undefined') ? this.N + this.M : dmax;
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
     * @param onpath function(dpath, precedessor)
     */
    Editgraph.prototype.forEachDpath = function (onpath, T) {
        var d, k, path, prev, end;
        var V = {};

        V[1] = new Dpath(1, 0);
        for (d = 0; d <= this.dmax; d++) {
            for (k = -d; k <= d; k+=2) {
                path = new Dpath(k);
                prev = this.extendDpathFw(path, -d, d, V);
                if (onpath) {
                    onpath.call(T, path, prev, d);
                }

                // check if we are done
                end = path.getSnakeEnd();
                if (end.x >= this.N && end.y >= this.M) {
                    return d;
                }
            }
        }
    };

    /**
     * Call a function for each reverse D-Path identified using myers basic
     * greedy lcs algorithm.
     *
     * Returns the length of the shortest edit script, i.e. the minimal number
     * of insert and delete operations required to turn a into b.
     *
     * @param onpath function(dpath, precedessor)
     */
    Editgraph.prototype.forEachReverseDpath = function (onpath, T) {
        var delta = this.N - this.M;
        var d, k, path, prev, end;
        var V = {};

        V[delta-1] = new Dpath(delta-1, this.N);
        for (d = 0; d <= this.dmax; d++) {
            for (k = -d+delta; k <= d+delta; k+=2) {
                path = new Dpath(k);
                prev = this.extendDpathBw(path, -d+delta, d+delta, V);
                if (onpath) {
                    onpath.call(T, path, prev, d);
                }

                // check if we are done
                end = path.getSnakeEnd();
                if (end.x <= 0 && end.y <= 0) {
                    return d;
                }
            }
        }
    };

    Editgraph.prototype.extendDpathFw = function(path, kmin, kmax, V) {
        var prev;
        var k = path.k;

        // Determine the preceeding d-path segment. Pick the one whose furthest
        // reaching x value is greatest.
        if (k === kmin || (k !== kmax && V[k-1].xh < V[k+1].xh)) {
            // Furthest reaching d-path segment is above (k+1), move down.
            prev = V[k+1];
            path.xl = prev.xh;
        }
        else {
            // Furthest reaching d-path segment is left (k-1), move right.
            prev = V[k-1];
            path.xl = prev.xh+1;
        }

        // Compute the snake: Move along the diagonal as long as there are
        // common values in a and b.
        path.xh = path.xl;
        while (path.xh < this.N && path.xh - k < this.M && this.equals(
                    this.a[this.x + path.xh], this.b[this.y + path.xh - k])) {
            path.xh++;
        }

        // Memozie computed path
        V[k] = path;

        // Return preceeding path
        return prev;
    };


    Editgraph.prototype.extendDpathBw = function(path, kmin, kmax, V) {
        var prev;
        var k = path.k;

        // Determine the preceeding d-path segment. Pick the one whose furthest
        // reaching x value is greatest.
        if (k === kmax || (k !== kmin && V[k-1].xl < V[k+1].xl)) {
            // Furthest reaching d-path segment is underneath (k-1), move up.
            prev = V[k-1];
            path.xh = prev.xl;
        }
        else {
            // Furthest reaching d-path segment is left (k-1), move right.
            prev = V[k+1];
            path.xh = prev.xl-1;
        }

        // Compute the snake: Move along the diagonal as long as there are
        // common values in a and b.
        path.xl = path.xh;
        while (path.xl > 0 && path.xl - k > 0 && this.equals(
                    this.a[this.x + path.xl - 1], this.b[this.y + path.xl - k - 1])) {
            path.xl--;
        }

        // Memozie computed path
        V[k] = path;

        // Return preceeding path
        return prev;
    };


    /**
     * Middle snake
     */
    Editgraph.prototype.middleSnake = function (onpath) {
        var delta = this.N - this.M;
        var d, k;
        var Vf = {'1': 0};
        var Vb = {'1': 0};
        var result;

        for (d = 0; d <= this.dmax/2; d++) {
            for (k = -d; k <= d; k+=2) {
                result = this.extendDpathFw(k, -d, d, Vf, function(x, x0, k0) {
                    var y = x-k;
                    var y0 = x0-k;

                    if (onpath) onpath(d, x, k, x0, k0);

                    // check for overlap
                    if (delta % 2 === 1 && (k === delta - (d-1) || k === delta + (d+1))) {
                        if (Vf[k] >= Vb[k]) {
                            // return last forward snake
                            return [this.x + x, this.y + y, this.x + x0, this.y + y0]
                        }
                    }
                });
                if (result) {
                    return result;
                }
            }


            for (k = -d; k <= d; k+=2) {
                result = this.extendDpathBw(k+delta, -d+delta, d+delta, Vb, function(d, x, k, x0, k0) {
                    var y = x-k;
                    var y0 = x0-k;

                    if (onpath) onpath(d, x, k, x0, k0);

                    // check for overlap
                    if (delta % 2 === 0 && (k + delta === -d || k + delta === d)) {
                        if (Vf[k+delta] >= Vb[k+delta]) {
                            // return last forward snake
                            return [this.x + x, this.y + y, this.x + x0, this.y + y0]
                        }
                    }
                });
                if (result) {
                    return result;
                }
            }
        }
    }


    /**
     * Returns the edit position for the operation between the two snakes left
     * and right.
     */
    Editgraph.prototype.editPosition = function(left, right) {
        return left.getSnakeEnd();
    }


    /**
     * Returns true if the odit operation between the two snakes left and right
     * is an insert operation. Returns false for a delete operation.
     */
    Editgraph.prototype.editIsInsert = function(left, right) {
        return left.k > right.k;
    }


    /**
     * Calculates the longest common subsequence from arrays a and b. Returns the
     * length of the shortest edit script, i.e. the minimal number of insert and
     * delete operations required to turn a into b.
     */
    Editgraph.prototype.editgraph_simple = function (builder) {
        var d;

        d = this.forEachDpath(function(path, prev) {
            var vertical = (prev.k > path.k);
            var start = path.getSnakeStart();
            if (vertical) {
                builder.down(start.x, start.y);
            }
            else {
                builder.right(start.x, start.y);
            }

            path.forEachCommonSymbolForward(function(x, y) {
                builder.diag(x+1, y+1);
            });
        });

        return d;
    };


    /**
     * Calculates the longest common subsequence of a and b.
     */
    Editgraph.prototype.lcs_simple = function () {
        var last_path;
        var path;
        var result;

        this.forEachDpath(function(path, prev) {
            if (prev) {
                path.previous = prev;
            }
            last_path = path;
        });

        if (last_path.xh !== this.a.length) {
            throw new Error('Programming error: end-point of last path must match the length of the input array.\n');
        }

        result = [];
        for (path = last_path; path; path = path.previous) {
            path.forEachCommonSymbolBackward(function(x,y) {
                result.unshift(this.a[x]);
            }, this);
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
    Editgraph.prototype.ses_simple = function (editor) {
        var last_path;
        var path;
        var pos;

        this.forEachDpath(function(dpath, prev) {
            if (prev) {
                dpath.previous = prev;
            }
            last_path = dpath;
        });

        result = [];
        for (path = last_path; path.previous; path = path.previous) {
            pos = this.editPosition(path.previous, path);
            if (this.editIsInsert(path.previous, path)) {
                editor.insert(pos.x, this.b[pos.y]);
            }
            else {
                editor.remove(pos.x);
            }
        }
    };


    /**
     * Dpath
     */
    function Dpath(k, xl, xh) {
        /**
         * The k-line on which the snake-part is located at.
         */
        this.k = k;

        /**
         * The start of the snake nearest to (0,0)
         */
        this.xl = xl;

        /**
         * The end of the snake nearest to (N,M)
         */
        this.xh = (typeof xh === 'undefined') ? xl : xh;
    }

    /**
     * Call callback for each (x,y) representing a symbol which both of the
     * sequences have in common. Proceed from the point of the snake which is
     * nearest to (0,0) to the point of the snake which is nearest to (N,M).
     */
    Dpath.prototype.forEachCommonSymbolForward = function(callback, T) {
        var x, k = this.k, xh = this.xh;

        for (x = this.xl; x < xh; x++) {
            callback.call(T, x, x-k);
        }
    };

    /**
     * Call callback for each (x,y) representing a symbol which both of the
     * sequences have in common. Proceed from the point of the snake which is
     * nearest to (N,M) to the point of the snake which is nearest to (0,0).
     */
    Dpath.prototype.forEachCommonSymbolBackward = function(callback, T) {
        var x, k = this.k, xl = this.xl;

        for (x = this.xh-1; x >= xl; x--) {
            callback.call(T, x, x-k);
        }
    };

    /**
     * Return the start of the snake of this d-path.
     *
     * This point also represents the point of action for operations.
     */
    Dpath.prototype.getSnakeStart = function() {
        return {
            'x': this.xl,
            'y': this.xl-this.k
        };
    };

    /**
     * Return the point of the d-path which is furthest away from the origin of
     * the current direction.
     *
     * For forward-paths this returns the point which is furthest away from
     * (0,0), for reverse-paths (N,M).
     */
    Dpath.prototype.getSnakeEnd = function() {
        return {
            'x': this.xh,
            'y': this.xh-this.k
        };
    };

    // CommonJS exports
    exports.Editgraph = Editgraph;
    exports.Dpath = Dpath;

}(typeof exports === 'undefined' ? (this.editgraph={}) : exports));
