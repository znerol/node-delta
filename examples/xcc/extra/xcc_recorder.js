/**
 * @file:   Subclass of XCC which allows to observe progress of the algorithm
 *          by intercepting function calls.
 */


DeltaJS.xcc.InstallMatchingRecorder = function(matching, recorder) {
    var orig = {};

    orig.put = matching.put;
    matching.put = function(b, a) {
        orig.put.apply(this, arguments);
        recorder.onPut(b, a);
    };
};

DeltaJS.xcc.InstallXCCRecorder = function(xcc, recorder) {
    var orig = {};

    orig.matchLeafLCS = xcc.matchLeafLCS;
    xcc.matchLeafLCS = function() {
        recorder.onMatchLeafLCS(arguments);
        orig.matchLeafLCS.apply(this, arguments);
    };

    orig.matchLeafUpdates = xcc.matchLeafUpdates;
    xcc.matchLeafUpdates = function() {
        recorder.onMatchLeafUpdates(arguments);
        orig.matchLeafUpdates.apply(this, arguments);
    };
}
