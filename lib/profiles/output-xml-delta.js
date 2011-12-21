var xmlpayload = require('../delta/xmlpayload');
var deltamod = require('../delta/delta');
var domdelta = require('../delta/domdelta');

/**
 * Return shared payload handler.
 */
exports.payloadHandler = new xmlpayload.XMLPayloadHandler();


exports.createEmptyDocument = function(matching) {
    return {
        'type': 'xml',
        'data': exports.payloadHandler.createDocument(),
        'delta': new deltamod.Delta(),
        'matching': matching
    };
}

exports.populateDocument = function(deltadoc, fragAdapter) {
    var deltaAdapter = new domdelta.DOMDeltaAdapter(fragAdapter);
    deltaAdapter.populateDocument(deltadoc.data, deltadoc.delta);
}


exports.createDeltaCollector = function(doc, matching, equals) {
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
    collector = new deltamod.DeltaCollector(matching, root, partner);

    if (equals) {
        collector.equals = equals;
    }

    return collector;
}

exports.createContextGenerator = function(doc) {
    var contextgen, index;

    if (!doc.tree) {
        throw new Error('Parameter error: Document objects must have a tree property');
    }
    if (!doc.valueindex) {
        throw new Error('Parameter error: Document objects must have a valueindex property');
    }
    if (!doc.nodeindex) {
        doc.nodeindex = tree.DocumentOrderIndex(doc.tree);
        doc.nodeindex.buildAll();
    }

    contextgen = new deltamod.ContextGenerator(4, doc.nodeindex, doc.valueindex);

    return contextgen;
}
