/**
 * @file:   Adapter class for XML/DOM based delta format
 */

var deltamod = require('./delta.js');

TYPE_TAGS = {};
TYPE_TAGS[deltamod.UPDATE_NODE_TYPE] = 'node';
TYPE_TAGS[deltamod.UPDATE_FOREST_TYPE] = 'forest';
TYPE_TAGS.node = deltamod.UPDATE_NODE_TYPE;
TYPE_TAGS.forest = deltamod.UPDATE_FOREST_TYPE;

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
        if (n.nodeType === n.ELEMENT_NODE) {
            optype = TYPE_TAGS[n.tagName];
            if (typeof optype === 'number') {
                op = this.adaptOperation(n, optype);
                delta.add(op);
            }
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
    var node = domnodes.shift();
    while (node && node.nodeType !== node.ELEMENT_NODE) {
        if (node.tagName === tag) {
            break;
        }
        node = domnodes.shift();
    }
    return node;
};


DOMDeltaAdapter.prototype.nextText = function(domnodes) {
    var node = domnodes.shift();
    while(node && node.nodeType !== node.TEXT_NODE) {
        node = domnodes.shift();
    }
    return node;
};


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
};


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
        deep = (op.type !== deltamod.UPDATE_NODE_TYPE),
        element = doc.createElement(tag),
        oldvalue = doc.createElement('oldvalue'),
        newvalue = doc.createElement('newvalue'),
        head = doc.createElement('context'),
        tail = doc.createElement('context'),
        oldcontent, newcontent;

    element.setAttribute('path', op.path.join('/'));

    head.appendChild(doc.createTextNode(this.formatFingerprint(op.head)));
    element.appendChild(head);

    if (op.oldvalue) {
        oldcontent = this.fragmentadapter.adapt(op.oldvalue, deep);
        if (typeof oldcontent === 'string') {
            oldvalue.appendChild(doc.createCDATASection(oldcontent));
        }
        else {
            oldvalue.appendChild(oldcontent);
        }
        element.appendChild(oldvalue);
    }

    if (op.newvalue) {
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
};


function DOMNodeReplaceOperationHandler(orignode, changednode) {
    this.orignode = orignode;
    this.changednode = changednode;

    // Changed node may not have any children
    while(this.changednode.firstChild) {
        this.changednode.removeChild(this.changednode.firstChild);
    }

    this.state = false;
}


/**
 * Toggle active state of this hunk.
 */
DOMNodeReplaceOperationHandler.prototype.toggle = function() {
    var fromnode = this.state ? this.changednode : this.orignode,
        tonode = this.state ? this.orignode : this.changednode,
        parent = (fromnode === fromnode.ownerDocument.documentElement) ?
            fromnode.ownerDocument : fromnode.parentNode;

    // Move children
    while (fromnode.firstChild) {
        tonode.appendChild(fromnode.firstChild);
    }

    // Replace node
    parent.replaceChild(tonode, fromnode);

    this.state = !this.state;
};


/**
 * Return true if this hunk is active.
 */
DOMNodeReplaceOperationHandler.prototype.isActive = function() {
    return this.state;
};


/**
 * Activate this hunk, remove old attributes and insert new attributes if
 * necessary.
 */
DOMNodeReplaceOperationHandler.prototype.activate = function() {
    if (!this.state) {
        this.toggle();
    }
};


/**
 * Deactivate this hunk, remove inserted attributes and reinsert removed
 * attributes if necessary.
 */
DOMNodeReplaceOperationHandler.prototype.deactivate = function() {
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
    if (oldnode.length !== 1 || newnode.length !== 1) {
        throw new Error('Node update operation requires exactly one old and one new node');
    }

    oldvalue = oldnode.data;
    newvalue = oldnode.data.ownerDocument.importNode(newnode.data, false);
    return new DOMNodeReplaceOperationHandler(oldvalue, newvalue);
};


/**
 * Return a new forest update operation for a sequence of children of the given
 * node. Remove all children from start through length and replace them with
 * the subtrees given in the replacement array.
 *
 * @param node      A DeltaJS.tree.node
 * @param start     Index of first node which should be removed. Should point
 *                  to the node before which elements should be inserted if no
 *                  nodes are to be removed.
 * @param length    Number of tree nodes to be removed
 * @param replacement   Array of replacement tree nodes
 */
DOMOperationHandlerFactory.prototype.createForestUpdateOperationHandler = function(
        node, start, length, replacement) {
    var doc = node.data.ownerDocument, oldnodes = [], newnodes = [], i;

    if (!length && !replacement.length) {
        throw new Error('Forest update operation requires at least one node');
    }

    for (i = start; i < start + length; i++) {
        oldnodes.push(node.children[i].data);
    }
    for (i = 0; i < replacement.length; i++) {
        newnodes.push(doc.importNode(replacement[i].data, true));
    }

    if (length) {
        before = oldnodes[oldnodes.length - 1].nextSibling;
    }
    else {
        before = node.children[start] && node.children[start].data;
    }

    return new DOMTreeSequenceOperationHandler(node.data, before, oldnodes, newnodes);
};




exports.DOMDeltaAdapter = DOMDeltaAdapter;
exports.DOMNodeReplaceOperationHandler = DOMNodeReplaceOperationHandler;
exports.DOMTreeSequenceOperationHandler = DOMTreeSequenceOperationHandler;
exports.DOMOperationHandlerFactory = DOMOperationHandlerFactory;
