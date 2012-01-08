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
        'entries': [],  // array of objects with the properties operation,
                        // anchor and handler.
        'src': '',
        'matching': matching
    };
};


/**
 * Return a delta document loaded from the given string or DOMDocument.
 */
exports.loadDocument = function(domdoc, fragAdapter, name) {
    var src, operations, entries = [], i,
        deltaAdapter = new domdelta.DOMDeltaAdapter(fragAdapter);

    if (typeof domdoc === 'string') {
        src = domdoc;
        domdoc = exports.payloadHandler.parseString(domdoc);
    }

    operations = deltaAdapter.adaptDocument(domdoc);
    for (i = 0; i < operations.length; i++) {
        entries.push({'operation': operations[i]});
    }

    return {
        'type': 'xml',
        'name': name,
        'data': domdoc,
        'entries': entries,
        'src': src,
        'matching': undefined
    };
};


/**
 * Return an initialized collector instance.
 */
exports.createCollector = function(deltadoc, doc, equals) {
    var collector, root, partner;

    if (!doc.tree) {
        throw new Error('Parameter error: Document objects must have a tree property');
    }
    if (!doc.valueindex) {
        throw new Error('Parameter error: Document objects must have a valueindex property');
    }

    root = doc.tree;
    partner = deltadoc.matching.get(root);
    if (!partner) {
        throw new Error('Parameter error: Matching does not contain tree root');
    }

    collector = new deltamod.DeltaCollector(deltadoc.matching, root, partner);

    if (equals) {
        collector.equals = equals;
    }

    return collector;
}


/**
 * Return an initialized operation factory instance.
 */
exports.createOperationFactory = function(doc) {
    var contextgen = new deltamod.ContextGenerator(4, doc.nodeindex, doc.valueindex);
    return new deltamod.OperationFactory(contextgen);
}


/**
 * Populate the data property.
 */
exports.populateDocument = function(deltadoc, fragAdapter) {
    var operations = [], i,
        deltaAdapter = new domdelta.DOMDeltaAdapter(fragAdapter);

    for (i = 0; i < deltadoc.entries.length; i++) {
        operations.push(deltadoc.entries[i].operation);
    }
    deltaAdapter.populateDocument(deltadoc.data, operations);

    return deltadoc.data;
};


/**
 * Serialize the data property into the src string and return it.
 */
exports.serializeDocument = function(deltadoc) {
    deltadoc.src = exports.payloadHandler.serializeToString(deltadoc.data);

    return deltadoc.src;
};
