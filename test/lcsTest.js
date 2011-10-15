(function(exports, lcs) {
    /**
     * Example from myers paper
     */
    exports.testMyersExampleLcs = function(test) {
        var A = 'abcabba';
        var B = 'cbabac';

        var expect_lcs = ['c','a','b','a'];
        var actual_lcs_a = [];
        var actual_lcs_b = [];

        var d = (new lcs.LCS(A, B)).forEachCommonSymbol(function(x, y) {
            actual_lcs_a.push(A[x]);
            actual_lcs_b.push(B[y]);
        });

        test.equal(d, 5);
        test.deepEqual(actual_lcs_a, expect_lcs);
        test.deepEqual(actual_lcs_b, expect_lcs);
        test.done();
    };

    /**
     * If input A and input B are exactly the same, output must be same as input
     */
    exports.testContraryInput = function(test) {
        var A = 'xxxx';
        var B = 'xxxx';

        var expect_lcs = ['x', 'x', 'x', 'x'];
        var actual_lcs_a = [];
        var actual_lcs_b = [];

        var d = (new lcs.LCS(A, B)).forEachCommonSymbol(function(x, y) {
            actual_lcs_a.push(A[x]);
            actual_lcs_b.push(B[y]);
        });

        test.equal(d, 8);
        test.deepEqual(actual_lcs_a, expect_lcs);
        test.deepEqual(actual_lcs_b, expect_lcs);
        test.done();
    }

    /**
     * If input A and input B do not have any characters in common, output must
     * be empty
     */
    exports.testContraryInput = function(test) {
        var A = 'xxxx';
        var B = 'bbbb';

        var expect_lcs = [];
        var actual_lcs_a = [];
        var actual_lcs_b = [];

        var d = (new lcs.LCS(A, B)).forEachCommonSymbol(function(x, y) {
            actual_lcs_a.push(A[x]);
            actual_lcs_b.push(B[y]);
        });

        test.equal(d, 8);
        test.deepEqual(actual_lcs_a, expect_lcs);
        test.deepEqual(actual_lcs_b, expect_lcs);
        test.done();
    }

    /**
     * Edge case A=xyy B=x
     */
    exports.testEdgeCaseInputAxyyBx = function(test) {
        var A = 'xyy';
        var B = 'x';

        var expect_lcs = ['x'];
        var actual_lcs_a = [];
        var actual_lcs_b = [];

        var d = (new lcs.LCS(A, B)).forEachCommonSymbol(function(x, y) {
            actual_lcs_a.push(A[x]);
            actual_lcs_b.push(B[y]);
        });

        test.equal(d, 2);
        test.deepEqual(actual_lcs_a, expect_lcs);
        test.deepEqual(actual_lcs_b, expect_lcs);
        test.done();
    }

    /**
     * Edge case A=yxy B=x
     */
    exports.testEdgeCaseInputAyxyBx = function(test) {
        var A = 'yxy';
        var B = 'x';

        var expect_lcs = ['x'];
        var actual_lcs_a = [];
        var actual_lcs_b = [];

        var d = (new lcs.LCS(A, B)).forEachCommonSymbol(function(x, y) {
            actual_lcs_a.push(A[x]);
            actual_lcs_b.push(B[y]);
        });

        test.equal(d, 2);
        test.deepEqual(actual_lcs_a, expect_lcs);
        test.deepEqual(actual_lcs_b, expect_lcs);
        test.done();
    }

    /**
     * Edge case A=x B=xyy
     */
    exports.testEdgeCaseInputAxBxyy = function(test) {
        var A = 'x';
        var B = 'xyy';

        var expect_lcs = ['x'];
        var actual_lcs_a = [];
        var actual_lcs_b = [];

        var d = (new lcs.LCS(A, B)).forEachCommonSymbol(function(x, y) {
            actual_lcs_a.push(A[x]);
            actual_lcs_b.push(B[y]);
        });

        test.equal(d, 2);
        test.deepEqual(actual_lcs_a, expect_lcs);
        test.deepEqual(actual_lcs_b, expect_lcs);
        test.done();
    }

    /**
     * Edge case A=x B=yxy
     */
    exports.testEdgeCaseInputAxByxy = function(test) {
        var A = 'x';
        var B = 'yxy';

        var expect_lcs = ['x'];
        var actual_lcs_a = [];
        var actual_lcs_b = [];

        var d = (new lcs.LCS(A, B)).forEachCommonSymbol(function(x, y) {
            actual_lcs_a.push(A[x]);
            actual_lcs_b.push(B[y]);
        });

        test.equal(d, 2);
        test.deepEqual(actual_lcs_a, expect_lcs);
        test.deepEqual(actual_lcs_b, expect_lcs);
        test.done();
    }
    /**
     * Edge case A=yx B=x
     */
    exports.testEdgeCaseInputAyxBx = function(test) {
        var A = 'yx';
        var B = 'x';

        var expect_lcs = ['x'];
        var actual_lcs_a = [];
        var actual_lcs_b = [];

        var d = (new lcs.LCS(A, B)).forEachCommonSymbol(function(x, y) {
            actual_lcs_a.push(A[x]);
            actual_lcs_b.push(B[y]);
        });

        test.equal(d, 1);
        test.deepEqual(actual_lcs_a, expect_lcs);
        test.deepEqual(actual_lcs_b, expect_lcs);
        test.done();
    }

    /**
     * Edge case A=xy B=x
     */
    exports.testEdgeCaseInputAxyBx = function(test) {
        var A = 'xy';
        var B = 'x';

        var expect_lcs = ['x'];
        var actual_lcs_a = [];
        var actual_lcs_b = [];

        var d = (new lcs.LCS(A, B)).forEachCommonSymbol(function(x, y) {
            actual_lcs_a.push(A[x]);
            actual_lcs_b.push(B[y]);
        });

        test.equal(d, 1);
        test.deepEqual(actual_lcs_a, expect_lcs);
        test.deepEqual(actual_lcs_b, expect_lcs);
        test.done();
    }

    /**
     * Edge case A=x B=yx
     */
    exports.testEdgeCaseInputAxByx = function(test) {
        var A = 'x';
        var B = 'yx';

        var expect_lcs = ['x'];
        var actual_lcs_a = [];
        var actual_lcs_b = [];

        var d = (new lcs.LCS(A, B)).forEachCommonSymbol(function(x, y) {
            actual_lcs_a.push(A[x]);
            actual_lcs_b.push(B[y]);
        });

        test.equal(d, 1);
        test.deepEqual(actual_lcs_a, expect_lcs);
        test.deepEqual(actual_lcs_b, expect_lcs);
        test.done();
    }

    /**
     * Edge case A=x B=xy
     */
    exports.testEdgeCaseInputAxBxy = function(test) {
        var A = 'x';
        var B = 'xy';

        var expect_lcs = ['x'];
        var actual_lcs_a = [];
        var actual_lcs_b = [];

        var d = (new lcs.LCS(A, B)).forEachCommonSymbol(function(x, y) {
            actual_lcs_a.push(A[x]);
            actual_lcs_b.push(B[y]);
        });

        test.equal(d, 1);
        test.deepEqual(actual_lcs_a, expect_lcs);
        test.deepEqual(actual_lcs_b, expect_lcs);
        test.done();
    }

    /**
     * Regression: handle negative deltas (delta % 2 -> -1)
     */
    exports.testRegressionNegativeDelta = function(test) {
        var A = 'az';
        var B = 'xay';

        var expect_lcs = ['a'];
        var actual_lcs_a = [];
        var actual_lcs_b = [];

        var d = (new lcs.LCS(A, B)).forEachCommonSymbol(function(x, y) {
            actual_lcs_a.push(A[x]);
            actual_lcs_b.push(B[y]);
        });

        test.equal(d, 3);
        test.deepEqual(actual_lcs_a, expect_lcs);
        test.deepEqual(actual_lcs_b, expect_lcs);
        test.done();
    }

    /**
     * Regression: dmax/2 must be ceiled, otherwise outer loop may terminate
     * prematurely
     */
    exports.testRegressionDmaxDiv2 = function(test) {
        var A = 'x';
        var B = 'yz';

        var expect_lcs = [];
        var actual_lcs_a = [];
        var actual_lcs_b = [];

        var d = (new lcs.LCS(A, B)).forEachCommonSymbol(function(x, y) {
            actual_lcs_a.push(A[x]);
            actual_lcs_b.push(B[y]);
        });

        test.equal(d, 3);
        test.deepEqual(actual_lcs_a, expect_lcs);
        test.deepEqual(actual_lcs_b, expect_lcs);
        test.done();
    }

    /**
     * If both input strings are empty, output must be empty too
     */
    exports.testEmptyInput = function(test) {
        var A = '';
        var B = '';

        var expect_lcs = [];
        var actual_lcs_a = [];
        var actual_lcs_b = [];

        var d = (new lcs.LCS(A, B)).forEachCommonSymbol(function(x, y) {
            actual_lcs_a.push(A[x]);
            actual_lcs_b.push(B[y]);
        });

        test.equal(d, 0);
        test.deepEqual(actual_lcs_a, expect_lcs);
        test.deepEqual(actual_lcs_b, expect_lcs);
        test.done();
    }

}(
    typeof exports === 'undefined' ? (DeltaJS.lcsTest={}) : exports,
    typeof require === 'undefined' ? DeltaJS.lcs : require('deltajs').lcs
));
