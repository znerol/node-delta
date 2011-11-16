/**
 * @file:   Adapter class for XML/DOM based delta format
 */

(function(exports, deltamod, platform) {
    TYPE_TAGS = {};
    TYPE_TAGS[deltamod.INSERT_TYPE] = 'insert';
    TYPE_TAGS[deltamod.REMOVE_TYPE] = 'remove';
    TYPE_TAGS[deltamod.UPDATE_TYPE] = 'update';

    function DOMDeltaAdapter(fragmentadapter) {
        this.fragmentadapter = fragmentadapter;
    }

    DOMDeltaAdapter.prototype.adaptDocument = function(doc) {
        var d = new deltamod.Delta();

        // loop through children and add documents and options to delta class
        return d;
    };


    DOMDeltaAdapter.prototype.adaptOperation = function(element) {

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
            deep = (op.type !== deltamod.UPDATE_TYPE),
            element = doc.createElement(tag),
            oldvalue = doc.createElement('oldvalue'),
            newvalue = doc.createElement('newvalue'),
            oldcontent, newcontent;

        element.setAttribute('path', op.path.join('/'));

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

        return element;
    };

    exports.DOMDeltaAdapter = DOMDeltaAdapter;
}(
    typeof exports === 'undefined' ? (DeltaJS.domtree={}) : exports,
    typeof require === 'undefined' ? DeltaJS.delta : require('./delta.js'),
    typeof require === 'undefined' ? DeltaJS.platform : require('./platform.js')
));
