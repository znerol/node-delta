/**
 * @fileoverview    Implementation of the "skelmatch" tree matching algorithm.
 *
 * This algorithm is heavily inspired by the XCC tree matching algorithm by
 * Sebastian Rönnau and Uwe M. Berghoff. It shares the idea that the
 * interesting bits are found towards the bottom of the tree.
 *
 * Skel-match divides the problem of finding a partial matching between two
 * structured documents represented by ordered trees into two subproblems:
 * 1.   Detect changes in document content (Longest Common Subsequence among
 *      leaf-nodes).
 * 2.   Detect changes in remaining document structure.
 *
 * By default leaf-nodes are considered content, and internal nodes are
 * treated as structure.
 */


/** @ignore */
var lcs = require('./lcs.js');


/**
 * @constructor
 */
function Diff(a, b, options) {
    this.a = a; // Root node of tree a
    this.b = b; // Root node of tree b
}


/**
 * Create a matching between the two nodes using the skelmatch algorithm
 */
Diff.prototype.matchTrees = function(matching) {
    // Associate root nodes
    matching.put(this.b, this.a);

    this.matchContent(matching);
    this.matchStructure(matching);
};


/**
 * Return true if the given node should be treated as a content node.
 *
 * Default: Return true for leaf-nodes.
 */
Diff.prototype.isContent = function(node) {
    return (node.children.length === 0);
};


/**
 * Return true if the given node should be treated as a structure node.
 *
 * Default: Return true for internal nodes.
 */
Diff.prototype.isStructure = function(node) {
    return !this.isContent(node);
};


/**
 * Default equality test for node values. Override this method if you need to
 * test other node properties instead/beside node value.
 */
Diff.prototype.equals = function(a, b) {
    return (a.value === b.value);
};


/**
 * Default equality test for content nodes. Also test all descendants of a and
 * b for equality. Override this method if you want to use tree hashing for
 * this purpose.
 */
Diff.prototype.equalContent = function(a, b) {
    var i;

    if (a.children.length !== b.children.length) {
        return false;
    }
    for (i = 0; i < a.children.length; i++) {
        if (!this.equalContent(a.children[i], b.children[i])) {
            return false;
        }
    }

    return this.equals(a, b);
};


/**
 * Default equality test for structure nodes. Return true if ancestors either
 * have the same node value or if they form a pair. Override this method if you
 * want to use tree hashing for this purpose.
 */
Diff.prototype.equalStructure = function(matching, a, b) {
    if (!matching.get(a) && !matching.get(b)) {
        // Return true if all ancestors fullfill the requirement and if the
        // values of a and b are equal.
        return this.equalStructure(matching, a.par, b.par) && this.equals(a, b);
    }
    else {
        // Return true if a and b form a pair.
        return a === matching.get(b);
    }
};


/**
 * Return true if a pair is found in the ancestor chain of a and b.
 */
Diff.prototype.matchingCheckAncestors = function(matching, a, b) {
    if (!a || !b) {
        return false;
    }
    else if (!matching.get(a) && !matching.get(b)) {
        return this.matchingCheckAncestors(matching, a.par, b.par);
    }
    else {
        return a === matching.get(b);
    }
};


/**
 * Put a and b and all their unmatched ancestors into the matching.
 */
Diff.prototype.matchingPutAncestors = function(matching, a, b) {
    if (!a || !b) {
        throw new Error('Parameter error: may not match undefined tree nodes');
    }
    else if (!matching.get(a) && !matching.get(b)) {
        this.matchingPutAncestors(matching, a.par, b.par);
        matching.put(a, b);
    }
    else if (a !== matching.get(b)) {
        throw new Error('Parameter error: fundamental matching rule violated.');
    }
};


/**
 * Identify unchanged leaves by comparing them using myers longest common
 * subsequence algorithm.
 */
Diff.prototype.matchContent = function(matching) {
    var a_content = [],
        b_content = [],
        lcsinst = new lcs.LCS(a_content, b_content);

    // Leaves are considered equal if their values match and if they have
    // the same tree depth. Need to wrap the equality-test function into
    // a closure executed immediately in order to maintain correct context
    // (rename 'this' into 'that').
    lcsinst.equals = (function(that){
        return function(a, b) {
            return a.depth === b.depth && that.equalContent(a, b);
        };
    }(this));

    // Populate leave-node arrays.
    this.a.forEachDescendant(function(n) {
        if (this.isContent(n)) a_content.push(n);
    }, this);
    this.b.forEachDescendant(function(n) {
        if (this.isContent(n)) b_content.push(n);
    }, this);

    // Identify structure-preserving changes. Run lcs over leave nodes of
    // tree a and tree b. Associate the identified leaf nodes and also
    // their ancestors except if this would result in structure-affecting
    // change.
    lcsinst.forEachCommonSymbol(function(x, y) {
        var a = a_content[x], b = b_content[y];

        // Verify that ancestor chain allows that a and b to form a pair.
        if (this.matchingCheckAncestors(matching, a, b)) {
            // Record nodes a and b and all of their ancestors in the
            // matching if and only if the nearest matched ancestors are
            // partners.
            this.matchingPutAncestors(matching, a, b);
        }
    }, this);
};


/**
 * Return an array of the bottom-most structure-type nodes beneath the given
 * node.
 */
Diff.prototype.collectBones = function(node) {
    var result = [], outer, i = 0;

    if (this.isStructure(node)) {
        for (i = 0; i < node.children.length; i++) {
            outer = this.collectBones(node.children[i]);
            Array.prototype.push.apply(outer);
        }
        if (result.length === 0) {
            // If we do not have any structure-type descendants, this node is
            // the outer most.
            result.push(node);
        }
    }

    return result;
}


/**
 * Invoke the given callback with each sequence of unmatched nodes.
 *
 * @param matching  A partial matching
 * @param a_sibs    A sequence of siblings from tree a
 * @param b_sibs    A sequence of siblings from tree b
 * @param callback  A function (a_nodes, b_nodes, a_parent, b_parent) called
 *                  for every consecutive sequence of nodes from a_sibs and
 *                  b_sibs seperated by one or more node pairs.
 * @param T         Context object bound to "this" when the callback is
 *                  invoked.
 */
Diff.prototype.forEachUnmatchedSequenceOfSiblings = function(matching,
        a_sibs, b_sibs, callback, T)
{
    var a_xmatch = [],  // Array of consecutive sequence of unmatched nodes
                        // from a_sibs.
        b_xmatch = [],  // Array of consecutive sequence of unmatched nodes
                        // from b_sibs.
        i = 0,      // Array index into a_sibs
        k = 0,      // Array index into b_sibs
        a,          // Current candidate node in a_sibs
        b;          // Current candidate node in b_sibs

    // Loop through a_sibs and b_sibs simultaneously
    while (a_sibs[i] || b_sibs[k]) {
        a = a_sibs[i];
        b = b_sibs[k];

        if (a && !matching.get(a)) {
            // Skip a if above rules did not apply and a is not in the matching
            a_xmatch.push(a);
            i++;
        }
        else if (b && !matching.get(b)) {
            // Skip b if above rules did not apply and b is not in the matching
            b_xmatch.push(b);
            k++;
        }
        else if (a && b && a === matching.get(b)) {
            // Collect nodes at border structure and detect matches
            callback.call(T, a_xmatch, b_xmatch, a, b);
            a_xmatch = [];
            b_xmatch = [];

            // Recurse, both candidates are in the matching
            this.forEachUnmatchedSequenceOfSiblings(matching, a.children, b.children, callback, T);
            i++;
            k++;
        }
        else {
            // Both candidates are in the matching but they are no partners.
            // This is impossible, bail out.
            throw new Error('Matching is not consistent');
        }
    }

    if (a_xmatch.length > 0 || b_xmatch.length > 0) {
        callback.call(T, a_xmatch, b_xmatch, a, b);
    }
}


/**
 * Traverse a partial matching and detect equal structure-type nodes between
 * matched content nodes.
 */
Diff.prototype.matchStructure = function(matching) {
    // Collect unmatched sequences of siblings from tree a and b. Run lcs over
    // bones for each.
    this.forEachUnmatchedSequenceOfSiblings(matching, this.a.children,
            this.b.children, function(a_nodes, b_nodes) {
        var a_bones = [],
            b_bones = [],
            lcsinst = new lcs.LCS(a_bones, b_bones);

        // Override equality test.
        lcsinst.equals = (function(that){
            return function(a, b) {
                return that.equalStructure(matching, a, b);
            };
        }(this));

        // Populate bone array
        a_nodes.forEach(function(n) {
            Array.prototype.push.apply(a_bones, this.collectBones(n));
        }, this);
        b_nodes.forEach(function(n) {
            Array.prototype.push.apply(b_bones, this.collectBones(n));
        }, this);

        // Identify structure-preserving changes. Run lcs over lower bone ends
        // in tree a and tree b. Associate the identified nodes and also their
        // ancestors except if this would result in structure-affecting change.
        lcsinst.forEachCommonSymbol(function(x, y) {
            var a = a_bones[x], b = b_bones[y];

            // Verify that ancestor chain allows that a and b to form a pair.
            if (this.matchingCheckAncestors(matching, a, b)) {
                // Record nodes a and b and all of their ancestors in the
                // matching if and only if the nearest matched ancestors are
                // partners.
                this.matchingPutAncestors(matching, a, b);
            }
        }, this);
    }, this);
};

exports.Diff = Diff;
