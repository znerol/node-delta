(function(exports, lcs) {
    function Diff(a, b) {
        this.a = a; // Root node of tree a
        this.b = b; // Root node of tree b
    }

    /**
     * Create a matching between the two nodes using the xcc diff algorithm
     */
    Diff.prototype.matchTrees = function(matching) {
        this.matchLeafLCS(matching);
        this.matchLeafUpdates(matching);
    }


    /**
     * Identify unchanged leaves by comparing them using the myers longest
     * common subsequence algorithm.
     */
    Diff.prototype.matchLeafLCS = function(matching) {
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
    }


    /**
     * Private utility function: Return nearest preceeding sibling of the given
     * node which is contained in the matching.
     */
    function previousMatchingSibling(node, matching) {
        var i, siblings = node.par.children;
        for(i = node.idx-1; i >= 0; i--) {
            if (matching.get(siblings[i])) {
                return siblings[i];
            }
        }
    }


    /**
     * Detect updated leaf nodes by analyzing their neighborhood top-down.
     */
    Diff.prototype.matchLeafUpdates = function(matching) {
        var a_leaves = [],  // Unmatched leave nodes from tree a (potentially removed)
            b_leaves = [],  // Unmatched leave nodes from tree b (potentially inserted)
            cand_a,         // Match candidate from tree a
            node_a,         // Loop variable for tree a
            prev_a,         // Nearest preceeding matched sibling relative to
                            // candidate in tree a
            cand_b,         // Match candidate from tree b
            leaf_b,         // Loop variable for tree b
            i;

        // Find all leaves which are not part of the matching in tree a. These
        // are the candidates which would be removed.
        this.a.forEachDescendant(function(n) {
            if (n.children.length === 0 && !matching.get(n)) {
                a_leaves.push(n);
            }
        });
        // Find all leaves which are not part of the matching in tree b. These
        // are the candidates which would be inserted.
        this.b.forEachDescendant(function(n) {
            if (n.children.length === 0 && !matching.get(n)) {
                b_leaves.push(n);
            }
        });

        // Loop through every non-matched leaf in tree b as long as there are
        // also match candidates in tree a.
        while(a_leaves.length && b_leaves.length) {
            leaf_b = b_leaves.shift();
            cand_b = undefined;

            // Traverse tree b top down along all unmatched ancestors of leaf
            // b.
            while(cand_b !== leaf_b) {
                cand_b = leaf_b;

                // Bubble up to last unmatched ancestor. That's our match
                // candidate.
                while(!matching.get(cand_b.par)) {
                    cand_b = cand_b.par;
                }

                // Identify nearest preceeding sibling of b candidate and
                // retrieve its partner node in tree A.
                prev_a = matching.get(previousMatchingSibling(cand_b, matching));

                // Find candidate in A
                cand_a = undefined;
                for (i = 0; i < a_leaves.length; i++) {
                    node_a = a_leaves[i];

                    // No need to compare leaves of different depth
                    if (node_a.depth !== leaf_b.depth) {
                        continue;
                    }

                    // Bubble up in tree A until we reach the same level like
                    // in tree B
                    while(node_a.depth > cand_b.depth) {
                        node_a = node_a.par;
                    }

                    // Check if candidate is already in the matching
                    if (matching.get(node_a)) {
                        continue;
                    }

                    // Ensure that parents form a pair
                    if (matching.get(node_a.par) !== cand_b.par) {
                        continue;
                    }

                    // If this are internal nodes, their value must match
                    if (node_a.depth !== leaf_b.depth &&
                            node_a.value !== cand_b.value) {
                        continue;
                    }
//                    else if (...){
//                        // FIXME: must check for node type here
//                        continue;
//                    }

                    // Check if candidates from trees A and B have the same
                    // nearest preceeding sibling contained in the matching.
                    if (prev_a === previousMatchingSibling(node_a, matching)) {
                        cand_a = node_a;
                        break;
                    }
                }

                // No candidate found, continue with next b-leaf
                if (!cand_a) {
                    break;
                }

                // Record a matching and continue top-down process
                matching.put(cand_b, cand_a);
            }

            // If we've managed to pair leaf nodes, shift elements from
            // a_leaves array up to and including the last a-candidate.
            if (cand_b === leaf_b) {
                a_leaves.splice(0, i + 1);
            }
        }
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
