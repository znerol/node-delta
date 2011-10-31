/**
 * @file:   Implementation of Rönnau/Berghoff XML tree diff algorithm XCC.
 *
 * @see:
 * * http://dx.doi.org/10.1007/s00450-010-0140-2
 * * https://launchpad.net/xcc
 */

(function(exports, lcs) {
    function Diff(a, b) {
        this.a = a; // Root node of tree a
        this.b = b; // Root node of tree b
    }

    /**
     * Create a matching between the two nodes using the xcc diff algorithm
     */
    Diff.prototype.matchTrees = function(matching) {
        // Associate root nodes
        matching.put(this.b, this.a);

        this.matchLeafLCS(matching);
        this.matchLeafUpdates(matching);
    };


    /**
     * Identify unchanged leaves by comparing them using myers longest common
     * subsequence algorithm.
     */
    Diff.prototype.matchLeafLCS = function(matching) {
        var a_leaves = [],
            b_leaves = [],
            lcsinst = new lcs.LCS(a_leaves, b_leaves);

        // Augment LCS instance. Leaves are considered equal if their values
        // match and if they have the same tree depth.
        lcsinst.equals = function(a, b) {
            return a.value === b.value && a.depth === b.depth;
        };

        // Populate leave-node arrays.
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
            // cannot be a pair either (structure affecting change).
            if (!node_a || !node_b || node_a !== matching.get(node_b)) {
                // continue
                return;
            }

            // Associate nodes a and b and all of their ancestors.
            pairs.forEach(function(pair) {
                matching.put(pair[0], pair[1]);
            });
        }, this);
    };


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
     * Private utility function: Recursively match internal nodes top-down by
     * inspecting their neighborhood.
     */
    function matchNodeTopDown(matching, b, a, callback, T) {
        var result;

        // Cannot match if one of the nodes is undefined
        if (!a || !b) {
            return false;
        }
        // Return true if this matching already exists
        if (matching.get(b) === a) {
            return true;
        }
        // Node a or b is already involved in a matching and therefore may not
        // form another pair.
        if (matching.get(b) || matching.get(a)) {
            return false;
        }

        // Recurse
        result = matchNodeTopDown(matching, b.par, a.par);

        // If parents do not form a pair, a and b must not either
        if (!result) {
            return false;
        }

        // Run supplied testing function
        if (callback && !callback.call(T, b, a)) {
            return false;
        }

        // Figure out nearest previous siblings of a and b which are part of
        // the matching. No match is possible if those are not equal.
        if (matching.get(previousMatchingSibling(b, matching)) !==
                previousMatchingSibling(a, matching)) {
            return false;
        }

        // Record the matching between a and b if we manage to come so far.
        matching.put(b, a);
        return true;
    }


    /**
     * Private utility function: Return true if the two given internal nodes
     * may form a pair, i.e. have the same (hash-)value.
     */
    function testNodePair(b, a) {
        return b.value === a.value;
    }


    /**
     * Private utility function: FIXME: Return true if the two given leaf nodes
     * may form a pair, i.e. have the same node-type.
     */
    function testLeafPair(b, a) {
        return true;
    }


    /**
     * Detect updated leaf nodes by analyzing their neighborhood top-down.
     */
    Diff.prototype.matchLeafUpdates = function(matching) {
        var a_leaves = [],  // Unmatched leave nodes from tree a (potentially removed)
            b_leaves = [],  // Unmatched leave nodes from tree b (potentially inserted)
            a, b, i, k, lasttest;

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
        for (i = 0; i < b_leaves.length && a_leaves.length > 0; i++) {
            b = b_leaves[i];
            // For each b, loop through every non-matched leaf in tree a.
            for (k = 0; k < a_leaves.length; k++) {
                a = a_leaves[k];

                lasttest = (a.depth === b.depth) ? testLeafPair : testNodePair;

                // Bring candidates onto the same tree-level
                while (b.depth < a.depth) {
                    a = a.par;
                }
                while (b.depth > a.depth) {
                    b = b.par;
                }

                // Match all ancestors top-down
                if (matchNodeTopDown(matching, b.par, a.par, testNodePair) &&
                        matchNodeTopDown(matching, b, a, lasttest)) {

                    // Remove leaves up to and including the matched leaf from
                    // a_leaves. They cannot be candidates anymore.
                    a_leaves.splice(0, k + 1);
                    break;
                }
            }
        }
    };


    /**
     * Private utility class: Creates a new ItemAggregator instance.
     */
    function ItemAggregator(callback, T) {
        this.callback = callback;
        this.items = [];
    }


    /**
     * Append an array item to the end of the buffer
     */
    ItemAggregator.prototype.push = function(item) {
        this.items.push(item);
    }


    /**
     * Invoke callback with the buffer array as callback and empty the buffer
     * afterwards.
     */
    ItemAggregator.prototype.flush = function() {
        if (this.items.length > 0) {
            this.callback.call(this.T, this.items);
            this.items = [];
        }
    }


    /**
     * Generate a changeset by invoking the following methods on editor:
     * * update(a, b)       // a and b: Matched nodes on tree A and tree B
     * * insert(b_nodes)    // array of consecutive siblings on tree B
     * * delete(a_nodes)    // array of consecutive siblings on tree A
     */
    Diff.prototype.generatePatch = function(matching, editor) {
        this.collectChanges(this.b, matching, editor);
    };


    /**
     * Collect changeset on given node and all its descendants. Communicate
     * changes to editor by invoking update, insert and delete methods.
     */
    Diff.prototype.collectChanges = function(node, matching, editor) {
        var ops, partner;

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
        ops = new ItemAggregator(function(items) {
            editor.insert(items);
        });
        node.children.forEach(function(c) {
            if (matching.get(c)) {
                ops.flush();
                // Recurse
                this.collectChanges(c, matching, editor);
            }
            else {
                ops.push(c);
            }
        }, this);
        ops.flush();

        // Generate delete operations on children of partner
        ops = new ItemAggregator(function(items) {
            editor.remove(items);
        });
        partner.children.forEach(function(c) {
            if (matching.get(c)) {
                ops.flush();
            }
            else {
                ops.push(c);
            }
        });
        ops.flush();
    };

    exports.Diff = Diff;

}(
    typeof exports === 'undefined' ? (DeltaJS.xcc={}) : exports,
    typeof require === 'undefined' ? DeltaJS.lcs : require('deltajs').lcs
));
