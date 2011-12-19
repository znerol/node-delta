/**
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
 * Create a matching between the two nodes using the xcc diff algorithm
 */
Diff.prototype.matchTrees = function(matching) {
    // Associate root nodes
    matching.put(this.b, this.a);

    this.matchContent(matching);
    this.matchStructure(matching);
};


/**
 * Default equality test. Override this method if you need to test other
 * node properties instead/beside node value.
 */
Diff.prototype.equals = function(a, b) {
    return (a.value === b.value);
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
    return (node.children.length !== 0);
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
            return a.depth === b.depth && that.equals(a, b);
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

        // Bubble up hierarchy until we encounter the first ancestor which
        // already has been matched. Record potential pairs in the a_nodes and
        // b_nodes arrays.
        if (this.matchingCheckAncestors(matching, a, b)) {
            // Record nodes a and b and all of their ancestors in the matching
            // if and only if the nearest matched ancestors are partners.
            this.matchingPutAncestors(matching, a, b);
        }
    }, this);
};


/**
 * Return an array of the bottom-most structure-type nodes beneath the given
 * node.
 */
Diff.prototype.collectStructureContour = function(node) {
    var result = [], outer, i = 0;

    if (this.isStructure(node)) {
        for (i = 0; i < node.children.length; i++) {
            outer = this.collectStructureContour(node.children[i]);
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
 * @param matching      A partial matching
 * @param a_siblings    A sequence of siblings from tree a
 * @param b_siblings    A sequence of siblings from tree b
 */
Diff.prototype.forEachUnmatchedSequenceOfSiblings = function(matching, a_siblings, b_siblings, callback, T) {
    var a_unmatched = [],
        b_unmatched = [],
        i = 0,      // Array index into a_siblings
        k = 0,      // Array index into b_siblings
        a,          // Current candidate node in a_siblings
        b;          // Current candidate node in b_siblings

    // Loop through a_siblings and b_siblings simultaneously
    while (a_siblings[i] || b_siblings[k]) {
        a = a_siblings[i];
        b = b_siblings[k];

        if (a && !matching.get(a)) {
            // Skip a if above rules did not apply and a is not in the matching
            a_unmatched.push(a);
            i++;
        }
        else if (b && !matching.get(b)) {
            // Skip b if above rules did not apply and b is not in the matching
            b_unmatched.push(b);
            k++;
        }
        else if (a && b && a === matching.get(b)) {
            // Collect nodes at border structure and detect matches
            callback.call(T, a_unmatched, b_unmatched, a, b);
            a_unmatched = [];
            b_unmatched = [];

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

    if (a_unmatched.length > 0 || b_unmatched.length > 0) {
        callback.call(T, a_unmatched, b_unmatched, a, b);
    }
}


/**
 * Return true if a and b have the same value and all their ancestors either
 * also have the same value or already are part of the matching.
 */
Diff.prototype.matchingOrEqualAncestors = function(matching, a, b) {
    if (!a || !b || a.depth !== b.depth) {
        return false;
    }
    else if (!matching.get(a) && !matching.get(b)) {
        return this.equals(a, b) && 
               this.matchingOrEqualAncestors(matching, a.par, b.par);
    }
    else {
        return a === matching.get(b);
    }
};


/**
 * Traverse a partial matching and detect equal structure-type nodes between
 * matched content nodes.
 */
Diff.prototype.matchStructure = function(matching) {
    this.forEachUnmatchedSequenceOfSiblings(matching, this.a.children, this.b.children, function(a_nodes, b_nodes) {
        var a_content = [],
            b_content = [],
            lcsinst = new lcs.LCS(a_content, b_content);

        // Leaves are considered equal if their values match and if they have
        // the same tree depth. Need to wrap the equality-test function into
        // a closure executed immediately in order to maintain correct context
        // (rename 'this' into 'that').
        lcsinst.equals = (function(that){
            return function(a, b) {
                return that.matchingOrEqualAncestors(matching, a, b);
            };
        }(this));

        // Populate leave-node arrays.
        a_nodes.forEach(function(n) {
            Array.prototype.push.apply(a_content, this.collectStructureContour(n));
        }, this);
        b_nodes.forEach(function(n) {
            Array.prototype.push.apply(b_content, this.collectStructureContour(n));
        }, this);

        // Identify structure-preserving changes. Run lcs over leave nodes of
        // tree a and tree b. Associate the identified leaf nodes and also
        // their ancestors except if this would result in structure-affecting
        // change.
        lcsinst.forEachCommonSymbol(function(x, y) {
            var a = a_content[x], b = b_content[y];

            // Bubble up hierarchy until we encounter the first ancestor which
            // already has been matched. Record potential pairs in the a_nodes and
            // b_nodes arrays.
            if (this.matchingCheckAncestors(matching, a, b)) {
                // Record nodes a and b and all of their ancestors in the matching
                // if and only if the nearest matched ancestors are partners.
                this.matchingPutAncestors(matching, a, b);
            }
        }, this);
    }, this);
}

exports.Diff = Diff;
