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
        this.ctxresolver = new ContextResolver(radius, threshold);
        this.refnode = refnode;
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
        var best, fpstart, fpsize, i, n, generation = [];

        best = resolvePath(this.refnode, path, generation);
        best = ctxresolver.resolve(best.index, generation, values, head, tail);
        return best;
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
     *
     * @return  Object with a 'node' and an 'index' property where node
     *          represents the best matching node for the given path and index
     *          is the offset into the generation array. Optionally a 'par'
     *          property is added when the second last path component resolves
     *          to a leaf-node where subtrees may be added. In this case 'node'
     *          and 'index' is set to the nearest preceeding node in that
     *          generation which may or may not exist. In the latter case
     *          'node' will be left undefined and 'index' is set to -1.
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


    /**
     * Create a new ContextResolver instance implementing the fuzzy matching
     * mechanism.
     */
    function ContextResolver(fpradius, threshold, win) {
        if (typeof fpradius === 'undefined') {
            fpradius = 4;
        }
        this.fpradius = fpradius;

        if (typeof threshold === 'undefined') {
            threshold = 0.7;
        }
        this.t = threshold;

        this.win = win || new ContextWindow(fpradius);
    }


    /**
     * Default equality test method.
     */
    ContextResolver.prototype.equals = function(a, b) {
        return a === b;
    }


    /**
     * Verify and reposition an index into the content array by calculating
     * context fingerprints within the specified radius.
     *
     * @param   content An array of all content values
     * @param   index   Index of the initial array element
     * @param   values  Array of content values which should be verified
     * @param   head    Array of leading context items
     * @param   tail    Array of trailing context items
     */
    ContextResolver.prototype.resolve = function(index, content, values, head,
            tail) {
        var best,       // Offset of the candidate with the best match
            q = 0,      // match quality of best candidate
            qf = 0,     // match quality normalization factor
            hf=[],      // array of weighting factors for leading context
            tf=[],      // array of weighting factors for trailing context
            i, f;

        // Precalculate match quality factors
        for (i = head.length - 1; i >= 0; i--) {
            f = 1/Math.pow(2, i);
            hf.push(f);
            qf += f;
        }
        for (i = 0; i < tail.length; i++) {
            f = 1/Math.pow(2, i);
            tf.push(f);
            qf += f;
        }

        this.win.forEach(index, content, values.length, head.length, tail.length,
                function(cand_values, cand_head, cand_tail, offset) {
            var i, f = 0;
            // Check value-array. Only consider positions where values match
            // perfectly.
            for (i = 0; i < cand_values.length; i++) {
                if (!this.equals(cand_values[i], values[i])) {
                    return;
                }
            }

            if (qf) {
                // Calculate context fingerprint
                for (i = cand_head.length - 1; i >= 0; i--) {
                    f += (this.equals(cand_head[i], head[i])) * hf[i];
                }
                for (i = cand_tail.length - 1; i >= 0; i--) {
                    f += (this.equals(cand_tail[i], tail[i])) * tf[i];
                }

                // Normalize
                f /= qf;
            }
            else {
                f = 1;
            }

            if (f > q) {
                q = f;
                best = offset;
            }

        }, this);

        if (q >= this.t) {
            return best;
        }
    };


    /**
     * Create a new instance of the ContextWindow helper class.
     */
    function ContextWindow(radius) {
        this.r = radius;
    }


    /**
     * Slide window over the content and call callback for each candidate
     * sequence.
     *
     * @param   center      Center position where the first value item is
     *                      located
     * @param   content     An array of all content items
     * @param   length      Number of value items
     * @param   head        Number of leading context items
     * @param   tail        Number of trailing context items
     * @param   callback    A function(content_array, head_array, tail_array,
     *                      distance) invoked for position of the sliding
     *                      window.
     * @param   T           Optional context argument for the callback.
     */
    ContextWindow.prototype.forEach = function(center, content, length, head,
            tail, callback, T) {
        var fp, fpsize = head + length + tail,
            start = center - head,
            end = start + length + this.r,
            i, k;

        if (!length) {
            // Recenter on last head item if there are no values
            end += 2;
            start++;
        }

        for (i = start - this.r; i < end; i++) {
            fp = [];

            for (k = i; k < 0; k++) {
                fp.push(undefined);
            }

            Array.prototype.push.apply(fp, content.slice(k, i + fpsize));

            for (k = i + fpsize + content.length; k > 0; k--) {
                fp.push(undefined);
            }

            callback.call(T, fp.slice(head, head + length), fp.slice(0, head),
                    fp.slice(head + length, fpsize), i - start);
        }
    };

    exports.UniformDepthResolver = UniformDepthResolver;
    exports.ContextResolver = ContextResolver;
    exports.ContextWindow = ContextWindow;
}(
    typeof exports === 'undefined' ? (DeltaJS.resolver={}) : exports,
    typeof require === 'undefined' ? DeltaJS.tree: require('deltajs').tree
));
