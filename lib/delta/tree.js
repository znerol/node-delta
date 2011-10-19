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
    Node.prototype.associate = function(partner, phase) {
        this.partner = partner;
        this.matchPhase = phase;
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
    Node.prototype.forEachChild = function(callback, T) {
        this.children.forEach(function(node) {
            node.forEach(callback, T);
        });
    };

    exports.Node = Node;
}(
    typeof exports === 'undefined' ? (DeltaJS.tree={}) : exports
));
