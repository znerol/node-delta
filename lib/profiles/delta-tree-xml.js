var xmlpayload = require('../delta/xmlpayload');
var deltamod = require('../delta/delta');
var contextdelta= require('../delta/contextdelta');
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
        'attached': [],   // Array of attached operations
        'detached': [],   // Array of detached operations
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

    return {
        'type': 'xml',
        'name': name,
        'data': domdoc,
        'attached': [],
        'detached': deltaAdapter.adaptDocument(domdoc),
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
 * Return an initialized context delta detacher instance.
 */
exports.createDetacher = function(doc) {
    var contextgen = new contextdelta.ContextGenerator(4, doc.nodeindex, doc.valueindex);
    return new contextdelta.Detacher(contextgen);
}


/**
 * Return an initialized context delta attacher instance
 */
exports.createAttacher = function(resolver) {
    return new contextdelta.Attacher(resolver);
}


/**
 * Return an initialized delta adapter instance.
 */
exports.createDeltaAdapter = function(fragadapter) {
    return new domdelta.DOMDeltaAdapter(fragadapter);
}


/**
 * Serialize the data property into the src string and return it.
 */
exports.serializeDocument = function(deltadoc) {
    deltadoc.src = exports.payloadHandler.serializeToString(deltadoc.data);

    return deltadoc.src;
};
