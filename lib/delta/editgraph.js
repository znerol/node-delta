/**
 * @file:   Implementation of Myers longest common subsequence algorithm using
 *          an edit graph.
 * @see:
 * * http://dx.doi.org/10.1007/BF01840446
 * * http://citeseer.ist.psu.edu/viewdoc/summary?doi=10.1.1.4.6927
 */

(function(exports){
    function Editgraph(a, b, x, y, M, N) {
        this.a = a;
        this.b = b;

        this.x = x || 0;
        this.y = y || 0;
        this.N = N || a.length;
        this.M = M || b.length;
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
        var d, k;
        var V = {};
        var that = this;

        if (!dmax) dmax = this.N + this.M;

        V[1] = 0;
        for (d = 0; d <= dmax; d++) {
            for (k = -d; k <= d; k+=2) {
                var result = this.extendDpathFw(k, -d, d, V, function(x, x0, k0) {
                    var y = x-k;

                    if (onpath) onpath(d, x, k, x0, k0);

                    // check if we are done
                    if (x >= that.N && y >= that.M) {
                        return d;
                    }
                });
                if (result) {
                    return result;
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
     * @param a Sequence
     * @param b Sequence
     * @param dmax Integer <= a.length + b.length
     * @param onpath function(d, x, k, x0, k0)
     */
    Editgraph.prototype.forEachReverseDpath = function (dmax, onpath) {
        var delta = this.N-this.M;
        var d, k;
        var V = {};

        if (!dmax) dmax = this.N + this.M;

        V[delta-1] = this.M;
        for (d = 0; d <= dmax; d++) {
            for (k = -d; k <= d; k+=2) {
                var result = this.extendDpathBw(k+delta, -d+delta, d+delta, V, function(x, x0, k0) {
                    var y = x-(k+delta);

                    if (onpath) onpath(d, x, k+delta, x0, k0);

                    // check if we are done
                    if (x >= 0 && y >= 0) {
                        return d;
                    }
                });
                if (result) {
                    return result;
                }
            }
        }
    };

    Editgraph.prototype.extendDpathFw = function(k, kmin, kmax, V, onpath) {
        var k0, x0, x, y;

        // figure out if we have to move down or right from the previous
        // k-line.
        if (k === kmin || (k !== kmax && V[k-1] < V[k+1])) {
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
        while (x < this.N && y < this.M && this.equals(this.a[this.x + x], this.b[this.y + y])) {
            x++;
            y++;
        }

        // store endpoint
        V[k] = x;

        // invoke d-path callback
        if (onpath)
            return onpath(x, x0, k0);
    };


    Editgraph.prototype.extendDpathBw = function(k, kmin, kmax, V, onpath) {
        var k0, x0, x, y;

        // figure out if we have to move up or left from the previous
        // k-line.
        if (k === kmin || (k !== kmax && V[k-1] > V[k+1])) {
            // up
            k0 = k-1;
            x = V[k0];
        }
        else {
            // left
            k0 = k+1;
            x = V[k0]-1;
        }

        x0 = x;
        y = x-k;

        // follow the diagonal
        while (x > 0 && y > 0 && this.equals(this.a[this.x + x], this.b[this.y + y])) {
            x--;
            y--;
        }

        // store endpoint
        V[k] = x;

        // invoke d-path callback
        if (onpath)
            return onpath(x, x0, k0);
    }


    /**
     * Middle snake
     */
    Editgraph.prototype.middleSnake = function (onpath) {
        var dmax = this.N + this.M;
        var delta = this.N - this.M;
        var d, k;
        var Vf = {'1': 0};
        var Vb = {'1': 0};
        var result;

        for (d = 0; d <= dmax/2; d++) {
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


    /**
     * Dpath
     */
    function Dpath(x, xo, k, k0, dir) {
        /**
         * Furthest reaching x coordinate, when dir=FORWARD x >= xo otherwise
         * x <= xo. X marks the end of the snake.
         */
        this.x = x;

        /**
         * X coordinate of the operation and at the same time the other end of
         * the snake.
         */
        this.xo = xo;

        /**
         * The k-line on which the snake-part is located at.
         */
        this.k = k;

        /**
         * The direction of this Dpath.
         */
        this.dir = dir || Dpath.FORWARD;

        /**
         * The precedessor of this Dpath.
         */
        this.previous = undefined;
    }

    Dpath.FORWARD = 1;
    Dpath.BACKWARD = -1;

    /**
     * Call appropriate editor commands in order to turn a into b.
     *
     * Editor should implement:
     * * remove(seq, idx, symbol);
     * * delete(seq, idx, symbol);
     * * skip(seq, idx, symbol);
     */
    Dpath.prototype.edit = function(editor, a, b, edit_dir, T) {
    };

    /**
     * Call callback for each (x,y) representing a symbol which both of the
     * sequences have in common. Proceed from the point of the snake which is
     * nearest to (0,0) to the point of the snake which is nearest to (N,M).
     */
    Dpath.prototype.forEachCommonSymbolForward = function(callback, T) {
        var end = this.getSnakeHigh();
        var cur = this.getSnakeLow();

        for (cur.x++, cur.y++; cur.x <= end.x && cur.y <= end.y; cur.x++, cur.y++) {
            callback.call(T, cur.x, cur.y);
        }
    };

    /**
     * Call callback for each (x,y) representing a symbol which both of the
     * sequences have in common. Proceed from the point of the snake which is
     * nearest to (N,M) to the point of the snake which is nearest to (0,0).
     */
    Dpath.prototype.forEachCommonSymbolBackward = function(callback, T) {
        var end = this.getSnakeLow();
        var cur;

        for (cur = this.getSnakeHigh(); cur.x > end.x && cur.y > end.y; cur.x--, cur.y--) {
            callback.call(T, cur.x, cur.y);
        }
    };

    /**
     * Call appropriate plotting commands in order to visualize the Dpath.
     */
    Dpath.prototype.forEachEdge = function(callback, T) {
        // Orthogonal line (corresponds to insert/remove operations)
        if (this.previous) {
            callback.call(T, this.previous.getSnakeEnd(), this.getSnakeStart());
        }
        // Diagonal line (corresponds to skip operations/equal symbols)
        if (this.x !== this.xo) {
            callback.call(T, this.getSnakeStart(), this.getSnakeEnd());
        }
    };

    /**
     * Return the start of the snake of this d-path.
     *
     * This point also represents the point of action for operations.
     */
    Dpath.prototype.getSnakeStart = function() {
        return {
            'x': this.xo,
            'y': this.xo-this.k
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
            'x': this.x,
            'y': this.x-this.k
        };
    };

    /**
     * Return the point of the d-path which is nearest to (0,0)
     */
    Dpath.prototype.getSnakeLow = function() {
        return (this.dir === Dpath.FORWARD) ? this.getSnakeStart() : this.getSnakeEnd();
    }

    /**
     * Return the point of the d-path which is furthest away from (0,0)
     */
    Dpath.prototype.getSnakeHigh = function() {
        return (this.dir === Dpath.FORWARD) ? this.getSnakeEnd() : this.getSnakeStart();
    }

    /**
     * Set the the given dpath as the predecessor of this one.
     */
    Dpath.prototype.prepend = function(predecessor) {
        if (predecessor.dir !== this.dir) {
            throw new Error('Directions must match');
        }
        this.previous = predecessor;
    };

    // CommonJS exports
    exports.Editgraph = Editgraph;
    exports.Dpath = Dpath;

}(typeof exports === 'undefined' ? (this.editgraph={}) : exports));
