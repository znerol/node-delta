/**
 * @fileoverview    Abstract diff implementation
 */

/**
 * @creator
 */
function Diff(diffFactory, docFactory, deltaFactory) {
    this.diffFactory = diffFactory;
    this.docFactory = docFactory;
    this.deltaFactory = deltaFactory;
}

/**
 * Return the delta object after computing and collecting the diff between
 * doc1 and doc2.
 */
Diff.prototype.diff = function(doc1, doc2) {
    var matching = this.diffFactory.createMatching(),
        deltadoc = this.deltaFactory.createEmptyDocument(),
        fragadapter = this.docFactory.createFragmentAdapter(deltadoc.type),
        equals = this.docFactory.createNodeEqualityTest(doc1, doc2),
        diff = this.diffFactory.createDiffAlgorithm(doc1, doc2, equals);

    // diff
    diff.matchTrees(matching);

    // collect operations
    this.deltaFactory.collectDelta(deltadoc, doc1, matching, equals);

    // populate document
    this.deltaFactory.populateDocument(deltadoc, fragadapter);

    return deltadoc;
}

exports.Diff = Diff;
