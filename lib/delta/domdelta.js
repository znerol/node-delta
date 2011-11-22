/**
 * @file:   Adapter class for XML/DOM based delta format
 */

(function(exports, deltamod, platform) {
    TYPE_TAGS = {};
    TYPE_TAGS[deltamod.INSERT_TYPE] = 'insert';
    TYPE_TAGS[deltamod.REMOVE_TYPE] = 'remove';
    TYPE_TAGS[deltamod.UPDATE_TYPE] = 'update';
    TYPE_TAGS['insert'] = deltamod.INSERT_TYPE;
    TYPE_TAGS['remove'] = deltamod.REMOVE_TYPE;
    TYPE_TAGS['update'] = deltamod.UPDATE_TYPE;

    function DOMDeltaAdapter(fragmentadapter) {
        this.fragmentadapter = fragmentadapter;
    }

    DOMDeltaAdapter.prototype.adaptDocument = function(doc) {
        var delta = new deltamod.Delta(), root, nodes, n, i, op, optype;

        // loop through children and add documents and options to delta class
        root = doc.documentElement;

        nodes = Array.prototype.slice.call(root.childNodes);
        for (i = 0; i < nodes.length; i++) {
            n = nodes[i];
            if (n.nodeType !== n.ELEMENT_NODE) {
                continue;
            }

            optype = TYPE_TAGS[n.tagName];
            if (typeof optype === 'number') {
                op = this.adaptOperation(n, optype);
                delta.add(op);
            }
        }

        return delta;
    };


    DOMDeltaAdapter.prototype.adaptOperation = function(element, type) {
        var deep = (type !== deltamod.UPDATE_OPERATION),
            path = element.getAttribute('path'),
            children, oldvalue, newvalue, i, n, head, tail, body;

        // Parse path
        if (path === '') {
            path = [];
        }
        else {
            path = path.split('/').map(function(component) {
                return parseInt(component, 10);
            });
        }

        children = Array.prototype.slice.call(element.childNodes);
        node = this.nextElement('context', children);
        head = this.parseContext(node);

        node = this.nextElement('oldvalue', children);
        oldvalue = this.fragmentadapter.importFragment(node.childNodes);

        node = this.nextElement('newvalue', children);
        newvalue = this.fragmentadapter.importFragment(node.childNodes);

        node = this.nextElement('context', children);
        tail = this.parseContext(node);

        return new deltamod.Operation(type, path, head, tail, oldvalue, newvalue);
    };


    DOMDeltaAdapter.prototype.nextElement = function(tag, domnodes) {
        var node;
        while((node = domnodes.shift()) && node.nodeType !== node.ELEMENT_NODE) {
            if (node.tagName === tag) {
                break;
            }
        }
        return node;
    }


    DOMDeltaAdapter.prototype.nextText = function(domnodes) {
        var node;
        while((node = domnodes.shift()) && node.nodeType !== node.TEXT_NODE);
        return node;
    }


    DOMDeltaAdapter.prototype.parseContext = function(node) {
        var children = Array.prototype.slice.call(node.childNodes);
        var text = this.nextText(children);
        if (text) {
            return text.nodeValue.split(';').map(function(component) {
                component = component.trim();
                if (component.length) {
                    return parseInt(component, 16);
                }
            });
        }
    }


    /**
     * Populate the document with settings and operations from delta.
     */
    DOMDeltaAdapter.prototype.createDocument = function(doc, delta) {
        var i, root, element;
        // Loop through delta.operations and append them to the given document

        root = doc.createElement('delta');

        for (i = 0; i < delta.operations.length; i++) {
            element = this.constructOperationElement(doc, delta.operations[i]);
            root.appendChild(element);
        }

        doc.appendChild(root);
    };


    DOMDeltaAdapter.prototype.constructOperationElement = function(doc, op) {
        var tag = TYPE_TAGS[op.type],
            deep = (op.type !== deltamod.UPDATE_TYPE),
            element = doc.createElement(tag),
            oldvalue = doc.createElement('oldvalue'),
            newvalue = doc.createElement('newvalue'),
            head = doc.createElement('context'),
            tail = doc.createElement('context'),
            oldcontent, newcontent;

        element.setAttribute('path', op.path.join('/'));

        head.appendChild(doc.createTextNode(this.formatFingerprint(op.head)));
        element.appendChild(head);

        if (op.oldvalue != null) {
            oldcontent = this.fragmentadapter.adapt(op.oldvalue, deep);
            if (typeof oldcontent === 'string') {
                oldvalue.appendChild(doc.createCDATASection(oldcontent));
            }
            else {
                oldvalue.appendChild(oldcontent);
            }
            element.appendChild(oldvalue);
        }

        if (op.newvalue != null) {
            newcontent = this.fragmentadapter.adapt(op.newvalue, deep);
            if (typeof newcontent === 'string') {
                newvalue.appendChild(doc.createCDATASection(newcontent));
            }
            else {
                newvalue.appendChild(newcontent);
            }
            element.appendChild(newvalue);
        }

        tail.appendChild(doc.createTextNode(this.formatFingerprint(op.tail)));
        element.appendChild(tail);

        return element;
    };

    DOMDeltaAdapter.prototype.formatFingerprint = function(parts) {
        return parts.map(function(n) {
            return n ? n.toString(16) : '';
        }).join(';');
    }


    /**
     * Construct a new DOM operation element capable of changing the attributes
     * of a single node.
     *
     * @param   oldnode     A DOM element representing the original node
     * @param   newnode     A DOM element representing the changed node
     */
    function DOMNodeAttributeOperationHandler(oldnode, newnode) {
        var i, oldattrs, newattrs;

        this.node = oldnode;

        oldattrs = platform.attributesArray(oldnode);
        newattrs = platform.attributesArray(newnode);
        for (i = newattrs.length - 1; i >= 0; i--) {
            newnode.removeAttributeNode(newattrs[i]);
        }

        this.oldattrs = oldattrs;
        this.newattrs = newattrs;

        this.state = false;
    }


    /**
     * Toggle active state of this hunk.
     */
    DOMNodeAttributeOperationHandler.prototype.toggle = function() {
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
    DOMNodeAttributeOperationHandler.prototype.isActive = function() {
        return this.state;
    };


    /**
     * Activate this hunk, remove old attributes and insert new attributes if
     * necessary.
     */
    DOMNodeAttributeOperationHandler.prototype.activate = function() {
        if (!this.state) {
            this.toggle();
        }
    };


    /**
     * Deactivate this hunk, remove inserted attributes and reinsert removed
     * attributes if necessary.
     */
    DOMNodeAttributeOperationHandler.prototype.deactivate = function() {
        if (this.state) {
            this.toggle();
        }
    };


    /**
     * Construct a new DOM operation element capable of replacing the specified
     * subtrees.
     *
     * @param   node        The DOM element whose children should be replaced
     * @param   before      The sibling where new nodes should be attached
     *                      before
     * @param   oldnodes    An array of the root DOM elements of the original
     *                      subtrees
     * @param   newnodes    An array of the root DOM elements of the changed 
     *                      subtrees
     */
    function DOMTreeSequenceOperationHandler(node, before, oldnodes, newnodes) {
        this.node = node;
        this.before = before;

        this.oldnodes = oldnodes;
        this.newnodes = newnodes;
    }


    /**
     * Toggle active state
     */
    DOMTreeSequenceOperationHandler.prototype.toggle = function() {
        var remove = this.state ? this.newnodes : this.oldnodes,
            insert = this.state ? this.oldnodes : this.newnodes,
            node = this.node,
            before = this.before,
            i;

        for (i = 0; i < remove.length; i++) {
            node.removeChild(remove[i]);
        }
        for (i = 0; i < insert.length; i++) {
            node.insertBefore(insert[i], before);
        }

        this.state = !this.state;
    };


    /**
     * Return true if the hunk is active
     */
    DOMTreeSequenceOperationHandler.prototype.isActive = function() {
        return this.state;
    };


    /**
     * Activate this hunk, inserting new subtrees and removing old subtrees if
     * necessary.
     */
    DOMTreeSequenceOperationHandler.prototype.activate = function() {
        if (!this.state) {
            this.toggle();
        }
    };


    /**
     * Deactivate this hunk, removing inserted nodes and inserting removed
     * nodes into if necessary.
     */
    DOMTreeSequenceOperationHandler.prototype.deactivate = function() {
        if (this.state) {
            this.toggle();
        }
    };


    /**
     * Construct a DOM operation factory.
     */
    function DOMOperationHandlerFactory() {
    }


    /**
     * Return a new node update operation on the given node.
     *
     * @param oldnode   A DeltaJS.tree.node pointing to the node with old values
     * @param newnode   A DeltaJS.tree.node pointing to the node with the new values
     */
    DOMOperationHandlerFactory.prototype.createNodeUpdateOperationHandler = function(
            oldnode, newnode) {
        oldvalue = oldnode.data;
        newvalue = oldnode.data.ownerDocument.importNode(newnode.data, false);
        return new DOMNodeAttributeOperationHandler(oldvalue, newvalue);
    };


    /**
     * Return a new insert operation for a sequence of children of the given
     * node.
     *
     * @param node      A DeltaJS.tree.node
     * @param before    Index of the child node before which the new nodes will
     *                  be inserted.
     * @param newnodes  Sequence of DeltaJS.tree.node to insert
     */
    DOMOperationHandlerFactory.prototype.createSubtreeInsertOperationHandler = function(node,
            before, newnodes) {
        var doc = node.data.ownerDocument,
            domnodes = [], i, n;

        before = node.children[before] && node.children[before].data;

        if (newnodes.length > 0) {
            for (i = 0; i < newnodes.length; i++) {
                domnodes.push(doc.importNode(newnodes[i].data));
            }
        }
        return new DOMTreeSequenceOperationHandler(node.data, before, [], domnodes);
    };


    /**
     * Return a new remove operation for a sequence of children of the given
     * node.
     *
     * @param node      A DeltaJS.tree.node
     * @param begin     Index of the first child node affected by the remove
     *                  operation.
     * @param length    Number of child nodes to be removed.
     */
    DOMOperationHandlerFactory.prototype.createSubtreeRemoveOperationHandler = function(node, begin, length) {
        var oldnodes = [], before, i, n;

        if (length) {
            n = begin + length;
            for (i = begin; i < n; i++) {
                oldnodes.push(node.children[i].data);
            }
            before = oldnodes[oldnodes.length - 1].nextSibling;

            return new DOMTreeSequenceOperationHandler(node.data, before, oldnodes, []);
        }
    };


    exports.DOMDeltaAdapter = DOMDeltaAdapter;
    exports.DOMNodeAttributeOperationHandler = DOMNodeAttributeOperationHandler;
    exports.DOMTreeSequenceOperationHandler = DOMTreeSequenceOperationHandler;
    exports.DOMOperationHandlerFactory = DOMOperationHandlerFactory;
}(
    typeof exports === 'undefined' ? (DeltaJS.domtree={}) : exports,
    typeof require === 'undefined' ? DeltaJS.delta : require('./delta.js'),
    typeof require === 'undefined' ? DeltaJS.platform : require('./platform.js')
));
