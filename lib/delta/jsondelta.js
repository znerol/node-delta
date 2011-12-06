/**
 * @file:   Adapter class for JSON delta format
 *
 * @module  jsondelta
 */

/** @ignore */
var deltamod = require('./delta.js');

/** @constant */
var TYPE_STRINGS = {};
TYPE_STRINGS[deltamod.UPDATE_NODE_TYPE] = 'node';
TYPE_STRINGS[deltamod.UPDATE_FOREST_TYPE] = 'forest';
TYPE_STRINGS.node = deltamod.UPDATE_NODE_TYPE;
TYPE_STRINGS.forest = deltamod.UPDATE_FOREST_TYPE;

/**
 * @constructor
 */
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

    root = doc.delta = [];

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

    if (op.remove) {
        element.remove = this.fragmentadapter.adapt(op.remove, deep);
    }

    if (op.insert) {
        element.insert = this.fragmentadapter.adapt(op.insert, deep);
    }

    return element;
};

exports.JSONDeltaAdapter = JSONDeltaAdapter;
