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
        equals = this.docFactory.createNodeEqualityTest(doc1, doc2),
        diff = this.diffFactory.createDiffAlgorithm(doc1, doc2, equals),
        deltadoc;

    // diff
    diff.matchTrees(matching);

    // Construct and return delta
    return this.constructDelta(doc1, doc2, matching);
}


/**
 * Construct delta document
 */
Diff.prototype.constructDelta = function(doc1, doc2, matching) {
    var deltadoc = this.deltaFactory.createEmptyDocument(matching),
        fragadapter = this.docFactory.createFragmentAdapter(deltadoc.type),
        equals = this.docFactory.createNodeEqualityTest(doc1, doc2),
        collector;

    collector = this.deltaFactory.createCollector(deltadoc, doc1, equals);
    operationfactory = this.deltaFactory.createOperationFactory(doc1);

    // Collect changes and create operations in delta document
    collector.forEachChange(function(res, type, path, remove, insert) {
        var op = operationfactory.createOperation(res.anchor, type, path,
            remove, insert);
        deltadoc.entries.push({'operation': op, 'anchor': res.anchor});
    });

    // Populate DOM of delta document
    this.deltaFactory.populateDocument(deltadoc, fragadapter);

    return deltadoc;
};

exports.Diff = Diff;
