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
        diff = this.diffFactory.createDiffAlgorithm(doc1, doc2, equals);

    // diff
    diff.matchTrees(matching);

    // Collect changes
    deltadoc = this.collect(doc1, doc2, matching);

    // Populate document
    this.populate(deltadoc, doc1);

    return deltadoc;
}


/**
 * Construct delta document
 */
Diff.prototype.collect = function(doc1, doc2, matching) {
    var deltadoc = this.deltaFactory.createEmptyDocument(matching),
        equals = this.docFactory.createNodeEqualityTest(doc1, doc2),
        collector;

    collector = this.deltaFactory.createCollector(deltadoc, doc1, equals);

    // Collect changes and create operations in delta document
    collector.forEachChange(function(attached) {
        deltadoc.attached.push(attached);
    });

    return deltadoc;
};


/**
 * Populate delta document with detached operations
 */
Diff.prototype.populate = function(deltadoc, doc) {
    var i, detacher = this.deltaFactory.createDetacher(doc),
        fragadapter = this.docFactory.createFragmentAdapter(deltadoc.type),
        deltaadapter = this.deltaFactory.createDeltaAdapter(fragadapter);

    // Detach operations
    for (i = 0; i < deltadoc.attached.length; i++) {
        deltadoc.detached[i] = detacher.detach(deltadoc.attached[i]);
    }

    // Populate DOM of delta document
    deltaadapter.populateDocument(deltadoc.data, deltadoc.detached);

    return deltadoc.data;
}

exports.Diff = Diff;
