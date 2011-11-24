(function(exports, tree) {
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
    exports.BottomUpPathResolver = BottomUpPathResolver;
}(
    typeof exports === 'undefined' ? (DeltaJS.buresolver={}) : exports,
    typeof require === 'undefined' ? DeltaJS.tree: require('./tree.js')
));
