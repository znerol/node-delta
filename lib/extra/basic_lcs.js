/**
 * @file:   Extra methods for myers LCS algorithm implementing the basic
 *          version without linear space optimization.
 * @see:
 * * http://dx.doi.org/10.1007/BF01840446
 * * http://citeseer.ist.psu.edu/viewdoc/summary?doi=10.1.1.4.6927
 */

/**
 * Call a function for each D-Path identified using myers basic greedy lcs
 * algorithm.
 *
 * Returns the length of the shortest edit script, i.e. the minimal number
 * of insert and delete operations required to turn a into b.
 *
 * @param callback function(head, k0)
 */
DeltaJS.lcs.LCS.prototype.forEachSnakeHead = function (callback, T) {
    var d, k, head, k0, end;
    var V = {};

    V[1] = 0;
    head = new DeltaJS.lcs.KPoint();
    for (d = 0; d <= this.dmax; d++) {
        for (k = -d; k <= d; k+=2) {
            k0 = this.nextSnakeHeadForward(head, k, -d, d, V);
            callback.call(T, head, k0, d);

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
 * @param callback function(head, k0)
 */
DeltaJS.lcs.LCS.prototype.forEachReverseSnakeHead = function (callback, T) {
    var delta = this.delta;
    var d, k, head, k0, end;
    var V = {};

    V[delta-1] = this.N;
    head = new DeltaJS.lcs.KPoint();
    for (d = 0; d <= this.dmax; d++) {
        for (k = -d+delta; k <= d+delta; k+=2) {
            k0 = this.nextSnakeHeadBackward(head, k, -d+delta, d+delta, V);
            callback.call(T, head, k0, d);

            // check if we are done
            if (head.x <= this.left.x && head.k >= this.left.k) {
                return d;
            }
        }
    }
};
