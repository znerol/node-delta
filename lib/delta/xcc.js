(function(exports, lcs) {
    function Diff(a, b) {
        this.a = a; // Root node of tree a
        this.b = b; // Root node of tree b
    }

    Diff.prototype.matchTrees = function(matching) {
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
        matching.put(this.b, this.a);

        // Identify structure-preserving changes. Run lcs over leave nodes of
        // tree a and tree b. Associate the identified leave nodes and also
        // their ancestors except if this would result in structure-affecting
        // change.
        lcsinst.forEachCommonSymbol(function(x, y) {
            var node_a = a_leaves[x],
                node_b = b_leaves[y],
                pairs = [];

            // Bubble up hierarchy until we encounter the first ancestor which
            // already has been matched. Record potential pairs in the pair
            // queue.
            while(node_a && node_b && !matching.get(node_a) && !matching.get(node_b)) {
                pairs.push([node_a, node_b]);
                node_a = node_a.par;
                node_b = node_b.par;
            }

            // If nearest matched ancestors are not partners. Nodes a and b
            // cannot be a pair either.
            if (!node_a || !node_b || node_a !== matching.get(node_b)) {
                // continue
                return;
            }

            // Associate nodes a and b and all of their ancestors.
            pairs.forEach(function(pair) {
                matching.put(pair[0], pair[1]);
            });
        }, this);

        // Detect updated leaves nodes by analyzing their neighborhood in a
        // top-down approach.
        b_leaves.filter(function(b){
            return !matching.get(b);
        }, this).forEach(function(b) {
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
                for (bcnd = b; !matching.get(bcnd.par); bcnd = bcnd.par) {}
                bcnd_sib = bcnd.par.children;

                // Identify the nearest matched preceeding sibling of candidate
                // in tree B.
                bcnd_pms = undefined;
                for (i = bcnd.idx-1; i >= 0; i--) {
                    if (matching.get(bcnd_sib[i])) {
                        bcnd_pms = bcnd_sib[i];
                        break;
                    }
                }

                // Wormhole: Get to tree A by means of the partner link of the
                // candidates parent.
                acnd_sib = matching.get(bcnd.par).children;

                // For each non-matched node in acnd_sib, we compare its
                // previous matched sibling to bcnd_pms. If they are
                // partners, we found the candidate in the A tree
                acnd = undefined;
                acnd_pms = matching.get(bcnd_pms);
                acnd_pms_cnd = undefined;
                for (i = 0; i < acnd_sib.length; i++) {
                    c = acnd_sib[i];
                    if (matching.get(c)) {
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

                matching.put(bcnd, acnd);
            }
        }, this);
    };

    Diff.prototype.generatePatch = function(matching, editor) {
        this.collectChanges(this.b, matching, editor);
    };

    Diff.prototype.collectChanges = function(node, matching, editor) {
        var i, opchildren, partner;

        if (!matching.get(node)) {
            throw new Error('collectChanges may not be invoked for unmatched nodes');
        }
        partner = matching.get(node);

        // Generate update command if values of node and its partner do not
        // match
        if (node.value !== partner.value) {
            editor.update(partner, node);
        }

        // Generate insert operations on children, recurse for update
        // operations.
        opchildren = [];
        for (i = 0; i < node.children.length; i++) {
            c = node.children[i];
            if (matching.get(c)) {
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

        // Generate delete operations on children of partner
        for (i = 0; i < partner.children.length; i++) {
            c = partner.children[i];

            if (matching.get(c)) {
                if (opchildren.length > 0) {
                    editor.remove(opchildren);
                    opchildren = [];
                }
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
