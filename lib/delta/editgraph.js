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
     * @param onhead function(head, k0)
     */
    Editgraph.prototype.forEachSnakeHead = function (onhead, T) {
        var d, k, head, k0, end;
        var V = {};

        V[1] = 0;
        head = new SnakeHead();
        for (d = 0; d <= this.dmax; d++) {
            for (k = -d; k <= d; k+=2) {
                k0 = this.nextSnakeHeadForward(head, k, -d, d, V);
                if (onhead) {
                    onhead.call(T, head, k0, d);
                }

                // check if we are done
                end = head.toPoint();
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
     * @param onhead function(dhead, precedessor)
     */
    Editgraph.prototype.forEachReverseSnakeHead = function (onhead, T) {
        var delta = this.N - this.M;
        var d, k, head, k0, end;
        var V = {};

        V[delta-1] = this.N;
        head = new SnakeHead();
        for (d = 0; d <= this.dmax; d++) {
            for (k = -d+delta; k <= d+delta; k+=2) {
                head.k = k;
                k0 = this.nextSnakeHeadBackward(head, k, -d+delta, d+delta, V);
                if (onhead) {
                    onhead.call(T, head, k0, d);
                }

                // check if we are done
                end = head.toPoint();
                if (end.x <= 0 && end.y <= 0) {
                    return d;
                }
            }
        }
    };

    Editgraph.prototype.nextSnakeHeadForward = function(head, k, kmin, kmax, V) {
        var k0, x;

        // Store current k-value in the snake head.
        head.k = k;

        // Determine the preceeding snake head. Pick the one whose furthest
        // reaching x value is greatest.
        if (k === kmin || (k !== kmax && V[k-1] < V[k+1])) {
            // Furthest reaching snake is above (k+1), move down.
            k0 = k+1;
            x = V[k0];
        }
        else {
            // Furthest reaching snake is left (k-1), move right.
            k0 = k-1;
            x = V[k0] + 1;
        }

        // Follow the diagonal as long as there are common values in a and b.
        while (x < this.N && x - k < this.M && this.equals(
                    this.a[this.x + x], this.b[this.y + x - k])) {
            x++;
        }

        // Store x value of snake head after traversing the diagonal in forward
        // direction.
        head.x = x;

        // Memozie furthest reaching x for k
        V[k] = x;

        // Return k-value of preceeding snake head
        return k0;
    };


    Editgraph.prototype.nextSnakeHeadBackward = function(head, k, kmin, kmax, V) {
        var k0, x, k = head.k;

        // Store current k-value in the snake head.
        head.k = k;

        // Determine the preceeding snake head. Pick the one whose furthest
        // reaching x value is greatest.
        if (k === kmax || (k !== kmin && V[k-1] < V[k+1])) {
            // Furthest reaching snake is underneath (k-1), move up.
            k0 = k-1;
            x = V[k-1];
        }
        else {
            // Furthest reaching snake is left (k-1), move right.
            k0 = k+1;
            x = V[k0]-1;
        }

        // Store x value of snake head before traversing the diagonal in
        // reverse direction.
        head.x = x;

        // Follow the diagonal as long as there are common values in a and b.
        while (x > 0 && x - k > 0 && this.equals(
                    this.a[this.x + x - 1], this.b[this.y + x - k - 1])) {
            x--;
        }

        // Memozie furthest reaching x for k
        V[k] = x;

        // Return k-value of preceeding snake head
        return k0;
    };


    /**
     * Middle snake
     */
    Editgraph.prototype.middleSnakeHead = function (onpath) {
        var delta = this.N - this.M;
        var d, k;
        var Vf = {'1': 0};
        var Vb = {'1': 0};
        var result;

        for (d = 0; d <= this.dmax/2; d++) {
            for (k = -d; k <= d; k+=2) {
                result = this.nextSnakeHeadForward(k, -d, d, Vf, function(x, x0, k0) {
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
                result = this.nextSnakeHeadBackward(k+delta, -d+delta, d+delta, Vb, function(d, x, k, x0, k0) {
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
     * Returns the edit position for the operation between the two snake heads
     * left and right.
     */
    Editgraph.prototype.editPosition = function(left, right) {
        return left.toPoint();
    }


    /**
     * Returns true if the edit operation between the two snake heads left and
     * right is an insert operation. Returns false for a delete operation.
     */
    Editgraph.prototype.editIsInsert = function(left, right) {
        return left.k > right.k;
    }


    /**
     * Calculates the longest common subsequence of a and b.
     */
    Editgraph.prototype.lcs_simple = function () {
        var snake_heads = [];
        var last_head;
        var head;
        var result;

        this.forEachSnakeHead(function(head, k0) {
            var prev = snake_heads[k0];
            head = head.copy();

            if (prev) {
                head.previous = prev;
            }

            snake_heads[head.k] = head;
            last_head = head;
        });

        if (last_head.x !== this.a.length) {
            throw new Error('Programming error: end-point of last head must match the length of the input array.\n');
        }

        result = [];
        for (head = last_head; head.previous; head = head.previous) {
            SnakeHead.forEachCommonSymbolBackward(head.previous, head, function(x,y) {
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
        var snake_heads = [];
        var last_head;
        var head;
        var pos;

        this.forEachSnakeHead(function(head, k0) {
            var prev = snake_heads[k0];
            head = head.copy();

            if (prev) {
                head.previous = prev;
            }

            snake_heads[head.k] = head;
            last_head = head;
        });

        result = [];
        for (head = last_head; head.previous; head = head.previous) {
            pos = this.editPosition(head.previous, head);
            if (this.editIsInsert(head.previous, head)) {
                editor.insert(pos.x, this.b[pos.y]);
            }
            else {
                editor.remove(pos.x);
            }
        }
    };


    /**
     * SnakeHead
     */
    function SnakeHead(k, x) {
        /**
         * The k-line on which the snake head is located at.
         */
        this.k = k;

        /**
         * The x-coordinate of the snake head.
         */
        this.x = x;
    }


    /**
     * Return a new copy of this snake head.
     */
    SnakeHead.prototype.copy = function() {
        return new SnakeHead(this.k, this.x);
    }


    /**
     * Return the snake head in x-y coordinates.
     */
    SnakeHead.prototype.toPoint = function() {
        return {
            'x': this.x,
            'y': this.x-this.k
        };
    };


    /**
     * Calls callback for each common symbol encountered when traversing the
     * right snake bound by the left one from left to right.
     *
     * @param left Left snake head
     * @param right Right snake head
     */
    SnakeHead.forEachCommonSymbolForward = function(left, right, callback, T) {
        var k = right.k;
        var x = k > left.k ? left.x + 1 : left.x;
        var xmax = right.x;

        while (x < xmax) {
            callback.call(T, x, x-k);
            x++;
        }
    }


    /**
     * Calls callback for each common symbol encountered when traversing the
     * right snake bound by the left one from right to left.
     *
     * @param left Left snake head
     * @param right Right snake head
     */
    SnakeHead.forEachCommonSymbolBackward = function(left, right, callback, T) {
        var k = right.k;
        var xmin = k > left.k ? left.x + 1 : left.x;
        var x = right.x;

        while (x > xmin) {
            x--;
            callback.call(T, x, x-k);
        }
    }


    /**
     * Return an array of edges representing the operation as well as the snake
     * between the given origin and destination snake-heads.
     *
     * This function returns at least one orthogonal edge representing the
     * operation between the given snake-heads. If the destination is further
     * away than only one unit, an additional diagonal edge gets appended to
     * the operation edge. Each edge is represented by an array of the form
     * [x-start, y-start, x-end, y-end].
     *
     * Thus, you can expect a result like this, where the middle-point marks
     * the point between the orthogonal operation-edge and the diagonal
     * skip-edge.
     * <pre>
     * [[x-origin, y-origin, x-middle, y-middle],
     *  [x-middle, y-middle, x-destination, y-destination]]
     * </pre>
     *
     * @param ox X-coordinate of the origin snake-head.
     * @param ok k-line the origin snake-head is located at.
     * @param dx X-coordinate of the destination snake-head.
     * @param dk k-line the destination snake-head is located at.
     */
    SnakeHead.edges = function(ox, ok, dx, dk) {
        // Initialy set x-coordinate of mid-point M to origins x.
        var mx = ox;
        var result = [];

        // M is right of O if destinations k is greater than origins k and
        // destinations x is greater than origins x.
        if (dk > ok && dx > ox) {
            mx++;
        }
        // M is left of O if destinations k is smaller than origins k and
        // destinations x is smaller than origins x.
        else if(dk < ok && dx < ox) {
            mx--;
        }
        // In all other cases M is above or below O. The exact position is
        // determined by destinations k.

        result.push([ox, ox-ok, mx, mx-dk]);
        if (mx !== dx) {
            result.push([mx, mx-dk, dx, dx-dk]);
        }
        return result;
    };


    // CommonJS exports
    exports.Editgraph = Editgraph;
    exports.SnakeHead = SnakeHead;

}(typeof exports === 'undefined' ? (this.editgraph={}) : exports));
