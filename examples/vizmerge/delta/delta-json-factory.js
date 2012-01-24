define(["require", "exports", "module", "../delta/jsonpayload","../delta/delta","../delta/contextdelta","../delta/jsondelta"], function(require, exports, module) {
/**
 * @fileoverview This module contains a factory class for the JSON patch format.
 */

/** @ignore */
var jsonpayload = require('../delta/jsonpayload');
/** @ignore */
var deltamod = require('../delta/delta');
/** @ignore */
var contextdelta= require('../delta/contextdelta');
/** @ignore */
var jsondelta = require('../delta/jsondelta');


/**
 * Return shared payload handler.
 */
var payloadHandler = new jsonpayload.JSONPayloadHandler();


/**
 * Create a new instance of the factory class supporting the JSON patch file
 * format.
 *
 * **FIXME: This class is just a copy-paste + search-replace from
 * DeltaXMLFactory and will most likely not work out of the box.**
 *
 * @constructor
 */
function DeltaJSONFactory() {
}


/**
 * Return a new empty delta document.
 *
 * @param {tree.Matching} [matching] A matching produced by some tree diff algorithm.
 *
 * @return {Object} A delta document initialized with default values.
 */
DeltaJSONFactory.prototype.createEmptyDocument = function(matching) {
    return {
        'type': 'json',
        'name': 'untitled-diff.json',
        'data': payloadHandler.createDocument(),
        'attached': [],   // Array of attached operations
        'detached': [],   // Array of detached operations
        'src': '',
        'matching': matching
    };
};


/**
 * Return a delta document loaded from the given string or JavaScript object.
 *
 * @param {String|Document} jsondoc  A document containing delta operations.
 * @param {Object} fragAdapter      A document fragemnt adapter. Use the object
 *         produced by createFragmentAdapter method from a document factory.
 * @param {String}          [name]  The file name of the document.
 *
 * @return {Object} A delta document initialized with default values.
 */
DeltaJSONFactory.prototype.loadDocument = function(jsondoc, fragAdapter, name) {
    var src, operations, entries = [], i,
        deltaAdapter = new jsondelta.JSONDeltaAdapter(fragAdapter);

    if (typeof jsondoc === 'string') {
        src = jsondoc;
        jsondoc = payloadHandler.parseString(jsondoc);
    }

    return {
        'type': 'json',
        'name': name,
        'data': jsondoc,
        'attached': [],
        'detached': deltaAdapter.adaptDocument(jsondoc),
        'src': src,
        'matching': undefined
    };
};


/**
 * Return an initialized collector instance.
 *
 * @param {Object} deltadoc      The delta document produced by createEmptyDocument
 *         or loadDocument.
 * @param {Object} doc           The document as created by the
 *         loadOriginalDocument method of the document factory class.
 * @param {functio} [equals]    The equality test-function used during diffing.
 *
 * @return {delta.DeltaCollector} An initialized collector instance.
 */
DeltaJSONFactory.prototype.createCollector = function(deltadoc, doc, equals) {
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
 *
 * @param {Object} doc           The document as created by the
 *         loadOriginalDocument method of the document factory class.
 *
 * @return {contextdelta.Detacher} Initialized detacher instance.
 */
DeltaJSONFactory.prototype.createDetacher = function(doc) {
    var contextgen = new contextdelta.ContextGenerator(4, doc.nodeindex, doc.valueindex);
    return new contextdelta.Detacher(contextgen);
}


/**
 * Return an initialized context delta attacher instance
 *
 * @param {Object} resolver An instance of ContextResolver. Use the output of
 *         createResolver method from the resolver factory.
 *
 * @return {delta.Attacher} Initialized attacher instance.
 */
DeltaJSONFactory.prototype.createAttacher = function(resolver) {
    return new deltamod.Attacher(resolver);
}


/**
 * Return an initialized delta adapter instance.
 *
 * @param {Object} fragAdapter      A document fragemnt adapter. Use the object
 *         produced by createFragmentAdapter method from a document factory.
 *
 * @return {jsondelta.JSONDeltaAdapter} Initialized instance of the proper delta
 *         adapter.
 */
DeltaJSONFactory.prototype.createDeltaAdapter = function(fragAdapter) {
    return new jsondelta.JSONDeltaAdapter(fragAdapter);
}


/**
 * Serialize the data property into the src string and return it. Also store
 * the source into the ``src`` property of ``deltadoc``.
 *
 * @param {Object} deltadoc A populated delta document.
 *
 * @return {String} The JSON representation of the delta document as a string.
 */
DeltaJSONFactory.prototype.serializeDocument = function(deltadoc) {
    deltadoc.src = payloadHandler.serializeToString(deltadoc.data);

    return deltadoc.src;
};

exports.DeltaJSONFactory = DeltaJSONFactory;

});
