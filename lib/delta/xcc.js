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

        // Populate leave-node arrays. No need to include the root nodes here,
        // because those will be associated anyway.
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

        // Identify structure-preserving changes. Run lcs over leave nodes of
        // tree a and tree b. Associate the identified leave nodes and also
        // their ancestors except if this would result in structure-affecting
        // change.
        lcsinst.forEachCommonSymbol(function(x, y) {
            var node_a = a_leaves[x];
            var node_b = b_leaves[y];
            var anc_b;

            // Check if the nearest matched ancestors are partners. If they
            // aren't, nodes a and b cannot be a pair either.
            if (node_a.firstMatchedAncestor() !== node_b.firstMatchedAncestor().partner) {
                // continue
                return;
            }

            // Associate node b to node a
            node_b.match(node_a);

            // Identify structure preserving changes (updates) by associating
            // all ancestors of node b to the corresponding ancestor of node a.
            anc_b = node_b.par;
            node_a.forEachAncestor(function(anc_a) {
                if (anc_a.matched) {
                    return true;
                }
                anc_b.match(anc_a);
                anc_b = anc_b.par;
            });
        });

        // Detect updated leaves nodes by analyzing their neighborhood in a
        // top-down approach.
        b_leaves.filter(function(b){
            return !b.matched;
        }).forEach(function(b) {
            var i, c,
                acnd,       // Candidate from tree A
                bcnd,       // Candidate from tree B
                acnd_sib,   // All siblings of, including candidate form tree A
                acnd_pms,   // Previous matched sibling of candidate form tree A
                acnd_pms_cnd,   // Candidate for previous matched sibling of
                                // candidate form tree A
                bcnd_sib,   // All siblings of, including candidate from tree B
                bcnd_pms;   // Previous matched sibling of candidate from tree B

            // Traverse ancestors of b bottom-up
            while (bcnd !== b) {
                // Identify the nearest unmatched ancestor of b whose parent
                // has been matched and set B-candidate and B-candidate parent.
                for (bcnd = b; !bcnd.par.matched; bcnd = bcnd.par) {}
                bcnd_sib = bcnd.par.children;

                // Identify the nearest matched preceeding sibling of candidate
                // in tree B.
                bcnd_pms = undefined;
                for (i = bcnd.idx-1; i >= 0; i--) {
                    if (bcnd_sib[i].matched) {
                        bcnd_pms = bcnd_sib[i];
                        break;
                    }
                }

                // Wormhole: Get to tree A by means of the partner link of the
                // candidates parent.
                acnd_sib = bcnd.par.partner.children;

                // For each non-matched node in acnd_sib, we compare its
                // previous matched sibling to bcnd_pms. If they are
                // partners, we found the candidate in the A tree
                acnd = undefined;
                acnd_pms = bcnd_pms && bcnd_pms.partner;
                acnd_pms_cnd = undefined;
                for (i = 0; i < acnd_sib.length; i++) {
                    c = acnd_sib[i];
                    if (c.matched) {
                        acnd_pms_cnd = c;
                    }
                    else if (acnd_pms === acnd_pms_cnd) {
                        acnd = c;
                        break;
                    }
                }

                // There was no potential partner for candidate in B. No need
                // to look deeper into A.
                if (!acnd) {
                    break;
                }

                bcnd.match(acnd);
            }
        });
    };

    Diff.prototype.generatePatch = function(editor) {
        this.collectChanges(this.b, editor);
    };

    Diff.prototype.collectChanges = function(node, editor) {
        var i, opchildren;
        if (!node.matched) {
            return;
        }

        if (node.value !== node.partner.value) {
            editor.update(node.partner, node);
        }

        // Collect insert operations on children, recurse for update
        // operations.
        opchildren = [];
        for (i = 0; i < node.children.length; i++) {
            c = node.children[i];
            if (c.matched) {
                if (opchildren.length > 0) {
                    editor.insert(opchildren);
                    opchildren = [];
                }
                this.collectChanges(c, editor);
            }
            else {
                opchildren.push(c);
            }
        }

        if (opchildren.length > 0) {
            editor.insert(opchildren);
            opchildren = [];
        }

        // Collect delete operations on children of partner
        for (i = 0; i < node.partner.children.length; i++) {
            c = node.partner.children[i];

            if (c.matched) {
                if (opchildren.length > 0) {
                    editor.remove(opchildren);
                    opchildren = [];
                }
                this.collectChanges(c, editor);
            }
            else {
                opchildren.push(c);
            }
        }

        if (opchildren.length > 0) {
            editor.remove(opchildren);
            opchildren = [];
        }
    };

    exports.Diff = Diff;

}(
    typeof exports === 'undefined' ? (DeltaJS.xcc={}) : exports,
    typeof require === 'undefined' ? DeltaJS.lcs : require('deltajs').lcs
));
