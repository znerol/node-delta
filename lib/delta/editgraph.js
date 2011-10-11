/**
 * @file:   Implementation of Myers longest common subsequence algorithm using
 *          an edit graph.
 * @see:
 * * http://dx.doi.org/10.1007/BF01840446
 * * http://citeseer.ist.psu.edu/viewdoc/summary?doi=10.1.1.4.6927
 */

(function(exports){
    function Editgraph(a, b, origin, dest, dmax) {
        this.a = a;
        this.b = b;

        this.limit(origin, dest, dmax);
    }

    Editgraph.prototype.equals = function(a, b) {
        return (a === b);
    };


    /**
     * Limit operating range of subsequent computations to the given snake head
     * positions.
     */
    Editgraph.prototype.limit = function(origin, dest, dmax) {
        this.origin = (typeof origin !== 'undefined') ? origin :
            new SnakeHead(0,0);

        this.dest = (typeof dest !== 'undefined') ? dest :
            new SnakeHead(this.a.length, this.origin.k + this.a.length - this.b.length);

        this.N = this.dest.x - this.origin.x;
        this.M = (this.dest.x - this.dest.k) - (this.origin.x - this.origin.k);

        this.delta = this.N - this.M;
        this.dmax = (typeof dmax !== 'undefined') ? dmax : this.N + this.M;
    }


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
                if (head.x >= this.dest.x && head.k <= this.dest.k) {
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
                if (head.x <= this.origin.x && head.k >= this.origin.k) {
                    return d;
                }
            }
        }
    };

    Editgraph.prototype.nextSnakeHeadForward = function(head, k, kmin, kmax, V) {
        var k0, x, bx, by, n;

        // Store current k-value in the snake head.
        head.k = this.origin.k + k;

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
        bx = this.origin.x;
        by = bx - (this.origin.k + k);
        n = Math.min(this.N, this.M + k);
        while (x < n && this.equals(this.a[bx + x], this.b[by + x])) {
            x++;
        }

        // Store x value of snake head after traversing the diagonal in forward
        // direction.
        head.x = this.origin.x + x;

        // Memozie furthest reaching x for k
        V[k] = x;

        // Return k-value of preceeding snake head
        return k0;
    };


    Editgraph.prototype.nextSnakeHeadBackward = function(head, k, kmin, kmax, V) {
        var k0, x, bx, by;

        // Store current k-value in the snake head.
        head.k = this.origin.k + k;

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
        head.x = this.origin.x + x;

        // Follow the diagonal as long as there are common values in a and b.
        bx = this.origin.x - 1;
        by = bx - (this.origin.k + k);
        while (x > k && this.equals(this.a[bx + x], this.b[by + x])) {
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
    Editgraph.prototype.middleSnake = function (snake, onhead, T) {
        var d, k, head, k0;
        var delta = this.delta;
        var Vf = {};
        var Vb = {};

        Vf[1] = 0;
        Vb[delta-1] = this.N;
        head = new SnakeHead();
        for (d = 0; d <= this.dmax/2; d++) {
            for (k = -d; k <= d; k+=2) {
                k0 = this.nextSnakeHeadForward(head, k, -d, d, Vf);
                if (onhead) {
                    onhead.call(T, head, k0, d);
                }

                // check for overlap
                if (delta % 2 === 1 && k >= -d-1+delta && k <= d-1+delta) {
                    if (Vf[k] >= Vb[k]) {
                        // return last snake of the forward path
                        snake.left = new SnakeHead(this.origin.x + Vf[k0], this.origin.k + k0);
                        snake.right = head;
                        return d;
                    }
                }
            }

            for (k = -d+delta; k <= d+delta; k+=2) {
                k0 = this.nextSnakeHeadBackward(head, k, -d+delta, d+delta, Vb);
                if (onhead) {
                    onhead.call(T, head, k0, d);
                }

                // check for overlap
                if (delta % 2 === 0 && k >= -d && k <= d) {
                    if (Vf[k] >= Vb[k]) {
                        // return last snake of the reverse path
                        snake.left = head;
                        snake.right = new SnakeHead(this.origin.x + Vb[k0], this.origin.k + k0);
                        return d;
                    }
                }
            }
        }
    }


    Editgraph.prototype.compute = function(editor) {
        var M = this.M,
            N = this.N,
            left = this.origin.copy(),
            right = this.dest.copy(),
            d;
        var head, tail;
        var middle = new Snake();

        if (M<=0 || N<=0) {
            return;
        }

        d = this.middleSnake(middle);
        if (d > 1) {
            this.limit(left, middle.left);
            this.compute(editor);

            middle.forEachCommonSymbolForward(function(x, y) {
                editor.skip(this.a, x);
                editor.skip(this.b, y);
            }, this);

            this.limit(middle.right, right);
            this.compute(editor);
        }
        else {
            head = new Snake(left, middle.left);
            tail = new Snake(middle.right, right);
            [head, middle, tail].forEach(function(snake) {
                snake.forEachCommonSymbolForward(function(x, y) {
                    editor.skip(this.a, x);
                    editor.skip(this.b, y);
                }, this);
            }, this);
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
    }


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
    }


    /**
     * Returns true if the edit operation between the two snake heads left and
     * right is an insert operation. Returns false for a delete operation.
     */
    Snake.prototype.editIsInsert = function() {
        return this.left.k > this.right.k;
    }


    // CommonJS exports
    exports.Editgraph = Editgraph;
    exports.SnakeHead = SnakeHead;
    exports.Snake = Snake;

}(typeof exports === 'undefined' ? (this.editgraph={}) : exports));
