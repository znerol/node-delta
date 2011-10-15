/**
 * @file:   Implementation of Myers linear space longest common subsequence
 *          algorithm.
 * @see:
 * * http://dx.doi.org/10.1007/BF01840446
 * * http://citeseer.ist.psu.edu/viewdoc/summary?doi=10.1.1.4.6927
 */

(function(exports){
    /**
     * Create a new instance of the LCS implementation.
     *
     * @param a     The first sequence
     * @param b     The second sequence
     * @param left  An optional limit for the start-point (see LCS.limit())
     * @param right An optional limit for the end-point
     */
    function LCS(a, b, left, right) {
        this.a = a;
        this.b = b;

        this.limit(left, right);
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
     *
     * Note: If you call this method repeatedly on the same object, you should
     * reset the limits using LCS.limit() method.
     */
    LCS.prototype.forEachCommonSymbol = function(callback, T) {
        var M = this.M,
            N = this.N,
            left = this.left.copy(),
            right = this.right.copy(),
            midleft = new KPoint(),
            midright = new KPoint(),
            d;

        // Return if there is nothing left
        if (M <= 0 || N <= 0) {
            return;
        }

        // Find the middle snake and store the result in midleft and midright
        d = this.middleSnake(midleft, midright);

        if (d > 1) {
            // Recurse on the right part if there are more snakes
            this.limit(left, midleft);
            this.forEachCommonSymbol(callback, T);
        }
        else {
            // Otherwise callback
            this.forEachPositionInSnake(left, midleft, callback, T);
        }

        // Call the callback for each symbol in the middle snake
        this.forEachPositionInSnake(midleft, midright, callback, T);

        if (d > 1) {
            // Recurse on the right part if there are more snakes
            this.limit(midright, right);
            this.forEachCommonSymbol(callback, T);
        }
        else {
            // Otherwise callback
            this.forEachPositionInSnake(midright, right, callback, T);
        }
    };


    /**
     * Limit operating range of subsequent computations to the given positions.
     *
     * @param left  A KPoint marking the start-point of the calculation.
     * @param right A KPoint marking the last position considered in the
     *              calculation.
     */
    LCS.prototype.limit = function(left, right) {
        this.left = (typeof left !== 'undefined') ? left :
            new KPoint(0,0);

        this.right = (typeof right !== 'undefined') ? right :
            new KPoint(this.a.length, this.a.length - this.b.length);

        this.N = this.right.x - this.left.x;
        this.M = (this.right.x - this.right.k) - (this.left.x - this.left.k);

        this.delta = this.N - this.M;
        this.dmax = (typeof dmax !== 'undefined') ? dmax : this.N + this.M;
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
     * @param V     (In-/Out) Vector containing the results of previous
     *              calculations. This vector gets updated automatically by
     *              nextSnakeHeadForward method.
     */
    LCS.prototype.nextSnakeHeadForward = function(head, k, kmin, kmax, V) {
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
     * @param V     (In-/Out) Vector containing the results of previous
     *              calculations. This vector gets updated automatically by
     *              nextSnakeHeadForward method.
     */
    LCS.prototype.nextSnakeHeadBackward = function(head, k, kmin, kmax, V) {
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
     * Internal use. Find the middle snake and set lefthead to the left end and
     * righthead to the right end.
     *
     * @param lefthead  (Output) A reference to a KPoint which will be
     *                  populated with the values corresponding to the left end
     *                  of the middle snake.
     * @param righthead (Output) A reference to a KPoint which will be
     *                  populated with the values corresponding to the right
     *                  end of the middle snake.
     * @returns d, number of iterations necessary to find the middle snake.
     */
    LCS.prototype.middleSnake = function (lefthead, righthead) {
        var d, k, head, k0;
        var delta = this.delta;
        var checkBwSnake = (delta % 2 === 0);
        var Vf = {};
        var Vb = {};

        Vf[1] = 0;
        Vb[delta-1] = this.N;
        for (d = 0; d <= this.dmax/2; d++) {
            for (k = -d; k <= d; k+=2) {
                k0 = this.nextSnakeHeadForward(righthead, k, -d, d, Vf);

                // check for overlap
                if (!checkBwSnake && k >= -d-1+delta && k <= d-1+delta) {
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
                if (checkBwSnake && k >= -d && k <= d) {
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
     */
    function KPoint(x, k) {
        /**
         * The x-coordinate of the k-point.
         */
        this.x = x;

        /**
         * The k-line on which the k-point is located at.
         */
        this.k = k;
    }


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
    };


    /**
     * Transpose this k-point by adding the values of the given k-point.
     */
    KPoint.prototype.moveby = function(other) {
        this.x += other.x;
        this.k += other.k;
    };


    // CommonJS exports
    exports.LCS = LCS;
    exports.KPoint = KPoint;

}(typeof exports === 'undefined' ? (DeltaJS.lcs={}) : exports));
