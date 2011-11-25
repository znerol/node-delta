/**
 * @file:   Adapter class for JSON delta format
 */

var deltamod = require('./delta.js');
var platform = require('./platform.js');

var TYPE_STRINGS = {};
TYPE_STRINGS[deltamod.UPDATE_NODE_TYPE] = 'node';
TYPE_STRINGS[deltamod.UPDATE_FOREST_TYPE] = 'forest';
TYPE_STRINGS['node'] = deltamod.UPDATE_NODE_TYPE;
TYPE_STRINGS['forest'] = deltamod.UPDATE_FOREST_TYPE;

function JSONDeltaAdapter(fragmentadapter) {
    this.fragmentadapter = fragmentadapter;
}

JSONDeltaAdapter.prototype.adaptDocument = function(doc) {
    var delta = new deltamod.Delta();

    // loop through children and add documents and options to delta class
    return delta;
};


JSONDeltaAdapter.prototype.adaptOperation = function(element) {

};


/**
 * Populate the document with settings and operations from delta.
 */
JSONDeltaAdapter.prototype.createDocument = function(doc, delta) {
    var i, root, element;
    // Loop through delta.operations and append them to the given document

    root = doc['delta'] = [];

    for (i = 0; i < delta.operations.length; i++) {
        element = this.constructOperationElement(doc, delta.operations[i]);
        root.push(element);
    }
};


JSONDeltaAdapter.prototype.constructOperationElement = function(doc, op) {
    var deep = (op.type !== deltamod.UPDATE_NODE_TYPE),
        element = {
            type: TYPE_STRINGS[op.type],
            fingerprint: op.fingerprint,
            path: op.path
        };

    if (op.oldvalue != null) {
        element['oldvalue'] = this.fragmentadapter.adapt(op.oldvalue, deep);
    }

    if (op.newvalue != null) {
        element['newvalue'] = this.fragmentadapter.adapt(op.newvalue, deep);
    }

    return element;
};

exports.JSONDeltaAdapter = JSONDeltaAdapter;
