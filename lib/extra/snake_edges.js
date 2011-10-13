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
DeltaJS.lcs.snake_edges = function(origin, dest) {
    var ox = origin.x;
    var ok = origin.k;
    var dx = dest.x;
    var dk = dest.k;

    // Initialy set x-coordinate of mid-point M to origins x.
    var mx = ox;
    var result = [];

    // M is dest of O if destinations k is greater than origins k and
    // destinations x is greater than origins x.
    if (dk > ok && dx > ox) {
        mx++;
    }
    // M is origin of O if destinations k is smaller than origins k and
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
