define(["require", "exports", "module", "./xmlpayload","./fnv132","./tree","./domtree","./domhandler","./doc"], function(require, exports, module) {
/**
 * @fileoverview This module provides the factory class for XML documents
 */


/** @ignore */
var xmlpayload = require('./xmlpayload');
/** @ignore */
var fnv132 = require('./fnv132');
/** @ignore */
var tree = require('./tree');
/** @ignore */
var domtree = require('./domtree');
/** @ignore */
var domhandler = require('./domhandler');
/** @ignore */
var docmod = require('./doc');

/** Shared payload handler instance */
var payloadHandler = new xmlpayload.XMLPayloadHandler();

/** shared tree adapter instance */
var treeAdapter = new domtree.DOMTreeAdapter();

/**
 * Create a new instance of the XML document factory class.
 * @constructor
 */
function DocumentXMLFactory() {
}


/**
 * Return a new empty document.
 *
 * @return {Object} A document initialized with default values.
 */
DocumentXMLFactory.prototype.createEmptyDocument = function() {
    return new docmod.Document('xml', 'untitled.xml',
        payloadHandler.createDocument(),
        undefined,
        '',
        undefined,
        undefined,
        undefined
    );
};


/**
 * Return new document loaded from a DOMDocument.
 *
 * @param {String|Document} domdoc  The underlying DOMDocument.
 * @param {String}          [name]  The file name of the document.
 *
 * @return {Object} A document initialized from the given DOMDocument.
 */
DocumentXMLFactory.prototype.loadInputDocument = function(domdoc, name) {
    var src, result, valueindex, treevalueindex;

    valueindex = new tree.NodeHashIndex(new domtree.DOMNodeHash(fnv132.Hash));
    treevalueindex = new tree.TreeHashIndex(
            new tree.SimpleTreeHash(fnv132.Hash, valueindex));

    if (typeof domdoc === 'string') {
        src = domdoc;
        domdoc = payloadHandler.parseString(domdoc);
    }

    return new docmod.Document('xml', name,
        domdoc,
        treeAdapter.adaptDocument(domdoc),
        src,
        valueindex,
        treevalueindex,
        undefined
    );
}


/**
 * Return new document loaded from a DOMDocument. Use this method for loading
 * the original (unchanged) document and supply it as doc1 to diff.Diff or
 * patch.Patch.
 *
 * @param {String|Document} domdoc  The underlying DOMDocument.
 * @param {String}          [name]  The file name of the document.
 *
 * @return {Object} A document initialized from the given DOMDocument.
 */
DocumentXMLFactory.prototype.loadOriginalDocument = function(domdoc, name) {
    var result = DocumentXMLFactory.prototype.loadInputDocument(domdoc, name);

    var nodeindex = new tree.DocumentOrderIndex(result.tree);
    nodeindex.buildAll();
    result.nodeindex = nodeindex;

    return result;
}


/**
 * Return the proper document fragment adapter for the given deltadoc type.
 *
 * @param {String} type The document type of the delta document this adapter
 *         should be used for.
 *
 * @return {FragmentAdapter} A suitable fragment adapter for the given type.
 */
DocumentXMLFactory.prototype.createFragmentAdapter = function(type) {
    if (type === 'xml') {
        return new xmlpayload.XMLFragmentAdapter(treeAdapter);
    }
    else {
        return new xmlpayload.SerializedXMLFragmentAdapter(treeAdapter);
    }
}


/**
 * Return the proper node equality test function.
 *
 * @param {object} doc1 The original document
 * @param {object} doc2 The changed document
 *
 * @return {function} node equality test function.
 */
DocumentXMLFactory.prototype.createNodeEqualityTest = function(doc1, doc2) {
    if (!doc1.valueindex || !doc2.valueindex) {
        throw new Error('Parameter error: Document objects must have valueindex property');
    }

    // Use value index for node-comparison
    return function(a, b) {
        return doc1.valueindex.get(a) === doc2.valueindex.get(b);
    }
}


/**
 * Return the proper subtree equality test.
 *
 * @param {object} doc1 The original document
 * @param {object} doc2 The changed document
 *
 * @return {function} node equality test function.
 */
DocumentXMLFactory.prototype.createTreeEqualityTest = function(doc1, doc2) {
    if (!doc1.treevalueindex || !doc2.treevalueindex) {
        throw new Error('Parameter error: Document objects must have treevalueindex property');
    }

    // Use value index for node-comparison
    return function(a, b) {
        return doc1.treevalueindex.get(a) === doc2.treevalueindex.get(b);
    }
}


/**
 * Return proper value checker.
 *
 * @param {object} doc The original document
 *
 * @return {function} value comparison function.
 */
DocumentXMLFactory.prototype.createValueTest = function(doc) {
    if (!doc.valueindex) {
        throw new Error('Parameter error: Document objects must have valueindex property');
    }

    // Use value index for node-comparison
    return function(a, b) {
        return doc.valueindex.get(a) === b;
    }
};


/**
 * Returns delta operation handler factory.
 *
 * @return {object} Instance of the handler factory class suitable for XML
 *         documents.
 */
DocumentXMLFactory.prototype.createHandlerFactory = function() {
    return new domhandler.DOMOperationHandlerFactory();
}


/**
 * Serialize the data property into the src string and return it. Also store
 * the source into the ``src`` property of ``deltadoc``.
 *
 * @param {Object} deltadoc A populated delta document.
 *
 * @return {String} The XML representation of the delta document as a string.
 */
DocumentXMLFactory.prototype.serializeDocument = function(doc) {
    doc.src = payloadHandler.serializeToString(doc.data);

    return doc.src;
};


exports.DocumentXMLFactory = DocumentXMLFactory;

});
