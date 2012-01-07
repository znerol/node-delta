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
function ResolverResult(refnode, base, tail) {
    this.anchor = new tree.Anchor(refnode, base, tail[0]);
    this.tail = tail.splice(1);
}


/**
 * Return true if the path has been resolved completely.
 */
ResolverResult.prototype.isComplete = function() {
    return this.tail.length === 0;
}

/**
 * Return the target node. This method will return undefined if the resolved
 * path pointed at a non-existant node.
 */
ResolverResult.prototype.getTarget = function() {
    if (this.isComplete()) {
        return this.anchor.target;
    }
}

/**
 * Return the child index of the target node. This method will return undefined
 * if the resolution was not complete. It also returns undefined if the path
 * points at the root node (tail.length === 0).
 */
ResolverResult.prototype.getTargetIndex = function() {
    if (this.isComplete()) {
        return this.anchor.index;
    }
}

/**
 * Return the anchor node, i.e. the parent of the target. This method will
 * return undefined if the resolution was not complete. It also returns
 * undefined if the path points at the root node (tail.length === 0).
 */
ResolverResult.prototype.getAnchor = function() {
    if (this.isComplete()) {
        return this.anchor.base;
    }
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
    var guess, node, i, q = 0, f, best, bestnode, result, flatbody;

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
            // construct the trail of nodes up to refnode and return it
            result = new ResolverResult(this.refnode, bestnode.par,
                    [bestnode.childidx].slice(0, path.length));
        }
        else if ((bestnode = this.nodeindex.get(node, best-1)) && bestnode.depth >= path.length - 1) {
            // strip path components until we get to the parent of the position
            // in question
            while (bestnode.depth > path.length - 1) {
                bestnode = bestnode.par;
            }

            result = new ResolverResult(this.refnode, bestnode,
                    [bestnode.children.length]);
        }
    }

    return result;
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
TopDownPathResolver.prototype.resolve = function(path) {
    var node = this.refnode,
        tail = path.slice();

    while (tail.length > 1) {
        if (node.children[tail[0]]) {
            node = node.children[tail[0]];
            tail.shift();
        }
        else {
            break;
        }
    }

    return new ResolverResult(this.refnode, node, tail);
};


exports.ResolverResult = ResolverResult;
exports.ContextResolver = ContextResolver;
exports.TopDownPathResolver = TopDownPathResolver;
