/**
 * @file:   Implementation of Myers longest common subsequence algorithm using
 *          an edit graph.
 * @see:
 * * http://dx.doi.org/10.1007/BF01840446
 * * http://citeseer.ist.psu.edu/viewdoc/summary?doi=10.1.1.4.6927
 */

(function(exports){
    function Editgraph(a, b, dmax, left, right) {
        this.a = a;
        this.b = b;

        this.limit(left, right, dmax);
    }

    Editgraph.prototype.equals = function(a, b) {
        return (a === b);
    };


    /**
     * Limit operating range of subsequent computations to the given snake head
     * positions.
     */
    Editgraph.prototype.limit = function(left, right, dmax) {
        this.left = (typeof left !== 'undefined') ? left :
            new SnakeHead(0,0);

        this.right = (typeof right !== 'undefined') ? right :
            new SnakeHead(this.a.length, this.a.length - this.b.length);

        this.N = this.right.x - this.left.x;
        this.M = (this.right.x - this.right.k) - (this.left.x - this.left.k);

        this.delta = this.N - this.M;
        this.dmax = (typeof dmax !== 'undefined') ? dmax : this.N + this.M;
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
                if (head.x >= this.right.x && head.k <= this.right.k) {
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
        var delta = this.delta;
        var d, k, head, k0, end;
        var V = {};

        V[delta-1] = this.N;
        head = new SnakeHead();
        for (d = 0; d <= this.dmax; d++) {
            for (k = -d+delta; k <= d+delta; k+=2) {
                k0 = this.nextSnakeHeadBackward(head, k, -d+delta, d+delta, V);
                if (onhead) {
                    onhead.call(T, head, k0, d);
                }

                // check if we are done
                if (head.x <= this.left.x && head.k >= this.left.k) {
                    return d;
                }
            }
        }
    };

    Editgraph.prototype.nextSnakeHeadForward = function(head, k, kmin, kmax, V) {
        var k0, x, bx, by, n;

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
        bx = this.left.x;
        by = bx - (this.left.k + k);
        n = Math.min(this.N, this.M + k);
        while (x < n && this.equals(this.a[bx + x], this.b[by + x])) {
            x++;
        }

        // Store x value of snake head after traversing the diagonal in forward
        // direction.
        head.set(x, k);
        head.moveby(this.left);

        // Memozie furthest reaching x for k
        V[k] = x;

        // Return k-value of preceeding snake head
        return k0;
    };


    Editgraph.prototype.nextSnakeHeadBackward = function(head, k, kmin, kmax, V) {
        var k0, x, bx, by, n;

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
        head.set(x, k);
        head.moveby(this.left);

        // Follow the diagonal as long as there are common values in a and b.
        bx = this.left.x - 1;
        by = bx - (this.left.k + k);
        n = Math.max(k, 0);
        while (x > n && this.equals(this.a[bx + x], this.b[by + x])) {
            x--;
        }

        // Memozie furthest reaching x for k
        V[k] = x;

        // Return k-value of preceeding snake head
        return k0;
    };


    /**
     * Find the middle snake and set lefthead to the left end and righthead to
     * the right end.
     */
    Editgraph.prototype.middleSnake = function (lefthead, righthead) {
        var d, k, head, k0;
        var delta = this.delta;
        var Vf = {};
        var Vb = {};

        Vf[1] = 0;
        Vb[delta-1] = this.N;
        for (d = 0; d <= this.dmax/2; d++) {
            for (k = -d; k <= d; k+=2) {
                k0 = this.nextSnakeHeadForward(righthead, k, -d, d, Vf);

                // check for overlap
                if (delta % 2 === 1 && k >= -d-1+delta && k <= d-1+delta) {
                    if (Vf[k] >= Vb[k]) {
                        // righthead already contains the right stuff, now set
                        // the lefthead to the values of the last k-line.
                        lefthead.set(Vf[k0], k0);
                        lefthead.moveby(this.left);
                        // return the number of iterations of the outer loop
                        return d;
                    }
                }
            }

            for (k = -d+delta; k <= d+delta; k+=2) {
                k0 = this.nextSnakeHeadBackward(lefthead, k, -d+delta, d+delta, Vb);

                // check for overlap
                if (delta % 2 === 0 && k >= -d && k <= d) {
                    if (Vf[k] >= Vb[k]) {
                        // lefthead already contains the right stuff, now set
                        // the righthead to the values of the last k-line.
                        righthead.set(Vb[k0], k0);
                        righthead.moveby(this.left);
                        // return the number of iterations of the outer loop
                        return d;
                    }
                }
            }
        }
    };


    /**
     * Compute longest common subsequence using myers divide & conquer linear
     * space algorithm.
     *
     * Given that the two sequences A and B were supplied to the Editgraph
     * constructor, invoke the callback for each pair A[x], B[y] which is part
     * of the longest common subsequence of A and B.
     *
     * This algorithm works with strings and arrays. In order to modify the
     * equality-test, just override the equals(a, b) method on the Editgraph
     * object.
     *
     * Usage:
     * <code>
     * var lcs = [];
     * var A = 'abcabba';
     * var B = 'cbabac';
     * var graph = new Editgraph(A, B);
     * graph.forEachCommonSymbolInLCS(function(x, y) {
     *     lcs.push(A[x]);
     * });
     * console.log(lcs);
     * // -> [ 'c', 'a', 'b', 'a' ]
     * </code>
     *
     * @param callback  A function(x, y) called for A[x] and B[y] for symbols
     *                  taking part in the LCS.
     * @param T         Context object bound to "this" when the callback is
     *                  invoked.
     *
     * Note: If you call this method repeatedly on the same object, you should
     * reset the limits using Editgraph.limit() method.
     */
    Editgraph.prototype.forEachCommonSymbolInLCS = function(callback, T) {
        var M = this.M,
            N = this.N,
            left = this.left.copy(),
            right = this.right.copy(),
            midleft = new SnakeHead(),
            midright = new SnakeHead(),
            midsnake = new Snake(midleft, midright),
            head = new Snake(left, midleft),
            tail = new Snake(midright, right),
            d;

        // Return if there is nothing left
        if (M <= 0 || N <= 0) {
            return;
        }

        // Find the middle snake and store the result in midleft and midright
        d = this.middleSnake(midleft, midright);

        if (d > 1) {
            // Recurse on the left part
            this.limit(left, midleft);
            this.forEachCommonSymbolInLCS(callback, T);

            // Call the callback for each symbol in the middle snake
            midsnake.forEachCommonSymbolForward(function(x, y) {
                callback.call(T, x, y);
            });

            // Recurse on the right part
            this.limit(midright, right);
            this.forEachCommonSymbolInLCS(callback, T);
        }
        else {
            // We've reached the point where head, midsnake and tail build a
            // consecutive path. Identify all common symbols and deliver them
            // to the callback.
            [head, midsnake, tail].forEach(function(snake) {
                snake.forEachCommonSymbolForward(function(x, y) {
                    callback.call(T, x, y);
                });
            });
        }
    };


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
            (new Snake(head.previous, head)).forEachCommonSymbolBackward(function(x,y) {
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
        var snake;

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
            snake = new Snake(head.previous, head);
            pos = snake.editPosition();
            if (snake.editIsInsert()) {
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
    function SnakeHead(x, k) {
        /**
         * The x-coordinate of the snake head.
         */
        this.x = x;

        /**
         * The k-line on which the snake head is located at.
         */
        this.k = k;
    }


    /**
     * Return a new copy of this snake head.
     */
    SnakeHead.prototype.copy = function() {
        return new SnakeHead(this.x, this.k);
    };

    
    /**
     * Set the values of a snake head.
     */
    SnakeHead.prototype.set = function(x, k) {
        this.x = x;
        this.k = k;
    }


    /**
     * Transpose this snake head by adding the values of the given snake head.
     */
    SnakeHead.prototype.moveby = function(other) {
        this.x += other.x;
        this.k += other.k;
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
     * Snake
     */
    function Snake(left, right) {
        this.left = left;
        this.right = right;
    }


    /**
     * Calls callback for each common symbol encountered when traversing the
     * right snake bound by the left one from left to right.
     *
     * @param left Left snake head
     * @param right Right snake head
     */
    Snake.prototype.forEachCommonSymbolForward = function(callback, T) {
        var k = this.right.k;
        var x = k > this.left.k ? this.left.x + 1 : this.left.x;
        var xmax = this.right.x;

        while (x < xmax) {
            callback.call(T, x, x-k);
            x++;
        }
    };


    /**
     * Calls callback for each common symbol encountered when traversing the
     * right snake bound by the left one from right to left.
     *
     * @param left Left snake head
     * @param right Right snake head
     */
    Snake.prototype.forEachCommonSymbolBackward = function(callback, T) {
        var k = this.right.k;
        var xmin = k > this.left.k ? this.left.x + 1 : this.left.x;
        var x = this.right.x;

        while (x > xmin) {
            x--;
            callback.call(T, x, x-k);
        }
    };


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
     */
    Snake.prototype.edges = function() {
        var ox = this.left.x;
        var ok = this.left.k;
        var dx = this.right.x;
        var dk = this.right.k;

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


    /**
     * Returns the edit position for the operation between the two snake heads
     * left and right.
     */
    Snake.prototype.editPosition = function() {
        return this.left.toPoint();
    };


    /**
     * Returns true if the edit operation between the two snake heads left and
     * right is an insert operation. Returns false for a delete operation.
     */
    Snake.prototype.editIsInsert = function() {
        return this.left.k > this.right.k;
    };


    // CommonJS exports
    exports.Editgraph = Editgraph;
    exports.SnakeHead = SnakeHead;
    exports.Snake = Snake;

}(typeof exports === 'undefined' ? (this.editgraph={}) : exports));
