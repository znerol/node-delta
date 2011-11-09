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
     * @param   path        An array of numbers. Each value represents an index
     *                      into the childrens of a node in top-down order.
     * @param   values      An array containing the values of the node sequence
     *                      in question. When resolving the location of insert
     *                      operations, the array is empty. For updates, the
     *                      array will consist of exactly one node. Remove
     *                      operations may consist of one or more nodes.
     * @param   head        Leading context: An array containing the values of
     *                      leading nodes in the same generation.
     * @param   tail        Trailing context: An array containing the values of
     *                      trailing nodes in the same generation.
     */
    UniformDepthResolver.prototype.find = function(path, values, head, tail) {
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
     * @param   paroff      Parent offset, internal parameter used during
     *                      recursive calls
     */
    UniformDepthResolver.prototype.resolvePath = function(node, path, generation, paroff) {
        var cand, best, offset, i, tail;

        // Reached the end of the (possibly empty) path. Best candidate is
        // therefore the reference node. Return it.
        if (path.length == 0) {
            generation.push(node);
            return {
                'index': generation.length - 1,
                'node': node
            };
        }


        if (paroff > 0) {
            // Parent offset is positive, the nearest node in the
            // generation is therefore in the last child / branch.
            offset = 0;
        }
        else if (paroff < 0) {
            // Parent offset is negative, the nearest node in the
            // generation is therefore in the first child / branch.
            offset = node.children.length - 1;
        }
        else {
            // Parent offset is zero. If the value of the path
            // components exceeds the number of children, the last
            // child is picked as the nearest node in the generation.
            offset = Math.min(path[0], node.children.length - 1);
        }

        if (path.length == 1) {
            if (!node.children.length) {
                // Paths to insert operations point to nodes which do not exist
                // yet. In that case we return the previous node in the
                // generation and add a pointer to the parent node, where the
                // new subtree should be inserted.
                best = {
                    'index': generation.length - 1,
                    'node': generation[generation.length - 1],
                    'par': node
                };
            }
            else {
                best = {
                    'index': generation.length + offset,
                    'node': node.children[offset]
                };
                Array.prototype.push.apply(generation, node.children);
            }
        }
        else {
            // Reached a leaf-node before comming to the end of the path.
            // Return without result.
            if (!node.children.length) {
                return;
            }

            tail = path.slice(1);
            for (i = 0; i < node.children.length; i++) {
                // recurse
                cand = this.resolvePath(node.children[i], tail, generation,
                        paroff || i - offset);

                if (cand && (i <= offset || !best)) {
                    // Left of the offset we always update the best candidate,
                    // right of the offset, we only do that if the we still
                    // haven't found it.
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
