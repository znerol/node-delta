/**
 * @file:   Implementation of Rönnau/Berghoff XML tree diff algorithm XCC.
 *
 * @see:
 * * http://dx.doi.org/10.1007/s00450-010-0140-2
 * * https://launchpad.net/xcc
 */

(function(exports, lcs) {
    function Diff(a, b, options) {
        this.a = a; // Root node of tree a
        this.b = b; // Root node of tree b
        this.options = options || {
            'detectLeafUpdates': true
        };
    }

    /**
     * Create a matching between the two nodes using the xcc diff algorithm
     */
    Diff.prototype.matchTrees = function(matching) {
        // Associate root nodes
        matching.put(this.b, this.a);

        this.matchLeafLCS(matching);
        if (this.options.detectLeafUpdates) {
            this.matchLeafUpdates(matching);
        }
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
     * Identify leaf-node updates by traversing descendants of b_node top-down.
     * b_node must already be part of the matching.
     */
    function matchLeafUpdatesOnDescendants(matching, b_node) {
        var b_nodes = b_node.children,
            a_nodes = matching.get(b_node).children,
            b_pmc = 0,  // Number of matched siblings preceeding b
            a_pmc = 0,  // Number of matched siblings preceeding a
            i = 0,      // Array index into b_nodes
            k = 0,      // Array index into a_nodes
            b,          // Current candidate node in b_nodes
            a;          // Current candidate node in a_nodes

        // Loop through a_nodes and b_nodes simultaneously
        while ((b = b_nodes[i]) && (a = a_nodes[k])) {
            if (matching.get(b)) {
                if (b.children.length > 0) {
                    // Recurse if b is in the matching and has children
                    matchLeafUpdatesOnDescendants(matching, b);
                }
                // Increment matched siblings count for b and continue
                b_pmc++;
                i++;
            }
            else if (b.children.length > 0) {
                // Skip subtrees when root node is not in the matching
                i++;
            }
            else if (matching.get(a)) {
                // Increment matched siblings count for a and continue
                a_pmc++;
                k++;
            }
            else if (a.children.length > 0) {
                // Skip subtrees when root node is not in the matching
                k++;
            }
            else if (b_pmc > a_pmc) {
                // Encountered more siblings in the matching before node b than
                // before node a. Catch up on a_nodes.
                k++;
            }
            else if (b_pmc < a_pmc) {
                // Encountered less siblings in the matching before node b than
                // before node a. Catch up on b_nodes.
                i++;
            }
            else {
                // Encountered a pair of leaf-nodes whose parents are in the
                // matching and whose previous matched siblings also are form
                // pair. Also put those nodes into the matching.
                matching.put(b, a);
                i++;
                k++;
            }
        }
    }


    /**
     * Detect updated leaf nodes by analyzing their neighborhood top-down.
     */
    Diff.prototype.matchLeafUpdates = function(matching) {
        matchLeafUpdatesOnDescendants(matching, this.b);
    }


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
