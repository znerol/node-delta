/**
 * @fileoverview Implementation of Rönnau/Borghoff XML tree diff algorithm XCC.
 *
 * @see:
 * * http://dx.doi.org/10.1007/s00450-010-0140-2
 * * https://launchpad.net/xcc
 */

/** @ignore */
var lcs = require('./lcs');

/**
 * Create a new instance of the XCC diff implementation.
 *
 * @param {tree.Node} a Root node of original tree
 * @param {tree.Node} b Root node of changed tree
 * @param {Object} options Options
 *
 * @constructor
 * @name xcc.Diff
 */
function Diff(a, b, options) {
    this.a = a; // Root node of tree a
    this.b = b; // Root node of tree b
    this.options = options || {
        'ludRejectCallbacks': undefined,
            'detectLeafUpdates': true
    };
}

/**
 * Create a matching between the two nodes using the xcc diff algorithm
 *
 * @param {tree.Matching} matching A tree matching which will be populated by
 *         diffing tree a and b.
 *
 * @memberOf xcc.Diff
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
 * Default equality test. Override this method if you need to test other
 * node properties instead/beside node value.
 *
 * @param {tree.Node} a Candidate node from tree a
 * @param {tree.Node} b Candidate node from tree b
 *
 * @return {boolean} Return true if the value of the two nodes is equal.
 *
 * @memberOf xcc.Diff
 */
Diff.prototype.equals = function(a, b) {
    return (a.value === b.value);
};


/**
 * Identify unchanged leaves by comparing them using myers longest common
 * subsequence algorithm.
 *
 * @param {tree.Matching} matching A tree matching which will be populated by
 *         diffing tree a and b.
 *
 * @memberOf xcc.Diff
 */
Diff.prototype.matchLeafLCS = function(matching) {
    var a_leaves = [],
        b_leaves = [],
        lcsinst = new lcs.LCS(a_leaves, b_leaves);

    // Leaves are considered equal if their values match and if they have
    // the same tree depth. Need to wrap the equality-test function into
    // a closure executed immediately in order to maintain correct context
    // (rename 'this' into 'that').
    lcsinst.equals = (function(that){
        return function(a, b) {
            return a.depth === b.depth && that.equals(a, b);
        };
    }(this));

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
    // tree a and tree b. Associate the identified leaf nodes and also
    // their ancestors except if this would result in structure-affecting
    // change.
    lcsinst.forEachCommonSymbol(function(x, y) {
        var a = a_leaves[x], b = b_leaves[y], a_nodes = [], b_nodes = [], i;

        // Bubble up hierarchy until we encounter the first ancestor which
        // already has been matched. Record potential pairs in the a_nodes and
        // b_nodes arrays.
        while(a && b && !matching.get(a) && !matching.get(b)) {
            a_nodes.push(a);
            b_nodes.push(b);
            a = a.par;
            b = b.par;
        }

        // Record nodes a and b and all of their ancestors in the matching if
        // and only if the nearest matched ancestors are partners.
        if (a && b && a === matching.get(b)) {
            for (i=0; i<a_nodes.length; i++) {
                matching.put(a_nodes[i], b_nodes[i]);
            }
        }
    }, this);
};


/**
 * Identify leaf-node updates by traversing descendants of b_node top-down.
 * b_node must already be part of the matching.
 *
 * @param {tree.Matching} matching A tree matching which will be populated by
 *         diffing tree a and b.
 * @param {tree.Node} a_node A node from tree a which already takes part in the
 *         matching.
 * @param {function} [reject] A user supplied function which may indicate
 *         a given node should not be considered when detecting node updates.
 *         The function should take one argument (tree.Node) and return true
 *         (reject) or false (do not reject).
 *
 * @memberOf xcc.Diff
 */
Diff.prototype.matchLeafUpdatesOnDescendants = function(matching, a_node, reject) {
    var a_nodes = a_node.children,
        b_nodes = matching.get(a_node).children,
        pm = true,  // True if the previous node pair matched
        i = 0,      // Array index into a_nodes
        k = 0,      // Array index into b_nodes
        a,          // Current candidate node in a_nodes
        b;          // Current candidate node in b_nodes

    // Loop through a_nodes and b_nodes simultaneously
    while (a_nodes[i] && b_nodes[k]) {
        a = a_nodes[i];
        b = b_nodes[k];

        if (reject && !matching.get(a) && reject(a)) {
            // Skip a if it gets rejected by the user defined function
            pm = false;
            i++;
        }
        else if (reject && !matching.get(b) && reject(b)) {
            // Skip b if it gets rejected by the user defined function
            pm = false;
            k++;
        }
        else if (pm && !matching.get(a) && !matching.get(b) && a.children.length === 0 && b.children.length === 0) {
            // If the previous sibling takes part in the matching and both
            // candidates are leaf-nodes, they should form a pair (leaf-update)
            matching.put(a, b);
            i++;
            k++;
        }
        else if (pm && !matching.get(a) && !matching.get(b) && this.equals(a, b)) {
            // If the previous sibling takes part in the matching and both
            // candidates have the same value, they should form a pair
            matching.put(a, b);
            // Recurse
            this.matchLeafUpdatesOnDescendants(matching, a, reject);
            i++;
            k++;
        }
        else if (!matching.get(a)) {
            // Skip a if above rules did not apply and a is not in the matching
            pm = false;
            i++;
        }
        else if (!matching.get(b)) {
            // Skip b if above rules did not apply and b is not in the matching
            pm = false;
            k++;
        }
        else if (a === matching.get(b)) {
            // Recurse, both candidates are in the matching
            this.matchLeafUpdatesOnDescendants(matching, a, reject);
            pm = true;
            i++;
            k++;
        }
        else {
            // Both candidates are in the matching but they are no partners.
            // This is impossible, bail out.
            throw new Error('Matching is not consistent');
        }
    }
}


/**
 * Detect updated leaf nodes by analyzing their neighborhood top-down.
 *
 * @param {tree.Matching} matching A tree matching which will be populated by
 *         diffing tree a and b.
 *
 * @memberOf xcc.Diff
 */
Diff.prototype.matchLeafUpdates = function(matching) {
    var i, rejects = this.options.ludRejectCallbacks || [undefined];
    for (i=0; i<rejects.length; i++) {
        this.matchLeafUpdatesOnDescendants(matching, this.b, rejects[i]);
    }
};


exports.Diff = Diff;
