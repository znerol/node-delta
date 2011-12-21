var tree = require('../delta/tree');
var bonematch = require('../delta/bonematch');

/**
 * Return new initialized instance of XCC diff algorithm.
 */
exports.createDiffAlgorithm = function(doc1, doc2) {
    var diff;

    if (!doc1.tree || !doc2.tree) {
        throw new Error('Parameter error: Document objects must have tree property');
    }

    return new bonematch.Diff(doc1.tree, doc2.tree);
}

/**
 * Return new tree matching object
 */
exports.createMatching = function() {
    return new tree.Matching();
}
