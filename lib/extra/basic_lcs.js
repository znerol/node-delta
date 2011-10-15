/**
 * @file:   Extra methods for myers LCS algorithm implementing the basic
 *          version without linear space optimization.
 * @see:
 * * http://dx.doi.org/10.1007/BF01840446
 * * http://citeseer.ist.psu.edu/viewdoc/summary?doi=10.1.1.4.6927
 */


/**
 * Create a new LCS instance implementing myers basic non-linear forward
 * algorithm for finding the longest common subsequence between a and b.
 */
DeltaJS.lcs.FWLCS = function (a, b) {
    DeltaJS.lcs.LCS.apply(this, arguments);
}

DeltaJS.lcs.FWLCS.prototype = new DeltaJS.lcs.LCS();

DeltaJS.lcs.FWLCS.prototype.compute = function (callback, T, limit) {
    var d, k, head, k0;
    var limit = limit || this.defaultLimit();
    var V = {};
    var snake_heads = {};

    V[1] = 0;
    head = new DeltaJS.lcs.KPoint();
    for (d = 0; d <= limit.dmax; d++) {
        for (k = -d; k <= d; k+=2) {
            k0 = this.nextSnakeHeadForward(head, k, -d, d, limit, V);
            snake_heads[k] = head.copy();
            snake_heads[k].prev = snake_heads[k0];

            // Take another round if head is still inside the region
            if (head.x < Math.max(limit.right.x, limit.right.x - limit.right.k + head.k)) {
                continue;
            }

            // Done. Output common symbols by followng the prev-pointers until
            // (0,0)
            for (head = snake_heads[k]; head && head.prev; head = head.prev) {
                callback.call(T, head.prev, head);
            }
            callback.call(T, limit.left, head);

            return d;
        }
    }
};


/**
 * Create a new LCS instance implementing myers basic non-linear backward
 * algorithm for finding the longest common subsequence between a and b.
 */
DeltaJS.lcs.BWLCS = function (a, b) {
    DeltaJS.lcs.LCS.apply(this, arguments);
}

DeltaJS.lcs.BWLCS.prototype = new DeltaJS.lcs.LCS();

/**
 * Call a function for each reverse D-Path identified using myers basic
 * greedy lcs algorithm.
 *
 * Returns the length of the shortest edit script, i.e. the minimal number
 * of insert and delete operations required to turn a into b.
 *
 * @param callback function(head, k0)
 */
DeltaJS.lcs.BWLCS.prototype.compute = function (callback, T, limit) {
    var d, k, head, k0;
    var limit = limit || this.defaultLimit();
    var delta = limit.delta;
    var V = {};
    var snake_heads = {};

    V[delta-1] = limit.N;
    head = new DeltaJS.lcs.KPoint();
    for (d = 0; d <= limit.dmax; d++) {
        for (k = -d+delta; k <= d+delta; k+=2) {
            k0 = this.nextSnakeHeadBackward(head, k, -d+delta, d+delta, limit, V);
            snake_heads[k] = head.copy();
            snake_heads[k].prev = snake_heads[k0];

            // Take another round if head is still inside the region
            if (head.x > Math.min(limit.left.x, limit.left.x - limit.left.k + head.k)) {
                continue;
            }

            // Done. Output common symbols by followng the prev-pointers until
            // (N,M)
            for (head = snake_heads[k]; head && head.prev; head = head.prev) {
                callback.call(T, head, head.prev);
            }
            callback.call(T, head, limit.right);

            return d;
        }
    }
};
