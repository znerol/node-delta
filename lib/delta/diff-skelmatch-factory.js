/**
 * @fileoverview This module contains the factory class necessary to
 * instantiate the skelmatch algorithm class.
 */


/** @ignore */
var tree = require('./tree');
/** @ignore */
var skelmatch = require('./skelmatch');


/**
 * Create a new instance of the skelmatch diff factory.
 * @constructor
 */
function DiffSkelmatchFactory() {
}


/**
 * Return new initialized instance of Skel-Match diff algorithm.
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
 * @return {skelmatch.Diff} An initialized skelmatch.Diff instance.
 */
DiffSkelmatchFactory.prototype.createDiffAlgorithm = function(doc1, doc2, equals) {
    var diff;

    if (!doc1.tree || !doc2.tree) {
        throw new Error('Parameter error: Document objects must have tree property');
    }

    diff = new skelmatch.Diff(doc1.tree, doc2.tree);

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
DiffSkelmatchFactory.prototype.createMatching = function() {
    return new tree.Matching();
}


exports.DiffSkelmatchFactory = DiffSkelmatchFactory;
