(function(exports) {
    /**
     * Create a new tree node and set its value and optionally user data.
     */
    function Node(value, data) {
        this.value = value;
        this.data = data;
        this.depth = 0;

        // this.par = undefined;
        this.children = [];
        this.idx = 0;
        this.matched = false;
    }


    /**
     * Append the given node as a child node.
     */
    Node.prototype.append = function(child) {
        if (child.par) {
            throw new Error('Cannot append a child which already has a parent');
        }

        child.idx = this.children.length;
        child.depth = this.depth + 1;
        child.par = this;
        this.children[child.idx] = child;
    };


    /**
     * During matching phase, associate this node with a partner from other
     * tree.
     */
    Node.prototype.match = function(partner) {
        this.partner = partner;
        this.matched = true;
        partner.matched = true;
    };


    /**
     * Returns the next ancestor which already has been matched.
     */
    Node.prototype.firstMatchedAncestor = function() {
        var lastUnmatched = this;

        this.forEachUnmatchedAncestor(function(node) {
            lastUnmatched = node;
        });

        return lastUnmatched && lastUnmatched.par;
    };


    /**
     * Returns all ancestors which have not been matched.
     */
    Node.prototype.forEachUnmatchedAncestor = function(callback, T) {
        this.forEachAncestor(function(node) {
            if (node.matched) {
                return true;
            }
            callback.call(T, node);
        });
    };


    /**
     * Invokes a callback for the node and all its child nodes in preorder
     * (document order).
     */
    Node.prototype.forEach = function(callback, T) {
        callback.call(T, this);
        this.children.forEach(function(node) {
            node.forEach(callback, T);
        });
    };


    /**
     * Equal to forEach except that the callback is not invoked for the context
     * node
     */
    Node.prototype.forEachDescendant = function(callback, T) {
        this.children.forEach(function(node) {
            node.forEach(callback, T);
        });
    };


    /**
     * Call the given callback for the parent node and then for each ancestor
     * until reaching the root.
     */
    Node.prototype.forEachAncestor = function(callback, T) {
        var brk;
        if (this.par) {
            brk = callback.call(T, this.par);
            if (!brk) {
                this.par.forEachAncestor(callback, T);
            }
        }
    }

    exports.Node = Node;
}(
    typeof exports === 'undefined' ? (DeltaJS.tree={}) : exports
));
