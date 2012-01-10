/**
 * @fileoverview This module provides the pure data object Document
 */

/**
 * Create new document instance.
 *
 * @param {string}  type    The document type. E.g. 'xml' or 'json'
 * @param {string}  [name]  The file name.
 * @param {object}  data    A reference to the underlying document, the DOM.
 * @param {object}  [tree]  The root node of the document tree. Use an instance
 *         of :js:class:`Node`.
 * @param {string}  [src]   The serialized version of this document, e.g. the
 *         XML markup code.
 * @param {object}  [valueindex]    The object necessary to lookup node values.
 *         E.g. an instance of :js:class:`NodeHashIndex`.
 * @param {object}  [treevalueindex]    The object necessary to lookup the
 *         value of a whole subtree. E.g. an instance of
 *         :js:class:`TreeHashIndex`.
 * @param {object}  [nodeindex] The object necessary to resolve nodes relative
 *         to other nodes when generating and verifying context. Typically this
 *         should be an instance of :js:class:`DocumentOrderIndex`.
 *
 * @constructor
 */
function Document(type, name, data, tree, src, valueindex, treevalueindex, nodeindex) {
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
     * The root node of the document tree.
     */
    this.tree = tree;

    /**
     * The serialized version of this document.
     */
    this.src = src;

    /**
     * An object used to lookup node values.
     */
    this.valueindex = valueindex;

    /**
     * An object used to lookup the combined values of all nodes in a subtree.
     */
    this.treevalueindex = treevalueindex;

    /**
     * An object used to lookup nodes relative to other nodes along a specified
     * axis. Typically in document order.
     */
    this.nodeindex = nodeindex;
}

exports.Document = Document;
