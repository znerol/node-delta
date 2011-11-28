/**
 * @file:   Implementation of Myers linear space longest common subsequence
 *          algorithm.
 * @see:
 * * http://dx.doi.org/10.1007/BF01840446
 * * http://citeseer.ist.psu.edu/viewdoc/summary?doi=10.1.1.4.6927
 *
 * @module  lcs
 */

/**
 * Create a new instance of the LCS implementation.
 *
 * @param a     The first sequence
 * @param b     The second sequence
 *
 * @constructor
 */
function LCS(a, b) {
    this.a = a;
    this.b = b;
}


/**
 * Returns true if the sequence members a and b are equal. Override this
 * method if your sequences contain special things.
 */
LCS.prototype.equals = function(a, b) {
    return (a === b);
};


/**
 * Compute longest common subsequence using myers divide & conquer linear
 * space algorithm.
 *
 * Call a callback for each snake which is part of the longest common
 * subsequence.
 *
 * This algorithm works with strings and arrays. In order to modify the
 * equality-test, just override the equals(a, b) method on the LCS
 * object.
 *
 * @param callback  A function(x, y) called for A[x] and B[y] for symbols
 *                  taking part in the LCS.
 * @param T         Context object bound to "this" when the callback is
 *                  invoked.
 * @param limit     A Limit instance constraining the window of operation to
 *                  the given limit. If undefined the algorithm will iterate
 *                  over the whole sequences a and b.
 */
LCS.prototype.compute = function(callback, T, limit) {
    var midleft = new exports.KPoint(),
        midright = new exports.KPoint(),
        d;

    if (typeof limit === 'undefined') {
        limit = this.defaultLimit();
    }

    // Return if there is nothing left
    if (limit.N <= 0 && limit.M <= 0) {
        return 0;
    }

    // Callback for each right-edge when M is zero and return number of
    // edit script operations.
    if (limit.N > 0 && limit.M === 0) {
        midleft.set(0, 0).translate(limit.left);
        midright.set(1, 1).translate(limit.left);
        for (d = 0; d < limit.N; d++) {
            callback.call(T, midleft, midright);
            midleft.moveright();
            midright.moveright();
        }
        return d;
    }

    // Callback for each down-edge when N is zero and return number of edit
    // script operations.
    if (limit.N === 0 && limit.M > 0) {
        midleft.set(0, 0).translate(limit.left);
        midright.set(0, -1).translate(limit.left);
        for (d = 0; d < limit.M; d++) {
            callback.call(T, midleft, midright);
            midleft.movedown();
            midright.movedown();
        }
        return d;
    }

    // Find the middle snake and store the result in midleft and midright
    d = this.middleSnake(midleft, midright, limit);

    if (d === 0) {
        // No single insert / delete operation was identified by the middle
        // snake algorithm, this means that all the symbols between left and
        // right are equal -> one straight diagonal on k=0
        if (!limit.left.equal(limit.right)) {
            callback.call(T, limit.left, limit.right);
        }
    }
    else if (d === 1) {
        // Middle-snake algorithm identified exactly one operation. Report
        // the involved snake(s) to the caller.
        if (!limit.left.equal(midleft)) {
            callback.call(T, limit.left, midleft);
        }

        if (!midleft.equal(midright)) {
            callback.call(T, midleft, midright);
        }

        if (!midright.equal(limit.right)) {
            callback.call(T, midright, limit.right);
        }
    }
    else {
        // Recurse if the middle-snake algorithm encountered more than one
        // operation.
        if (!limit.left.equal(midleft)) {
            this.compute(callback, T, new exports.Limit(limit.left, midleft));
        }

        if (!midleft.equal(midright)) {
            callback.call(T, midleft, midright);
        }

        if (!midright.equal(limit.right)) {
            this.compute(callback, T, new exports.Limit(midright, limit.right));
        }
    }

    return d;
};


/**
 * Call a callback for each symbol which is part of the longest common
 * subsequence between A and B.
 *
 * Given that the two sequences A and B were supplied to the LCS
 * constructor, invoke the callback for each pair A[x], B[y] which is part
 * of the longest common subsequence of A and B.
 *
 * This algorithm works with strings and arrays. In order to modify the
 * equality-test, just override the equals(a, b) method on the LCS
 * object.
 *
 * Usage:
 * <code>
 * var lcs = [];
 * var A = 'abcabba';
 * var B = 'cbabac';
 * var l = new LCS(A, B);
 * l.forEachCommonSymbol(function(x, y) {
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
 */
LCS.prototype.forEachCommonSymbol = function(callback, T) {
    return this.compute(function(left, right) {
        this.forEachPositionInSnake(left, right, callback, T);
    }, this);
};


/**
 * Internal use. Compute new values for the next head on the given k-line
 * in forward direction by examining the results of previous calculations
 * in V in the neighborhood of the k-line k.
 *
 * @param head  (Output) Reference to a KPoint which will be populated
 *              with the new values
 * @param k     (In) Current k-line
 * @param kmin  (In) Lowest k-line in current d-round
 * @param kmax  (In) Highest k-line in current d-round
 * @param limit (In) Current lcs search limits (left, right, N, M, delta, dmax)
 * @param V     (In-/Out) Vector containing the results of previous
 *              calculations. This vector gets updated automatically by
 *              nextSnakeHeadForward method.
 */
LCS.prototype.nextSnakeHeadForward = function(head, k, kmin, kmax, limit, V) {
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
    bx = limit.left.x;
    by = bx - (limit.left.k + k);
    n = Math.min(limit.N, limit.M + k);
    while (x < n && this.equals(this.a[bx + x], this.b[by + x])) {
        x++;
    }

    // Store x value of snake head after traversing the diagonal in forward
    // direction.
    head.set(x, k).translate(limit.left);

    // Memozie furthest reaching x for k
    V[k] = x;

    // Return k-value of preceeding snake head
    return k0;
};


/**
 * Internal use. Compute new values for the next head on the given k-line
 * in reverse direction by examining the results of previous calculations
 * in V in the neighborhood of the k-line k.
 *
 * @param head  (Output) Reference to a KPoint which will be populated
 *              with the new values
 * @param k     (In) Current k-line
 * @param kmin  (In) Lowest k-line in current d-round
 * @param kmax  (In) Highest k-line in current d-round
 * @param limit (In) Current lcs search limits (left, right, N, M, delta, dmax)
 * @param V     (In-/Out) Vector containing the results of previous
 *              calculations. This vector gets updated automatically by
 *              nextSnakeHeadForward method.
 */
LCS.prototype.nextSnakeHeadBackward = function(head, k, kmin, kmax, limit, V) {
    var k0, x, bx, by, n;

    // Determine the preceeding snake head. Pick the one whose furthest
    // reaching x value is greatest.
    if (k === kmax || (k !== kmin && V[k-1] < V[k+1])) {
        // Furthest reaching snake is underneath (k-1), move up.
        k0 = k-1;
        x = V[k0];
    }
    else {
        // Furthest reaching snake is left (k-1), move right.
        k0 = k+1;
        x = V[k0]-1;
    }

    // Store x value of snake head before traversing the diagonal in
    // reverse direction.
    head.set(x, k).translate(limit.left);

    // Follow the diagonal as long as there are common values in a and b.
    bx = limit.left.x - 1;
    by = bx - (limit.left.k + k);
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
 * Internal use. Find the middle snake and set lefthead to the left end and
 * righthead to the right end.
 *
 * @param lefthead  (Output) A reference to a KPoint which will be
 *                  populated with the values corresponding to the left end
 *                  of the middle snake.
 * @param righthead (Output) A reference to a KPoint which will be
 *                  populated with the values corresponding to the right
 *                  end of the middle snake.
 * @param limit     (In) Current lcs search limits (left, right, N, M, delta, dmax)
 *
 * @returns         d, number of edit script operations encountered within
 *                  the given limit
 */
LCS.prototype.middleSnake = function (lefthead, righthead, limit) {
    var d, k, head, k0;
    var delta = limit.delta;
    var dmax = Math.ceil(limit.dmax / 2);
    var checkBwSnake = (delta % 2 === 0);
    var Vf = {};
    var Vb = {};

    Vf[1] = 0;
    Vb[delta-1] = limit.N;
    for (d = 0; d <= dmax; d++) {
        for (k = -d; k <= d; k+=2) {
            k0 = this.nextSnakeHeadForward(righthead, k, -d, d, limit, Vf);

            // check for overlap
            if (!checkBwSnake && k >= -d-1+delta && k <= d-1+delta) {
                if (Vf[k] >= Vb[k]) {
                    // righthead already contains the right stuff, now set
                    // the lefthead to the values of the last k-line.
                    lefthead.set(Vf[k0], k0).translate(limit.left);
                    // return the number of edit script operations
                    return 2 * d - 1;
                }
            }
        }

        for (k = -d+delta; k <= d+delta; k+=2) {
            k0 = this.nextSnakeHeadBackward(lefthead, k, -d+delta, d+delta, limit, Vb);

            // check for overlap
            if (checkBwSnake && k >= -d && k <= d) {
                if (Vf[k] >= Vb[k]) {
                    // lefthead already contains the right stuff, now set
                    // the righthead to the values of the last k-line.
                    righthead.set(Vb[k0], k0).translate(limit.left);
                    // return the number of edit script operations
                    return 2 * d;
                }
            }
        }
    }
};


/**
 * Return the default limit spanning the whole input
 */
LCS.prototype.defaultLimit = function() {
    return new exports.Limit(
            new exports.KPoint(0,0),
            new exports.KPoint(this.a.length, this.a.length - this.b.length));
};


/**
 * Invokes a function for each position in the snake between the left and
 * the right snake head.
 *
 * @param left      Left KPoint
 * @param right     Right KPoint
 * @param callback  Callback of the form function(x, y)
 * @param T         Context object bound to "this" when the callback is
 *                  invoked.
 */
LCS.prototype.forEachPositionInSnake = function(left, right, callback, T) {
    var k = right.k;
    var x = (k > left.k) ? left.x + 1 : left.x;
    var n = right.x;

    while (x < n) {
        callback.call(T, x, x-k);
        x++;
    }
};


/**
 * Create a new KPoint instance.
 *
 * A KPoint represents a point identified by an x-coordinate and the
 * number of the k-line it is located at.
 *
 * @constructor
 */
var KPoint = function(x, k) {
    /**
     * The x-coordinate of the k-point.
     */
    this.x = x;

    /**
     * The k-line on which the k-point is located at.
     */
    this.k = k;
};


/**
 * Return a new copy of this k-point.
 */
KPoint.prototype.copy = function() {
    return new KPoint(this.x, this.k);
};


/**
 * Set the values of a k-point.
 */
KPoint.prototype.set = function(x, k) {
    this.x = x;
    this.k = k;
    return this;
};


/**
 * Translate this k-point by adding the values of the given k-point.
 */
KPoint.prototype.translate = function(other) {
    this.x += other.x;
    this.k += other.k;
    return this;
};


/**
 * Move the point left by d units
 */
KPoint.prototype.moveleft = function(d) {
    this.x -= d || 1;
    this.k -= d || 1;
    return this;
};


/**
 * Move the point right by d units
 */
KPoint.prototype.moveright = function(d) {
    this.x += d || 1;
    this.k += d || 1;
    return this;
};


/**
 * Move the point up by d units
 */
KPoint.prototype.moveup = function(d) {
    this.k -= d || 1;
    return this;
};


/**
 * Move the point down by d units
 */
KPoint.prototype.movedown = function(d) {
    this.k += d || 1;
    return this;
};


/**
 * Returns true if the given k-point has equal values
 */
KPoint.prototype.equal = function(other) {
    return (this.x === other.x && this.k === other.k);
};


/**
 * Create a new LCS Limit instance. This is a pure data object which holds
 * precalculated parameters for the lcs algorithm.
 *
 * @constructor
 */
var Limit = function(left, right) {
    this.left = left;
    this.right = right;
    this.delta = right.k - left.k;
    this.N = right.x - left.x;
    this.M = this.N - this.delta;
    this.dmax = this.N + this.M;
};


// CommonJS exports
exports.LCS = LCS;
exports.KPoint = KPoint;
exports.Limit = Limit;
