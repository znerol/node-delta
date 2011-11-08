/**
 * @file:   Adapter class converting an XML DOM document into a simple tree
 *          structure suitable for comparison using the XCC tree diff
 *          algorithm.
 */

(function(exports, tree, platform) {
    function DOMTreeAdapter() {
    }


    DOMTreeAdapter.prototype.hash = function(node) {
        // FIXME
        return node.localName;
    };


    /**
     * Create node wrappers for the specified element or text node and all its
     * descentants and return toplevel wrapper.
     **/
    DOMTreeAdapter.prototype.adaptElement = function(element) {
        return this.mapdom(element, function(node, wrappedParent) {
            var wrappedNode;

            if (node.nodeType === 1 || node.nodeType === 3) {
                wrappedNode = tree.Node(this.hash(node), node);
                if (wrappedParent) {
                    wrappedParent.append(wrappedNode);
                }
            }

            return wrappedNode;
        });
    };


    /**
     * Create node wrappers for all element and text nodes in the specified
     * document and return the root wrapper.
     */
    DOMTreeAdapter.prototype.adaptDocument = function(doc) {
        return adaptElement(doc.documentElement);
    };


    /**
     * A function that visits every node of a DOM tree in document order. Calls
     * a callback with the visited node and the result of the callback from
     * visitting the parent node.
     *
     * This function is a modified version of Douglas Crockfords walk_the_DOM
     * function from his book "Javascript: The Good Parts".
     *
     * @param node      The DOM node representing the starting point for the
     *                  mapping operation
     * @param callback  function(node, parents_result)
     * @param T         context parameter bound to "this" when invoking the
     *                  callback 
     * @param presult   Internal use.
     */
    function mapdom(node, callback, T, presult) {
        var result = callback.call(T, node, presult);
        node = node.firstChild;
        while (node) {
            mapdom(node, callback, T, result);
            node = node.nextSibling;
        }
        return result;
    }


    /**
     * Construct a new DOM operation element capable of changing the attributes
     * of a single node.
     *
     * @param   oldnode     A DOM element representing the original node
     * @param   newnode     A DOM element representing the changed node
     */
    function DOMNodeAttributeOperation(doc, oldnode, newnode) {
        var i;

        this.doc = doc;
        this.node = oldnode;

        this.oldattrs = platform.attributesArray(oldnode);
        this.newattrs = platform.attributesArray(newnode);
        for (i = this.newattrs.length - 1; i >= 0; i--) {
            newnode.removeAttributeNode(this.newattrs[i]);
        }

        this.state = false;
    }


    /**
     * Toggle active state of this hunk.
     */
    DOMNodeAttributeOperation.prototype.toggle = function() {
        var remove = this.state ? this.newattrs : this.oldattrs,
            insert = this.state ? this.oldattrs : this.newattrs,
            i;
        for (i = 0; i < remove.length; i++) {
            this.node.removeAttributeNode(remove[i]);
        }
        for (i = 0; i < insert.length; i++) {
            this.node.setAttributeNode(insert[i]);
        }
        this.state = !this.state;
    };


    /**
     * Return true if this hunk is active.
     */
    DOMNodeAttributeOperation.prototype.isActive = function() {
        return this.state;
    };


    /**
     * Activate this hunk, remove old attributes and insert new attributes if
     * necessary.
     */
    DOMNodeAttributeOperation.prototype.activate = function() {
        if (!this.state) {
            this.toggle();
        }
    };


    /**
     * Deactivate this hunk, remove inserted attributes and reinsert removed
     * attributes if necessary.
     */
    DOMNodeAttributeOperation.prototype.deactivate = function() {
        if (this.state) {
            this.toggle();
        }
    };


    /**
     * Construct a new DOM operation element capable of replacing the specified
     * subtrees.
     *
     * @param   doc         The DOM document
     * @param   node        The DOM element whose children should be replaced
     * @param   before      The sibling where new nodes should be attached
     *                      before
     * @param   oldnodes    An array of the root DOM elements of the original
     *                      subtrees
     * @param   newnodes    An array of the root DOM elements of the changed 
     *                      subtrees
     */
    function DOMTreeSequenceOperation(doc, node, before, oldnodes, newnodes) {
        this.doc = doc;
        this.node = node;
        this.before = before;

        this.oldnodes = oldnodes;
        this.newnodes = newnodes;

        this.state = false;
    }


    /**
     * Toggle active state
     */
    DOMTreeSequenceOperation.prototype.toggle = function() {
        var remove = this.state ? this.newnodes : this.oldnodes,
            insert = this.state ? this.oldnodes : this.newnodes,
            node = this.node,
            before = this.before;

        remove.forEach(function(n) {
            node.removeChild(n);
        });
        insert.forEach(function(n) {
            node.insertBefore(n, before);
        });

        this.state = !this.state;
    };


    /**
     * Return true if the hunk is active
     */
    DOMTreeSequenceOperation.prototype.isActive = function() {
        return this.state;
    };


    /**
     * Activate this hunk, inserting new subtrees and removing old subtrees if
     * necessary.
     */
    DOMTreeSequenceOperation.prototype.activate = function() {
        if (!this.state) {
            this.toggle();
        }
    };


    /**
     * Deactivate this hunk, removing inserted nodes and inserting removed
     * nodes into if necessary.
     */
    DOMTreeSequenceOperation.prototype.deactivate = function() {
        if (this.state) {
            this.toggle();
        }
    };


    /**
     * Construct a DOM operation factory.
     */
    function DOMOperationFactory() {
    }


    /**
     * Return a new node update operation on the given node.
     *
     * @param node      A DeltaJS.tree.node
     * @param oldvalue  Single DOM element with the original properties.
     * @param newvalue  Single DOM element with the changed properties.
     */
    DOMOperationFactory.prototype.createNodeUpdateOperation = function(node, oldvalue, newvalue) {

    };


    /**
     * Return a new insert operation for a sequence of children of the given
     * node.
     *
     * @param node      A DeltaJS.tree.node
     * @param before    A DeltaJS.tree.node before which the new subtrees
     *                  should be inserted. If before is undefined, the
     *                  subtrees will be appended to the end of the children.
     * @param newvalue  Single DOM element with the new subtrees as children.
     */
    DOMOperationFactory.prototype.createSubtreeInsertOperation = function(node, before, newvalue) {

    };


    /**
     * Return a new remove operation for a sequence of children of the given
     * node.
     *
     * @param node      A DeltaJS.tree.node
     * @param before    A DeltaJS.tree.node before which the new subtrees
     *                  should be inserted. If before is undefined, the
     *                  subtrees will be appended to the end of the children.
     * @param newvalue  Single DOM element with the new subtrees as children.
     */
    DOMOperationFactory.prototype.createSubtreeRemoveOperation = function(node, oldval) {

    };

    exports.DOMTreeAdapter = DOMTreeAdapter;
    exports.DOMNodeAttributeOperation = DOMNodeAttributeOperation;
    exports.DOMTreeSequenceOperation = DOMTreeSequenceOperation;
    exports.DOMOperationFactory = DOMOperationFactory;
}(
    typeof exports === 'undefined' ? (DeltaJS.xmltree={}) : exports,
    typeof require === 'undefined' ? DeltaJS.tree: require('deltajs').tree,
    typeof require === 'undefined' ? DeltaJS.platform: require('deltajs').platform
));
