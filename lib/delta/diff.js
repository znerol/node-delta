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
        deltadoc = this.deltaFactory.createEmptyDocument(matching),
        fragadapter = this.docFactory.createFragmentAdapter(deltadoc),
        equals = this.docFactory.createNodeEqualityTest(doc1, doc2),
        diff, collector, contextgen;

    // diff
    diff = this.diffFactory.createDiffAlgorithm(doc1, doc2, equals);
    diff.matchTrees(matching);

    // collect operations
    collector = this.deltaFactory.createDeltaCollector(doc1, matching, equals);
    contextgen = this.deltaFactory.createContextGenerator(doc1);
    deltadoc.delta.collect2(collector, contextgen);

    // populate document
    this.deltaFactory.populateDocument(deltadoc, fragadapter);

    return deltadoc;
}

exports.Diff = Diff;
