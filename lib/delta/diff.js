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
 * Return a partial matching between the given documents.
 */
Diff.prototype.match = function(doc1, doc2) {
    var matching;
    var diff = this.diffFactory.createDiffAlgorithm(doc1, doc2);
    var equals = this.docFactory && this.docFactory.createNodeEqualityTest(
            doc1, doc2);
    if (equals) {
        diff.equals = equals;
    }

    matching = this.diffFactory.createMatching();

    diff.matchTrees(matching);

    return matching;
}

/**
 * Construct a delta object using the given matching and document.
 */
Diff.prototype.delta = function(doc1, doc2, matching) {
    var delta = this.deltaFactory.createDelta();
    var collector = this.deltaFactory.createDeltaCollector(doc1, matching);
    var contextgen = this.deltaFactory.createContextGenerator(doc1);
    var equals = this.docFactory && this.docFactory.createNodeEqualityTest(
            doc1, doc2);

    if (equals) {
        collector.equals = equals;
    }
    
    delta.collect2(collector, contextgen);

    return delta;
}

/**
 * Return the delta object after computing and collecting the diff between
 * doc1 and doc2.
 */
Diff.prototype.diff = function(doc1, doc2) {
    var matching = this.match(doc1, doc2);
    return this.delta(doc1, doc2, matching);
}

exports.Diff = Diff;
