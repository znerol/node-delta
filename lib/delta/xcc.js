(function(exports, lcs) {
    function Diff(a, b) {
        this.a = a; // Root node of tree a
        this.b = b; // Root node of tree b
    }

    /**
     * Associate node b to node a
     */
    Diff.prototype.addMatch = function(b, a) {
        b.match(a);
    }

    /**
     * Return true if node n is associated with a node in its companion tree.
     */
    Diff.prototype.isMatched = function(n) {
        return n.matched;
    }

    /**
     * Return the partner node in a tree of the given matched node in b tree.
     */
    Diff.prototype.matchPartner = function(b) {
        return b && b.partner;
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
        this.addMatch(this.b, this.a);

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
            if (node_a.firstMatchedAncestor() !== this.matchPartner(node_b.firstMatchedAncestor())) {
                // continue
                return;
            }

            // Associate node b to node a
            this.addMatch(node_b, node_a);

            // Identify structure preserving changes (updates) by associating
            // all ancestors of node b to the corresponding ancestor of node a.
            anc_b = node_b.par;
            node_a.forEachAncestor(function(anc_a) {
                if (this.isMatched(anc_a)) {
                    return true;
                }
                this.addMatch(anc_b, anc_a);
                anc_b = anc_b.par;
            }, this);
        }, this);

        // Detect updated leaves nodes by analyzing their neighborhood in a
        // top-down approach.
        b_leaves.filter(function(b){
            return !this.isMatched(b);
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
                for (bcnd = b; !bcnd.par.matched; bcnd = bcnd.par) {}
                bcnd_sib = bcnd.par.children;

                // Identify the nearest matched preceeding sibling of candidate
                // in tree B.
                bcnd_pms = undefined;
                for (i = bcnd.idx-1; i >= 0; i--) {
                    if (this.isMatched(bcnd_sib[i])) {
                        bcnd_pms = bcnd_sib[i];
                        break;
                    }
                }

                // Wormhole: Get to tree A by means of the partner link of the
                // candidates parent.
                acnd_sib = this.matchPartner(bcnd.par).children;

                // For each non-matched node in acnd_sib, we compare its
                // previous matched sibling to bcnd_pms. If they are
                // partners, we found the candidate in the A tree
                acnd = undefined;
                acnd_pms = this.matchPartner(bcnd_pms);
                acnd_pms_cnd = undefined;
                for (i = 0; i < acnd_sib.length; i++) {
                    c = acnd_sib[i];
                    if (this.isMatched(c)) {
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

                this.addMatch(bcnd, acnd);
            }
        }, this);
    };

    Diff.prototype.generatePatch = function(editor) {
        this.collectChanges(this.b, editor);
    };

    Diff.prototype.collectChanges = function(node, editor) {
        var i, opchildren, partner;

        if (!this.isMatched(node)) {
            throw new Error('collectChanges may not be invoked for unmatched nodes');
        }
        partner = this.matchPartner(node);

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
            if (this.isMatched(c)) {
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

            if (this.isMatched(c)) {
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
