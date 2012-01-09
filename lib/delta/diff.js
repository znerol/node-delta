/**
 * @fileoverview High-Lever interface for diffing process
 */

/**
 * Create a new instance of a patch command based on the given factory objects.
 *
 * @param {Object} diffFactory      A reference to a diff algorithm profile.
 * @param {Object} docFactory       A reference to a document profile.
 * @param {Object} deltaFactory     A reference to a delta profile.
 *
 * Usage example:
 *
 * .. code-block:: javascript
 * 
 *      var diffProfile = require('./lib/profiles/algo-diff-skelmatch');
 *      var docProfile = require('./lib/profiles/doc-tree-xml');
 *      var deltaProfile = require('./lib/profiles/delta-tree-xml');
 *      var diff = require('./lib/delta/diff');
 *      
 *      var d = new diff.Diff(diffProfile, docProfile, deltaProfile);
 *
 *      var orig = docProfile.loadOriginalDocument(original_content);
 *      var changed = docProfile.loadInputDocument(changed_content);
 *
 *      var delta = d.diff(orig, changed);
 *
 *      var result = deltaProfile.serializeDocument(delta);
 *
 * @constructor
 * @creator
 * @name diff.Diff
 */
function Diff(diffFactory, docFactory, deltaFactory) {
    this.diffFactory = diffFactory;
    this.docFactory = docFactory;
    this.deltaFactory = deltaFactory;
}

/**
 * Return the delta object after computing and collecting the diff between
 * doc1 and doc2.
 *
 * @param {Object} doc1     Original document. An instance returned by document
 *                          profile loadOriginalDocument method.
 * @param {Object} doc2     Changed document. An instance returned by document
 *                          profile loadInputDocument method.
 * @return {Object} Delta document.
 * @memberOf diff.Diff
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
 * Construct delta document.
 *
 * @param {Object} doc1     Original document. An instance returned by document
 *                          profile loadOriginalDocument method.
 * @param {Object} doc2     Changed document. An instance returned by document
 *                          profile loadInputDocument method.
 * @param {Object} matching The matching produced by the choosen diff
 *                          algorithm.
 * @return {Object} Delta document.
 *
 * @memberOf diff.Diff
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
 *
 * @param {Object} deltadoc The delta document produced by diff.Diff.collect.
 * @param {Object} doc      Original document. An instance returned by document
 *                          profile loadInputDocument method.
 * @return {Object} The file-format specific representation of the delta
 *                  document (e.g. the DOM document).
 *
 * @memberOf diff.Diff
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
