/**
 * @fileoverview This module contains the factory class necessary to
 * instantiate the xcc algorithm class.
 */


/** @ignore */
var tree = require('../delta/tree');
/** @ignore */
var xcc = require('../delta/xcc');


/**
 * Return new instance of XCC diff factory class.
 *
 * @param {Object} [options] Options which will be passed to the xcc algorithm
 *         upon instantiation.
 *
 * @constructor
 */
function DiffXCCFactory(options) {
    this.options = options;
}


/**
 * Return new initialized instance of XCC diff algorithm.
 *
 * @param {Object} doc1         The original document. Use
 *         ``loadOriginalDocument`` of the document factory to load a suitable
 *         document.
 * @param {Object} doc2         The changed document. Use ``loadInputDocument``
 *         of the document factory to load a suitable document.
 * @param {function} [equals]   The equality test-function used during diffing.
 *         Use the method ``createNodeEqualityTest`` of the document factory to
 *         create a suitable equality test function.
 *
 * @return {xcc.Diff} An initialized xcc.Diff instance.
 */
DiffXCCFactory.prototype.createDiffAlgorithm = function(doc1, doc2, equals) {
    var diff;

    if (!doc1.tree || !doc2.tree) {
        throw new Error('Parameter error: Document objects must have tree property');
    }

    diff = new xcc.Diff(doc1.tree, doc2.tree, this.options);

    if (equals) {
        diff.equals = equals;
    }

    return diff;
}


/**
 * Return new tree matching object
 *
 * @return {tree.Matching} Empty matching object.
 */
DiffXCCFactory.prototype.createMatching = function() {
    return new tree.Matching();
}

exports.DiffXCCFactory = DiffXCCFactory;
