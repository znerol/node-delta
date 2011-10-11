(function(exports, lcs) {
    exports.testLcs = function(test) {
        var A = 'abcabba';
        var B = 'cbabac';

        var expect_lcs = ['c','a','b','a'];
        var actual_lcs_a = [];
        var actual_lcs_b = [];

        (new lcs.LCS(A, B)).forEachCommonSymbol(function(x, y) {
            actual_lcs_a.push(A[x]);
            actual_lcs_b.push(B[y]);
        });

        test.deepEqual(actual_lcs_a, expect_lcs);
        test.deepEqual(actual_lcs_b, expect_lcs);
        test.done();
    };
}(
    typeof exports === 'undefined' ? (this.lcsTest={}) : exports,
    typeof require === 'undefined' ? this.lcs : require('deltajs').lcs
));
