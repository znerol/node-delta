var xmlpayload = require('../delta/xmlpayload');
var deltamod = require('../delta/delta');
var domdelta = require('../delta/domdelta');

/**
 * Return shared payload handler.
 */
exports.payloadHandler = new xmlpayload.XMLPayloadHandler();


/**
 * Return a new empty delta document.
 */
exports.createEmptyDocument = function(matching) {
    return {
        'type': 'xml',
        'name': 'untitled-diff.xml',
        'data': exports.payloadHandler.createDocument(),
        'delta': new deltamod.Delta(),
        'src': '',
        'matching': matching
    };
}


/**
 * Populate 
 */
exports.populateDocument = function(deltadoc, fragAdapter) {
    var deltaAdapter = new domdelta.DOMDeltaAdapter(fragAdapter);
    deltaAdapter.populateDocument(deltadoc.data, deltadoc.delta);

    return deltadoc.data;
}


exports.serializeDocument = function(deltadoc) {
    deltadoc.src = exports.payloadHandler.serializeToString(deltadoc.data);

    return deltadoc.src;
}



exports.collectDelta = function(deltadoc, doc, matching, equals) {
    var collector, root, partner;

    if (!doc.tree) {
        throw new Error('Parameter error: Document objects must have a tree property');
    }
    if (!doc.valueindex) {
        throw new Error('Parameter error: Document objects must have a valueindex property');
    }

    root = doc.tree;
    partner = matching.get(root);
    if (!partner) {
        throw new Error('Parameter error: Matching does not contain tree root');
    }

    if (!doc.nodeindex) {
        doc.nodeindex = tree.DocumentOrderIndex(doc.tree);
        doc.nodeindex.buildAll();
    }

    deltadoc.matching = matching;
    collector = new deltamod.DeltaCollector(matching, root, partner);
    contextgen = new deltamod.ContextGenerator(4, doc.nodeindex, doc.valueindex);

    if (equals) {
        collector.equals = equals;
    }

    deltadoc.delta.collect2(collector, contextgen);

    return deltadoc.delta;
}
