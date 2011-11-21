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

(function(exports, tree) {
    /**
     * @param   refnode     A tree.Node, typically the root node
     * @param   radius      The search radius for the fuzzy matching algorithm
     * @param   threshold   The threshold of the fuzzy matching algorithm. A
     *                      value between 0.5 and 1. The authors of the xcc
     *                      patching algorithm recommend 0.7.
     */
    function UniformDepthResolver(refnode, radius, threshold, matcher) {
        this.refnode = refnode;

        if (typeof radius === 'undefined') {
            radius = 4;
        }
        this.r = radius;

        if (typeof threshold === 'undefined') {
            threshold = 0.7;
        }
        this.t = threshold;

        this.matcher = matcher || new WeightedContextMatcher(4);

        this.genindex = new tree.GenerationIndex(refnode);
        this.genindex.buildAll();

        this.docorderidx = new tree.DocumentOrderIndex(refnode);
        this.docorderidx.buildAll();

        this.resolver = new TopDownPathResolver(refnode);
    }


    /**
     * Locate a node at the given path starting at refnode. Try to locate the
     * target within a given radius using the fingerprint values if direct
     * lookup failed.
     *
     * @param   path        An array of numbers. Each value represents an index
     *                      into the childrens of a node in top-down order.
     * @param   body        An array containing the values of the node sequence
     *                      in question. When resolving the location of insert
     *                      operations, the array is empty. For updates, the
     *                      array will consist of exactly one node. Remove
     *                      operations may consist of one or more nodes.
     * @param   head        Leading context: An array containing the values of
     *                      leading nodes in the same generation.
     * @param   tail        Trailing context: An array containing the values of
     *                      trailing nodes in the same generation.
     */
    UniformDepthResolver.prototype.find = function(path, body, head, tail, treevalidx, nodevalidx) {
        var nodes, node, q = 0, bestnode, result;

        // top down resolver
        nodes = this.resolver.resolve(path);
        node = nodes.pop();

        // context verification and refinement
        if (node) {
            this.matcher.setPattern(body, head, tail);
            for (i = -this.r; i <= this.r; i++) {
                var f = this.matcher.matchContent(i, function(offset, value) {
                    var cand = this.docorderidx.get(node, offset);
                    return treevalidx.get(cand) === value;
                }, this);

                if (f !== 1) {
                    continue;
                }

                f = this.matcher.matchContext(i, function(offset, value) {
                    var cand = this.docorderidx.get(node, offset);
                    return nodevalidx.get(cand) === value;
                }, this);

                if (f > q && f >= this.t) {
                    q = f;
                    bestnode = this.docorderidx.get(node, i);
                }
            }
        }

        if (bestnode) {
            result = [];

            while(bestnode) {
                result.push(bestnode);
                bestnode = bestnode.par;
            }

            return result;
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
    }


    /**
     * incomplete.
     */
    function BottomUpPathResolver(refnode, genindex) {
        this.refnode = refnode;
        this.genindex = genindex;
    }

    /**
     * Resolve the path and return a node which follows the node at the given
     * path in the same generation.
     *
     * @param path  An array of integers
     * @param start A tree.Node of the same generation indicating from where
     *              to start the search.
     * @return  Nearest candidate tree.Node or undefined if no node exists in
     *          the generation after path.
     */
    BottomUpPathResolver.prototype.resolveNextInGeneration = function(path, start) {
        var cand, depth = path.length;

        if (depth === 0) {
            return this.refnode;
        }

        start = start || this.genindex.first(depth);

        cand = start;
        while (cand && cand.pathcmp(path) <= 0) {
            cand = this.genindex.get(cand, 1);
        }

        return cand;
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
    }


    /**
     * Return a number between zero and one representing the match quality of
     * the pattern.
     *
     * @param offset    An integer representing the offset to the subject.
     * @param test      A callback function test(offset, value) which should
     *                  return true if the value matches the subject at offset
     *                  and false otherwise.
     */
    WeightedContextMatcher.prototype.matchQuality = function(offset, test, T)
    {
        var i, k, n, f = 0, cf = 0;

        // Check value-array. Only consider positions where body matches.
        if (this.matchContent(offset, test, T)) {
            // Match context fingerprint if any
            return this.matchContext(offset, test, T);
        }
        else {
            return 0;
        }
    };


    WeightedContextMatcher.prototype.matchContent = function(offset, test, T) {
        var i, k, n;

        // Check value-array. Only consider positions where body matches.
        n = this.body.length;
        for (i = 0, k = offset; i < n; i++, k++) {
            if (!test.call(T, k, this.body[i])) {
                return 0;
            }
        }

        return 1;
    }


    WeightedContextMatcher.prototype.matchContext = function(offset, test, T) {
        var i, k, n, f = 0, cf = 0;

        // Match context fingerprint if any
        if (this.qf.length && (this.head.length || this.tail.length)) {
            n = Math.min(this.head.length, this.qf.length);
            for (i = 0, k = offset - 1; i < n; i++, k--) {
                f += (test.call(T, k, this.head[n-i-1])) * this.qf[i];
            }
            cf += n && this.cqf[n-1];

            n = Math.min(this.tail.length, this.qf.length);
            for (i = 0, k = offset + this.body.length; i < n; i++, k++) {
                f += (test.call(T, k, this.tail[i])) * this.qf[i];
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

    exports.UniformDepthResolver = UniformDepthResolver;
    exports.WeightedContextMatcher = WeightedContextMatcher;
    exports.TopDownPathResolver = TopDownPathResolver;
}(
    typeof exports === 'undefined' ? (DeltaJS.resolver={}) : exports,
    typeof require === 'undefined' ? DeltaJS.tree: require('./tree.js')
));
