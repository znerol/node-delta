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


    exports.DOMDeltaAdapter = DOMDeltaAdapter;
}(
    typeof exports === 'undefined' ? (DeltaJS.domtree={}) : exports,
    typeof require === 'undefined' ? DeltaJS.delta : require('./delta.js'),
    typeof require === 'undefined' ? DeltaJS.platform : require('./platform.js')
));
