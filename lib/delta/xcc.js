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
        this.a.forEachDescendant(function(n) {
            if (n.children.length === 0) {
                a_leaves.push(n);
            }
        });
        this.b.forEachDescendant(function(n) {
            if (n.children.length === 0) {
                b_leaves.push(n);
            }
        });

        // Associate root nodes
        this.b.match(this.a);

        // Run lcs over leave nodes of tree a and tree b
        lcsinst.forEachCommonSymbol(function(x, y) {
            var node_a = a_leaves[x];
            var node_b = b_leaves[y];
            var anc_b;

            // Check if the next matched ancestors are partners. If they aren't
            // nodes a and b may not be matched neither.
            if (node_a.firstMatchedAncestor() === node_b.firstMatchedAncestor().partner) {

                // Associate node b to node a
                node_b.match(node_a);

                // Associate ancestor nodes of a and b
                anc_b = node_b.par;
                node_a.forEachUnmatchedAncestor(function(anc_a) {
                    anc_b.match(anc_a);
                    anc_b = anc_b.par;
                });
            }
        });
    };

    exports.Diff = Diff;

}(
    typeof exports === 'undefined' ? (DeltaJS.xcc={}) : exports,
    typeof require === 'undefined' ? DeltaJS.lcs : require('deltajs').lcs
));
