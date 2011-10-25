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
     * Return nearest preceeding sibling which is in the matching.
     */
    Diff.previousMatchingSibling = function(node, matching) {
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
        var remove_leaves = [],
            insert_leaves = [],
            cand_a,
            cand_a_tmp,
            prev_a,
            leaf_b,
            cand_b,
            i;

        // Find all leaves which are not part of the matching in tree a. These
        // are the candidates which would be removed.
        this.a.forEachDescendant(function(n) {
            if (n.children.length === 0 && !matching.get(n)) {
                remove_leaves.push(n);
            }
        });
        // Find all leaves which are not part of the matching in tree a. These
        // are the candidates which would be inserted.
        this.b.forEachDescendant(function(n) {
            if (n.children.length === 0 && !matching.get(n)) {
                insert_leaves.push(n);
            }
        });

        // Loop through every insertable leaf of tree b
        while(remove_leaves.length && insert_leaves.length) {
            leaf_b = insert_leaves.shift();
            cand_b = undefined;

            // Traverse tree b top down through unmatched ancestors of leaf b.
            while(cand_b !== leaf_b) {
                cand_b = leaf_b;

                // Bubble up to last unmatched ancestor. That's our match
                // candidate.
                while(!matching.get(cand_b.par)) {
                    cand_b = cand_b.par;
                }

                // Identify nearest preceeding sibling.
                prev_a = matching.get(Diff.previousMatchingSibling(cand_b, matching));

                // Find candidate in A
                cand_a = undefined;
                for (i = 0; i < remove_leaves.length; i++) {
                    cand_a_tmp = remove_leaves[i];

                    // No need to compare leaves of different depth
                    if (cand_a_tmp.depth !== leaf_b.depth) {
                        continue;
                    }

                    // Bubble up in tree A until we reach the same level like
                    // in tree B
                    while(cand_a_tmp.depth > cand_b.depth) {
                        cand_a_tmp = cand_a_tmp.par;
                    }

                    // Check if candidate is already in the matching
                    if (matching.get(cand_a_tmp)) {
                        continue;
                    }

                    // Ensure that parents form a pair
                    if (matching.get(cand_a_tmp.par) !== cand_b.par) {
                        continue;
                    }

                    // If this are internal nodes, their value must match
                    if (cand_a_tmp.depth !== leaf_b.depth &&
                            cand_a_tmp.value !== cand_b.value) {
                        continue;
                    }

                    // Identify nearest preceeding sibling which is in the
                    // matching and check if candidate a and b have the same
                    // matched preceeding sibling
                    if (prev_a === Diff.previousMatchingSibling(cand_a_tmp, matching)) {
                        cand_a = cand_a_tmp;
                        break;
                    }
                }

                // No candidate found, continue with next b-leaf
                if (!cand_a) {
                    break;
                }

                // Record a matching
                matching.put(cand_b, cand_a);
            }

            // If we've managed to pair leaf nodes, shift elements from
            // remove-leaves array up to and including the last a-candidate.
            if (cand_b === leaf_b) {
                remove_leaves.splice(0, i + 1);
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
