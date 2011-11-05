/**
 * Leaf update detection modellef after the original xcc implementation, which
 * however runs in O(n^2) time.
 */

DeltaJS.xcc.InstallXCCOriginalLeafUpdateAlgorithm = function(xcc) {
    /**
     * Private utility function: Recursively match internal nodes top-down by
     * inspecting their neighborhood.
     */
    function matchNodeTopDown(matching, b, a, a_pms, b_pms, callback, T) {
        var result;

        // Cannot match if one of the nodes is undefined
        if (!a || !b) {
            return false;
        }
        // Return true if this matching already exists
        if (matching.get(b) === a) {
            return true;
        }
        // Node a or b is already involved in a matching and therefore may not
        // form another pair.
        if (matching.get(b) || matching.get(a)) {
            return false;
        }

        // Recurse
        result = matchNodeTopDown(matching, b.par, a.par);

        // If parents do not form a pair, a and b must not either
        if (!result) {
            return false;
        }

        // Run supplied testing function
        if (callback && !callback.call(T, b, a)) {
            return false;
        }

        // Figure out nearest previous siblings of a and b which are part of
        // the matching. No match is possible if those are not equal.
        if (matching.get(b_pms.get(b)) !== a_pms.get(a)) {
            return false;
        }

        // Record the matching between a and b if we manage to come so far.
        matching.put(b, a);
        return true;
    }


    /**
     * Private utility function: Return true if the two given internal nodes
     * may form a pair, i.e. have the same (hash-)value.
     */
    function testNodePair(b, a) {
        return b.value === a.value;
    }


    /**
     * Private utility function: FIXME: Return true if the two given leaf nodes
     * may form a pair, i.e. have the same node-type.
     */
    function testLeafPair(b, a) {
        return true;
    }


    /**
     * Private utility class: Cache previous matching siblings with linear
     * lookup time by augmenting node-objects with a pms property.
     */
    function MatchingSiblingCache(tree, matching, propname) {
        var val;
        this.propname = propname || 'pms';
        tree.forEach(function(n) {
            if (matching.get(n)) {
                val = n;
            }
            else if (n.idx === 0) {
                val = undefined;
            }
        n[this.propname] = val
        }, this);
    }

    /**
     * Return the nearest previous matching sibling from the cache.
     */
    MatchingSiblingCache.prototype.get = function(node) {
        return node[this.propname];
    }


    /**
     * Detect updated leaf nodes by analyzing their neighborhood top-down.
     */
    xcc.matchLeafUpdates = function(matching) {
        var a_leaves = [],  // Unmatched leave nodes from tree a (potentially removed)
            b_leaves = [],  // Unmatched leave nodes from tree b (potentially inserted)
            a, b, i, k, k0, lasttest, a_pms, b_pms;

        // Find all leaves which are not part of the matching in tree a. These
        // are the candidates which would be removed.
        this.a.forEachDescendant(function(n) {
            if (n.children.length === 0 && !matching.get(n)) {
                a_leaves.push(n);
            }
        });
        // Find all leaves which are not part of the matching in tree b. These
        // are the candidates which would be inserted.
        this.b.forEachDescendant(function(n) {
            if (n.children.length === 0 && !matching.get(n)) {
                b_leaves.push(n);
            }
        });

        // Populate nearest previous matching sibling cache
        a_pms = new MatchingSiblingCache(this.a, matching);
        b_pms = new MatchingSiblingCache(this.b, matching);

        // Loop through every non-matched leaf in tree b as long as there are
        // also match candidates in tree a.
        for (i = 0, k0 = 0; i < b_leaves.length && k0 < a_leaves.length; i++) {
            b = b_leaves[i];
            // For each b, loop through every non-matched leaf in tree a.
            for (k = k0; k < a_leaves.length; k++) {
                a = a_leaves[k];

                lasttest = (a.depth === b.depth) ? testLeafPair : testNodePair;

                // Bring candidates onto the same tree-level
                while (b.depth < a.depth) {
                    a = a.par;
                }
                while (b.depth > a.depth) {
                    b = b.par;
                }

                // Match all ancestors top-down
                if (matchNodeTopDown(matching, b.par, a.par, a_pms, b_pms, testNodePair) &&
                        matchNodeTopDown(matching, b, a, a_pms, b_pms, lasttest)) {

                    // Leaves up to and including the matched leaf from
                    // a_leaves are not considered in subsequent searches.
                    k0 = k + 1;
                    break;
                }
            }
        }
    };
}
