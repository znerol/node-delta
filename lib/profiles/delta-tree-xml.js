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
};


/**
 * Return a delta document loaded from the given string or DOMDocument.
 */
exports.loadDocument = function(domdoc, name, fragAdapter) {
    var src, deltaAdapter = new domdelta.DOMDeltaAdapter(fragAdapter);

    if (typeof domdoc === 'string') {
        src = domdoc;
        domdoc = exports.payloadHandler.parseString(domdoc);
    }

    return {
        'type': 'xml',
        'name': name,
        'data': domdoc,
        'delta': deltaAdapter.adaptDocument(domdoc),
        'src': src,
        'matching': undefined
    };
};


/**
 * Given an input document, a matching and an equality tester, collect all
 * changes and record them into the delta property of the deltadoc.
 */
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
};


/**
 * Populate the data property.
 */
exports.populateDocument = function(deltadoc, fragAdapter) {
    var deltaAdapter = new domdelta.DOMDeltaAdapter(fragAdapter);
    deltaAdapter.populateDocument(deltadoc.data, deltadoc.delta);

    return deltadoc.data;
};


/**
 * Serialize the data property into the src string and return it.
 */
exports.serializeDocument = function(deltadoc) {
    deltadoc.src = exports.payloadHandler.serializeToString(deltadoc.data);

    return deltadoc.src;
};
