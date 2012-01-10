/**
 * @fileoverview This module provides the DeltaDocument object.
 */

/**
 * Create new delta document instance.
 *
 * @param {string}  type    The document type. E.g. 'xml' or 'json'
 * @param {string}  [name]  The file name.
 * @param {object}  data    A reference to the underlying document, the DOM.
 * @param {array}   [attached]  An array of attached operations (
 *         :js:class:AttachedOperation).
 * @param {array}   [detached]  An array of detached operations (e.g.
 *         :js:class:DetachedContextOperation) when loading from a file.
 * @param {string}  [src]   The serialized version of this document, e.g. the
 *         XML markup code.
 * @param {object}  [matching]  A matching which should be used to build up the
 *         document later on.
 *
 * @constructor
 */
function DeltaDocument(type, name, data, attached, detached, src, matching) {
    /**
     * The document type. E.g. 'xml' or 'json'
     */
    this.type = type;

    /**
     * The file name
     */
    this.name = name;

    /**
     * A reference to the underlying document, e.g. the DOMDocument object.
     */
    this.data = data;

    /**
     * An array of attached operations.
     */
    this.attached = attached || [];

    /**
     * An array of dettached operations.
     */
    this.detached = detached || [];

    /**
     * The serialized version of this document.
     */
    this.src = src || '';

    /**
     * A matching which is used to collect attached operations when building
     * the delta document.
     */
    this.matching = matching;
}


/**
 * Install handlers for a resolved delta.
 *
 * @param {Object}  handlerfactory  An instance returned from the document
 *         factory ``createHandlerFactory`` method.
 */
DeltaDocument.prototype.installHandlers = function(handlerfactory) {
    var i, op;

    // Install handlers for attached operations
    for (i = 0; i < this.attached.length; i++) {
        op = this.attached[i];
        if (op && !op.handler) {
            op.handler = handlerfactory.createOperationHandler(op.anchor,
                    op.type, op.path, op.remove, op.insert);
        }
    }
}


/**
 * Toggle all handlers of a delta document.
 */
DeltaDocument.prototype.toggleHandlers = function() {
    var i, op;

    // Toggle handler for each attached operation
    for (i = 0; i < this.attached.length; i++) {
        op = this.attached[i];
        if (op && op.handler) {
            op.handler.toggle();
        }
    }
}

exports.DeltaDocument = DeltaDocument;
