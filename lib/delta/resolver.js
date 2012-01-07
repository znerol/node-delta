/**
 * @file:   Resolver class capable of identifying nodes in a given tree by
 *          pattern matching.
 *
 * @see:    * Sebastian Rönnau, Christian Pauli, and Uwe M. Borghoff. Merging
 *            changes in XML documents using reliable context fingerprints:
 *            http://dx.doi.org/10.1145/1410140.1410151
 *          * Original Sourcecode:
 *            https://launchpad.net/xcc
 *
 * @module  resolver
 */

/** @ignore */
var tree = require('./tree');

/** @ignore */
var contextmatcher = require('./contextmatcher');

/**
 * Construct new resolver result instance.
 * @constructor
 */
function ResolverResult(anchor, tail, offset, quality) {
    this.anchor = anchor;
    this.tail = tail;
    this.offset = offset;
    this.quality = quality;
}

/**
 * Constructor for ContextResolver instances.
 *
 * @param refnode   A tree.Node, typically the root node
 * @param nodeindex An index class capable of accessing nodes by offset to
 *                  other nodes. Typically an instance of
 *                  DocumentOrderIndex should be used for this purpose.
 * @param radius    The search radius for the fuzzy matching algorithm
 * @param threshold The threshold of the fuzzy matching algorithm. A value
 *                  between 0.5 and 1. The authors of the xcc patching
 *                  algorithm recommend 0.7.
 * @param matcher   (optional) A matcher instance. Defaults to a
 *                  WeightedContextMatcher with radius=4.
 *
 * @constructor
 */
function ContextResolver(refnode, nodeindex, radius, threshold, matcher) {
    this.refnode = refnode;
    this.nodeindex = nodeindex;

    if (typeof radius === 'undefined') {
        radius = 4;
    }
    this.r = radius;

    if (typeof threshold === 'undefined') {
        threshold = 0.7;
    }
    this.t = threshold;

    this.matcher = matcher || new contextmatcher.WeightedContextMatcher(4);

    // Install custom equality tester for matcher
    this.matcher.equal = (function(that){
        return function(subject, offset, value, flag) {
            if (flag) {
                return that.equalContent(that.nodeindex.get(subject, offset), value, flag);
            }
            else {
                return that.equalContext(that.nodeindex.get(subject, offset), value);
            }
        };
    }(this));

    this.resolver = new exports.TopDownPathResolver(refnode);
}


/**
 * Compare a document node against a content node from the patch. Return
 * true if the docnode matches the patnode.
 *
 * Override this method if you use something different than the value
 * property of tree.Node.
 *
 * @param docnode   A candidate node from the document
 * @param patnode   A body-node from the pattern
 */
ContextResolver.prototype.equalContent = function(docnode, patnode) {
    return docnode === undefined ? patnode === undefined : 
        docnode && patnode && docnode.value === patnode.value;
};


/**
 * Compare a document node against a context node value. Return true if
 * the value of docnode matches the pattern value.
 *
 * Override this method if you use something different than the value
 * property of tree.Node.
 *
 * @param docnode   A candidate node from the document
 * @param patnode   The value from a context node
 */
ContextResolver.prototype.equalContext = function(docnode, value) {
    return docnode === undefined ? value === undefined :
        docnode.value === value;
};


/**
 * Given an anchor and a nodeindex, this method identifies the node which
 * matches the anchor as close as possible.
 */
ContextResolver.prototype.getClosestNode = function(anchor, nodeindex) {
    var result, siblings, lastsib;

    if (anchor.target) {
        result = anchor.target;
    }
    else {
        siblings = anchor.base.children;
        if (siblings.length === 0) {
            // First guess has no children. Just use that.
            result = anchor.base;
        }
        else if (anchor.index < 0) {
            result = nodeindex.get(siblings[0], -1);
        }
        else if (anchor.index < siblings.length) {
            // Start with the appointed child node
            result = siblings[anchor.index];
        }
        else {
            // Resort to the last node in the subtree under the preceeding
            // sibling if top-down resolver did not came through to the very
            // last path component.
            lastsib = siblings[siblings.length-1];
            result = nodeindex.get(lastsib, nodeindex.size(lastsib) - 1);
        }
    }

    return result;
}


/**
 * Locate a node at the given path starting at refnode. Try to locate the
 * target within a given radius using the fingerprint values if direct
 * lookup failed.
 *
 * @param   path        An array of numbers. Each value represents an index
 *                      into the childrens of a node in top-down order.
 * @param   body        An array containing the node sequence in question.
 *                      When resolving the location of insert operations,
 *                      the array is empty.  For updates, the array will
 *                      consist of exactly one node. Remove operations may
 *                      consist of one or more nodes.
 * @param   head        Leading context: An array containing the values of
 *                      leading nodes in the same generation.
 * @param   tail        Trailing context: An array containing the values of
 *                      trailing nodes in the same generation.
 * @param   type        Operation type. This parameter is passed to the
 *                      equalContent callback.
 *
 * @returns A result object with two properties: node holds the resolved
 * tree.Node and tail the unresolved part of path. Returns undefined on
 * failure.
 */
ContextResolver.prototype.find = function(path, body, head, tail, type) {
    var guess, node, i, q = 0, f, best, bestnode, anchor, result, flatbody;

    // Need a trueish value in order to differentiate context from content
    if (typeof type === 'undefined') {
        type = true;
    }

    if (path.length === 0) {
        // We are operating on the root node, initial guess is trivial.
        node = this.refnode;
    }
    else {
        // Start with an initial guess using the top-down path resolver.
        guess = this.resolver.resolve(path);
        node = this.getClosestNode(guess.anchor, this.nodeindex);
    }

    // concatenate all nodes contained in body into one array
    flatbody = [];
    body.forEach(function(n) {
        Array.prototype.push.apply(flatbody, this.nodeindex.flatten(n));
    }, this);

    // context verification and fuzzy matching
    if (node) {
        this.matcher.setPattern(flatbody, head, tail);
        for (i = -this.r; i <= this.r; i++) {
            f = this.matcher.matchQuality(node, i, type);
            if (f > q && f >= this.t) {
                q = f;
                best = i;
            }
        }
    }

    if (typeof best !== 'undefined') {
        if ((bestnode = this.nodeindex.get(node, best)) && bestnode.depth === path.length) {
            // Best points at an existing node with the required depth. Use
            // that as anchor.
            anchor = new tree.Anchor(this.refnode, bestnode);
        }
        else if ((bestnode = this.nodeindex.get(node, best-1)) && bestnode.depth >= path.length - 1) {
            // Go one node back in document order and find the node which is
            // at depth-1. Then point the anchor past the last child of this
            // node.
            while (bestnode.depth > path.length - 1) {
                bestnode = bestnode.par;
            }

            anchor = new tree.Anchor(this.refnode, bestnode,
                    bestnode.children.length);
        }
    }

    return new ResolverResult(anchor, anchor ? [] : path, best, q);
};


/**
 * Create a new instance of top-down path resolver
 *
 * @constructor
 */
function TopDownPathResolver(refnode) {
    this.refnode = refnode;
}


/**
 * Try to resolve the given path top-down. Return an object containing the last
 * internal node which was resolved properly as well as the unresolved tail of
 * the path. Note that leaf nodes are represented by their parent and a tail
 * containing their child-index.
 *
 * @param path  Array of integers
 * @returns A result object with two properties: node holds the resolved
 * tree.Node and tail the unresolved part of path.
 */
TopDownPathResolver.prototype.resolve = function(path, base) {
    var anchor, result;

    base = base || this.refnode;

    if (path.length <= 1) {
        anchor = new tree.Anchor(this.refnode, base, path[0]);
        result = new ResolverResult(anchor, [], 0, 1);
    }
    else {
        if (base.children[path[0]]) {
            result = this.resolve(path.slice(1), base.children[path[0]]);
        }
        else {
            path = path.slice();
            anchor = new tree.Anchor(this.refnode, base, path.shift());
            result = new ResolverResult(anchor, path, 0, 1);
        }
    }

    return result;
};


exports.ResolverResult = ResolverResult;
exports.ContextResolver = ContextResolver;
exports.TopDownPathResolver = TopDownPathResolver;
