/**
 * @file:   Subclass of LCS which allows to observe progress of the algorithm
 *          by intercepting function calls.
 */


DeltaJS.lcs.InstallLCSRecorder = function(lcs, recorder) {
    var orig = {};

    orig.limit = lcs.limit;
    lcs.limit = function(left, right) {
        orig.limit.apply(this, arguments);
        recorder.onLimit.call(recorder, this.left, this.right, this.N, this.M, this.delta, this.dmax);
    }

    orig.nextSnakeHeadForward = lcs.nextSnakeHeadForward;
    lcs.nextSnakeHeadForward = function(head, k, kmin, kmax, V) {
        var k0 = orig.nextSnakeHeadForward.apply(this, arguments);
        var d = kmax;
        recorder.onSnakeHead.call(recorder, head, k0, d, false);
        return k0;
    }

    orig.nextSnakeHeadBackward = lcs.nextSnakeHeadBackward;
    lcs.nextSnakeHeadBackward = function(head, k, kmin, kmax, V) {
        var k0 = orig.nextSnakeHeadBackward.apply(this, arguments);
        var d = kmax-this.delta;
        recorder.onSnakeHead.call(recorder, head, k0, d, true);
        return k0;
    }

    orig.middleSnake = lcs.middleSnake;
    lcs.middleSnake = function(lefthead, righthead) {
        var d = orig.middleSnake.apply(this, arguments);
        recorder.onMiddleSnake.call(recorder, lefthead, righthead, d);
        return d;
    }
}
