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
    function UniformDepthResolver(refnode, radius, threshold) {
        this.refnode = refnode;

        if (typeof radius === 'undefined') {
            radius = 4;
        }
        this.r = radius;

        if (typeof threshold === 'undefined') {
            threshold = 0.7;
        }
        this.t = threshold;
    }


    /**
     * Locate a node at the given path starting at refnode. Try to locate the
     * target within a given radius using the values if direct lookup failed.
     *
     * @param   path        An array of integers
     * @param   anchor      The value of the node in question. Null when
     *                      resolving locations for insert operations.
     * @param   fingerprint An array containing the values of the neighbor
     *                      nodes.
     */
    UniformDepthResolver.prototype.find = function(path, anchor, fingerprint) {
        var best, generation = [];

        best = resolvePath(this.refnode, path, generation);

        return best.node;
    };


    /**
     * Resolve node by given path and populate the generation array with all
     * the nodes of the same depth.
     *
     * @param   node        Reference node where the process starts.
     * @param   path        An array of integers
     * @param   generation  (out) All nodes of the same depth are appended to
     *                      this array.
     */
    UniformDepthResolver.prototype.resolvePath = function(node, path, generation) {
        var cand, best, offset, i, k, tail;

        if (path.length == 0) {
            generation.push(node);
            best = {
                'index': generation.length - 1,
                'node': node
            };
        }
        else if (path.length == 1) {
            offset = Math.min(path[0] + 1, node.children.length);
            if (offset > 0) {
                best = {
                    'index': generation.length + offset - 1,
                    'node': node.children[offset - 1]
                };
                Array.prototype.push.apply(generation, node.children);
            }
        }
        else {
            tail = path.slice(1);
            offset = Math.min(path[0] + 1, node.children.length);
            // left of offset
            for (i = 0; i < offset; i++) {
                cand = this.resolvePath(node.children[i], tail, generation);
                if (cand) {
                    best = cand;
                }
            }
            // right of offset
            for (k = tail.length - 1; k >= 0; k--) {
                tail[k] = 0;
            }
            for (;i < node.children.length; i++) {
                cand = this.resolvePath(node.children[i], tail, generation);
                if (cand && !best) {
                    best = cand;
                }
            }
        }

        return best;
    };

    exports.UniformDepthResolver = UniformDepthResolver;
}(
    typeof exports === 'undefined' ? (DeltaJS.resolver={}) : exports,
    typeof require === 'undefined' ? DeltaJS.tree: require('deltajs').tree
));
