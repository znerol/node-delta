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
    }


    /**
     * Append the given node as a child node.
     */
    Node.prototype.append = function(child) {
        if (child.par) {
            throw new Error('Cannot append a child which already has a parent');
        }

        child.depth = this.depth + 1;
        child.par = this;
        this.children.push(child);
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
     * Invokes a callback for the node and all its child nodes in postorder.
     */
    Node.prototype.forEachPostorder = function(callback, T) {
        this.children.forEach(function(node) {
            node.forEachPostorder(callback, T);
        });
        callback.call(T, this);
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
     * until reaching the root or callback returns a trueish value.
     */
    Node.prototype.forEachAncestor = function(callback, T) {
        var brk;
        if (this.par) {
            brk = callback.call(T, this.par);
            if (!brk) {
                this.par.forEachAncestor(callback, T);
            }
        }
    };


    /**
     * Create a new Matching instance. Optionally specify the property used to
     * store partner links in target objects.
     */
    function Matching(propname) {
        this.propname = propname || 'partner';
    }


    /**
     * Return the partner of given object.
     */
    Matching.prototype.get = function(obj) {
        return obj && obj[this.propname];
    };


    /**
     * Associate the given objects.
     */
    Matching.prototype.put = function(a, b) {
        if (a[this.propname] || b[this.propname]) {
            throw new Error('Cannot associate objects which are already part of a matching');
        }
        a[this.propname] = b;
        b[this.propname] = a;
    };


    exports.Node = Node;
    exports.Matching = Matching;
}(
    typeof exports === 'undefined' ? (DeltaJS.tree={}) : exports
));
