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
};

DeltaJS.lcs.FWLCS.prototype = new DeltaJS.lcs.LCS();

DeltaJS.lcs.FWLCS.prototype.compute = function (callback, T, limit) {
    var d, k, head, k0, xmax, ymax;
    var V = {};
    var snake_heads = {};

    if (!limit) {
        limit = this.defaultLimit();
    }
    xmax = limit.right.x;
    ymax = limit.right.x - limit.right.k;

    V[1] = 0;
    head = new DeltaJS.lcs.KPoint();
    for (d = 0; d <= limit.dmax; d++) {
        for (k = -d; k <= d; k+=2) {
            k0 = this.nextSnakeHeadForward(head, k, -d, d, limit, V);
            snake_heads[k] = head.copy();
            snake_heads[k].prev = snake_heads[k0];

            // If the bottom right corner is reached, output lcs by invoking
            // the callback for each pair of heads on the path.
            if (head.x >= xmax && head.x - head.k >= ymax) {
                for (head = snake_heads[k]; head && head.prev; head = head.prev) {
                    callback.call(T, head.prev, head);
                }
                callback.call(T, limit.left, head);

                return d;
            }
        }
    }

    return d;
};


/**
 * Create a new LCS instance implementing myers basic non-linear backward
 * algorithm for finding the longest common subsequence between a and b.
 */
DeltaJS.lcs.BWLCS = function (a, b) {
    DeltaJS.lcs.LCS.apply(this, arguments);
};

DeltaJS.lcs.BWLCS.prototype = new DeltaJS.lcs.LCS();

/**
 * Call a function for each reverse D-Path identified using myers basic
 * greedy lcs algorithm.
 *
 * Returns the length of the shortest edit script, i.e. the minimal number
 * of insert and delete operations required to turn a into b.
 *
 * @param callback function(lefthead, righthead)
 */
DeltaJS.lcs.BWLCS.prototype.compute = function (callback, T, limit) {
    var d, k, head, k0, delta, xmin, ymin;
    var V = {};
    var snake_heads = {};

    if (!limit) {
        limit = this.defaultLimit();
    }
    delta = limit.delta;
    xmin = limit.left.x;
    ymin = limit.left.x - limit.left.k;

    V[delta-1] = limit.N;
    head = new DeltaJS.lcs.KPoint();
    for (d = 0; d <= limit.dmax; d++) {
        for (k = -d+delta; k <= d+delta; k+=2) {
            k0 = this.nextSnakeHeadBackward(head, k, -d+delta, d+delta, limit, V);
            snake_heads[k] = head.copy();
            snake_heads[k].prev = snake_heads[k0];

            // If the top left corner is reached, output lcs by invoking the
            // callback for each pair of heads on the path.
            if (head.x <= xmin && head.x - head.k <= ymin) {
                for (head = snake_heads[k]; head && head.prev; head = head.prev) {
                    callback.call(T, head, head.prev);
                }
                callback.call(T, head, limit.right);

                return d;
            }
        }
    }

    return d;
};
