(function(exports, lcs) {
    function Diff(a, b) {
        this.a = a; // Root node of tree a
        this.b = b; // Root node of tree b
    }

    Diff.prototype.matchTrees = function() {
        var a_leaves = [];
        var b_leaves = [];
        var lcsinst = new lcs.LCS(a_leaves, b_leaves);

        // Setup LCS instance, override the equality-test
        lcsinst.equals = function(a, b) {
            return a.value === b.value && a.depth === b.depth;
        };

        // Populate leave-node arrays
        this.a.forEach(function(n) {
            if (n.children.length === 0) {
                a_leaves.push(n);
            }
        });
        this.b.forEach(function(n) {
            if (n.children.length === 0) {
                b_leaves.push(n);
            }
        });

        lcsinst.forEachCommonSymbol(function(a, b) {
            b_leaves[b].associate(a_leaves[a]);
        });
    };

    exports.Diff = Diff;

}(
    typeof exports === 'undefined' ? (DeltaJS.xcc={}) : exports,
    typeof require === 'undefined' ? DeltaJS.lcs : require('deltajs').lcs
));
