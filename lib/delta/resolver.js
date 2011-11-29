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
var tree = require('./tree.js');

/** @ignore */
var contextmatcher = require('./contextmatcher.js');

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

    // Install custom equality tester for content in matcher
    this.matcher.equalContent = (function(that){
        return function(subject, offset, value) {
            return that.equalContent(that.nodeindex.get(subject, offset), value);
        };
    }(this));
    // Install custom equality tester for context in matcher
    this.matcher.equalContext = (function(that){
        return function(subject, offset, value) {
            return that.equalContext(that.nodeindex.get(subject, offset), value);
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
 *
 * @return array of nodes or undefined on failure.
 */
ContextResolver.prototype.find = function(path, body, head, tail) {
    var nodes, node, siblings, lastsib, i, q = 0, f, bestnode, result, flatbody;

    // top down resolver
    nodes = this.resolver.resolve(path);

    // resort to the last node in the subtree under the preceeding sibling if
    // top-down resolver did not come through to the very last path component.
    if (nodes.length === path.length) {
        siblings = nodes[path.length-1].children;
        lastsib = siblings[siblings.length-1];
        nodes[path.length] = this.nodeindex.get(lastsib, this.nodeindex.size(lastsib) - 1);
    }

    node = nodes.pop();

    // concatenate all nodes contained in body into one array
    flatbody = [];
    body.forEach(function(n) {
        Array.prototype.push.apply(flatbody, this.nodeindex.flatten(n));
    }, this);

    // context verification and fuzzy matching
    if (node) {
        this.matcher.setPattern(flatbody, head, tail);
        for (i = -this.r; i <= this.r; i++) {
            f = this.matcher.matchQuality(node, i);
            if (f > q && f >= this.t) {
                q = f;
                bestnode = this.nodeindex.get(node, i);
            }
        }
    }

    // construct the trail of nodes up to refnode and return it
    for (result = []; bestnode; bestnode = bestnode.par) {
        result.unshift(bestnode);

        if (bestnode === this.refnode) {
            return result;
        }
    }
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
 * Try to resolve the given path top-down. Return an array of nodes which
 * were resolved properly.
 *
 * @param path  Array of integers
 * @returns The tree.Node at path or undefined if it does not exist.
 */
TopDownPathResolver.prototype.resolve = function(path) {
    var node = this.refnode,
        result = [node],
        i;

    for (i = 0; i < path.length; i++) {
        node = node.children[path[i]];
        if (!node) {
            break;
        }
        result.push(node);
    }

    return result;
};


exports.ContextResolver = ContextResolver;
exports.TopDownPathResolver = TopDownPathResolver;
