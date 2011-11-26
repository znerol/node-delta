/**
 * @file:   Resolver class capable of identifying nodes in a given tree by
 *          pattern matching.
 *
 * @see:    * Sebastian Rönnau, Christian Pauli, and Uwe M. Borghoff. Merging
 *            changes in XML documents using reliable context fingerprints:
 *            http://dx.doi.org/10.1145/1410140.1410151
 *          * Original Sourcecode:
 *            https://launchpad.net/xcc
 */

var tree = require('./tree.js');
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

    this.matcher = matcher || new exports.WeightedContextMatcher(4);

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
    var nodes, node, q = 0, f, bestnode, result, flatbody;

    // top down resolver
    nodes = this.resolver.resolve(path);
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
            f = this.matcher.matchContent(node, i);
            if (f === 1) {
                f = this.matcher.matchContext(node, i);
                if (f > q && f >= this.t) {
                    q = f;
                    bestnode = this.nodeindex.get(node, i);
                }
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


/**
 * Create a new WeightedContextMatcher instance implementing the fuzzy
 * matching mechanism.
 *
 * @param radius    Maximum radius of the fingerprint. Values greater than
 *                  four are not recommended.
 */
function WeightedContextMatcher(radius) {
    var f, cf = 0;

    if (typeof radius === 'undefined') {
        radius = 4;
    }
    this.r = radius;

    // Match quality factors
    this.qf = [];

    // Cummulative match quality factor used for normalization
    this.cqf = [];

    // Precompute match quality factors for given fingerprint radius
    for (i = 0; i < this.r; i++) {
        f = 1/Math.pow(2, i);
        this.qf[i] = f;
        cf += f;
        this.cqf[i] = cf;
    }

    this.body = [];
    this.head = [];
    this.tail = [];
}


/**
 * Return true if subject at offset is equal to the candidate value. Override
 * this method if your values need special handling.
 */
WeightedContextMatcher.prototype.equalContent = function(subject, offset, value) {
    return subject[offset] === value;
};


/**
 * Return true if subject at offset is equal to the context value. Override
 * this method if your values need special handling.
 */
WeightedContextMatcher.prototype.equalContext = function(subject, offset, value) {
    return subject[offset] === value;
};


/**
 * Set the pattern consisting of the body and the context which should be
 * matched against candidates using matchQuality method subsequently.
 *
 * @param body  Array of context elements between head and tail
 * @param head  Array of leading context elements
 * @param tail  Array of trailing context elements
 */
WeightedContextMatcher.prototype.setPattern = function(body, head, tail) {
    this.body = body;
    this.head = head || [];
    this.tail = tail || [];
};


/**
 * Return a number between zero and one representing the match quality of
 * the pattern.
 *
 * @param offset    An integer representing the offset to the subject.
 */
WeightedContextMatcher.prototype.matchQuality = function(subject, offset)
{
    return this.matchContent(subject, offset) &&
        this.matchContext(subject, offset);
};


/**
 * Return 1 if every body-item of the pattern matches the candidates
 * exactly. Otherwise return 0.
 */
WeightedContextMatcher.prototype.matchContent = function(subject, offset) {
    var i, k, n;

    // Check value-array. Only consider positions where body matches.
    n = this.body.length;
    for (i = 0, k = offset; i < n; i++, k++) {
        if (!this.equalContent(subject, k, this.body[i])) {
            return 0;
        }
    }

    return 1;
};


/**
 * Return a number between 0 and 1 representing the match quality of the
 * pattern context with the candidate.
 */
WeightedContextMatcher.prototype.matchContext = function(subject, offset) {
    var i, k, n, f = 0, cf = 0;

    // Match context fingerprint if any
    if (this.qf.length && (this.head.length || this.tail.length)) {
        n = Math.min(this.head.length, this.qf.length);
        for (i = 0, k = offset - 1; i < n; i++, k--) {
            f += this.equalContext(subject, k, this.head[n-i-1]) * this.qf[i];
        }
        cf += n && this.cqf[n-1];

        n = Math.min(this.tail.length, this.qf.length);
        for (i = 0, k = offset + this.body.length; i < n; i++, k++) {
            f += this.equalContext(subject, k, this.tail[i]) * this.qf[i];
        }
        cf += n && this.cqf[n-1];

        // Normalize
        f /= cf;
    }
    else {
        f = 1;
    }

    return f;
};

exports.ContextResolver = ContextResolver;
exports.TopDownPathResolver = TopDownPathResolver;
exports.WeightedContextMatcher = WeightedContextMatcher;
