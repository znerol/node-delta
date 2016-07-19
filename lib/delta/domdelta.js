/**
 * @fileoverview    Adapter class for XML/DOM based delta format
 */

/** @ignore */
var deltamod = require('./delta');

/** @ignore */
var contextdelta = require('./contextdelta');

TYPE_TAGS = {};
TYPE_TAGS[deltamod.UPDATE_NODE_TYPE] = 'node';
TYPE_TAGS[deltamod.UPDATE_FOREST_TYPE] = 'forest';
TYPE_TAGS.node = deltamod.UPDATE_NODE_TYPE;
TYPE_TAGS.forest = deltamod.UPDATE_FOREST_TYPE;

/**
 * @constructor
 */
function DOMDeltaAdapter(fragmentadapter) {
    this.fragmentadapter = fragmentadapter;
}


DOMDeltaAdapter.prototype.adaptDocument = function(doc) {
    var operations = [], root, nodes, n, i;

    // loop through children and add documents and options to delta class
    root = doc.documentElement;

    nodes = Array.prototype.slice.call(root.childNodes);
    for (i = 0; i < nodes.length; i++) {
        n = nodes[i];
        if (n.nodeType === n.ELEMENT_NODE) {
            operations.push(this.adaptOperation(n, TYPE_TAGS[n.tagName]));
        }
    }

    return operations;
};


DOMDeltaAdapter.prototype.adaptOperation = function(element, type) {
    var path = element.getAttribute('path'),
        children, remove, insert, i, n, head, tail, body;

    switch (type) {
        case deltamod.UPDATE_NODE_TYPE:
        case deltamod.UPDATE_FOREST_TYPE:
            break;
        default:
            throw new Error('Encountered unsupported change type');
    }

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

    node = this.nextElement('remove', children);
    remove = this.fragmentadapter.importFragment(node.childNodes);

    node = this.nextElement('insert', children);
    insert = this.fragmentadapter.importFragment(node.childNodes);

    node = this.nextElement('context', children);
    tail = this.parseContext(node);

    return new contextdelta.DetachedContextOperation(type, path, remove, insert, head, tail);
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
DOMDeltaAdapter.prototype.populateDocument = function(doc, operations) {
    var i, root, element;
    // Loop through operations and append them to the given document

    root = doc.createElementNS(null, 'delta');

    for (i = 0; i < operations.length; i++) {
        element = this.constructOperationElement(doc, operations[i]);
        root.appendChild(element);
    }

    doc.appendChild(root);
};


DOMDeltaAdapter.prototype.constructOperationElement = function(doc, op) {
    var tag = TYPE_TAGS[op.type],
        deep = (op.type !== deltamod.UPDATE_NODE_TYPE),
        element = doc.createElementNS(null, tag),
        remove = doc.createElementNS(null, 'remove'),
        insert = doc.createElementNS(null, 'insert'),
        head = doc.createElementNS(null, 'context'),
        tail = doc.createElementNS(null, 'context'),
        oldcontent, newcontent;

    element.setAttribute('path', op.path.join('/'));

    head.appendChild(doc.createTextNode(this.formatFingerprint(op.head)));
    element.appendChild(head);

    if (op.remove) {
        oldcontent = this.fragmentadapter.adapt(doc, op.remove, deep);
        if (typeof oldcontent === 'string') {
            remove.appendChild(doc.createCDATASection(oldcontent));
        }
        else {
            remove.appendChild(oldcontent);
        }
        element.appendChild(remove);
    }

    if (op.insert) {
        newcontent = this.fragmentadapter.adapt(doc, op.insert, deep);
        if (typeof newcontent === 'string') {
            insert.appendChild(doc.createCDATASection(newcontent));
        }
        else {
            insert.appendChild(newcontent);
        }
        element.appendChild(insert);
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


exports.DOMDeltaAdapter = DOMDeltaAdapter;
