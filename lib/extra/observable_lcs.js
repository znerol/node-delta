/**
 * @file:   Subclass of LCS which allows to observe progress of the algorithm
 *          by intercepting function calls.
 */

DeltaJS.lcs.ObservableLCS = function(a, b, left, right) {
    var result;
    console.log('Enter ObservableLCS(' + arguments + ')');
    result = DeltaJS.lcs.LCS.apply(this, arguments);
    console.log('Leave ObservableLCS -> ' + result);
    return result;
}

DeltaJS.lcs.ObservableLCS.prototype = new DeltaJS.lcs.LCS('','');

DeltaJS.lcs.ObservableLCS.prototype.forEachCommonSymbol = function(callback, T) {
    var result;
    console.log('Enter forEachCommonSymbol(' + arguments + ')');
    result = DeltaJS.lcs.LCS.apply(this, arguments);
    console.log('Leave forEachCommonSymbol -> ' + result);
    return result;
}

DeltaJS.lcs.ObservableLCS.prototype.limit = function(left, right) {
    var result;
    console.log('Enter limit(' + arguments + ')');
    result = DeltaJS.lcs.LCS.prototype.limit.apply(this, arguments);
    console.log('Leave limit -> ' + result);
    return result;
}

DeltaJS.lcs.ObservableLCS.prototype.nextSnakeHeadForward = function(head, k, kmin, kmax, V) {
    var result;
    console.log('Enter nextSnakeHeadForward(' + arguments + ')');
    result = DeltaJS.lcs.LCS.prototype.nextSnakeHeadForward.apply(this, arguments);
    console.log('Leave nextSnakeHeadForward -> ' + result);
    return result;
}

DeltaJS.lcs.ObservableLCS.prototype.nextSnakeHeadBackward = function(head, k, kmin, kmax, V) {
    var result;
    console.log('Enter nextSnakeHeadBackward(' + arguments + ')');
    result = DeltaJS.lcs.LCS.prototype.nextSnakeHeadBackward.apply(this, arguments);
    console.log('Leave nextSnakeHeadBackward -> ' + result);
    return result;
}

DeltaJS.lcs.ObservableLCS.prototype.middleSnake = function (lefthead, righthead) {
    var result;
    console.log('Enter middleSnake(' + arguments + ')');
    result = DeltaJS.lcs.LCS.prototype.middleSnake.apply(this, arguments);
    console.log('Leave middleSnake -> ' + result);
    return result;
}
