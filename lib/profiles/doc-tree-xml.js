var xmlpayload = require('../delta/xmlpayload');
var fnv132 = require('../delta/fnv132');
var tree = require('../delta/tree');
var domtree = require('../delta/domtree');
var domdelta = require('../delta/domdelta');


/**
 * Return shared payload handler.
 */
exports.payloadHandler = new xmlpayload.XMLPayloadHandler();


/**
 * Return shared tree adapter.
 */
exports.treeAdapter = new domtree.DOMTreeAdapter();


/**
 * Return a new empty delta document.
 */
exports.createEmptyDocument = function() {
    var valueindex, treevalueindex;

    valueindex = new tree.NodeHashIndex(new domtree.DOMNodeHash(fnv132.Hash));
    treevalueindex = new tree.TreeHashIndex(
            new tree.SimpleTreeHash(fnv132.Hash, valueindex));

    if (typeof domdoc === 'string') {
        src = domdoc;
        domdoc = exports.payloadHandler.parseString(domdoc);
    }

    return {
        'type': 'xml',
        'name': 'untitled.xml',
        'data': exports.payloadHandler.createDocument(),
        'tree': undefined,
        'src': '',
        'valueindex': valueindex,
        'treevalueindex': treevalueindex
    };
};


/**
 * Return new document objects suitable for supplying to diff.Diff
 */
exports.loadInputDocument = function(domdoc, name) {
    var src, result, valueindex, treevalueindex;

    valueindex = new tree.NodeHashIndex(new domtree.DOMNodeHash(fnv132.Hash));
    treevalueindex = new tree.TreeHashIndex(
            new tree.SimpleTreeHash(fnv132.Hash, valueindex));

    if (typeof domdoc === 'string') {
        src = domdoc;
        domdoc = exports.payloadHandler.parseString(domdoc);
    }

    result = {
        'type': 'xml',
        'name': name,
        'data': domdoc,
        'tree': exports.treeAdapter.adaptDocument(domdoc),
        'src': src,
        'valueindex': valueindex,
        'treevalueindex': treevalueindex
    };

    return result;
}


/**
 * Return new document objects suitable for supplying to diff.Diff as the
 * original (unchanged) document.
 */
exports.loadOriginalDocument = function(domdoc, name) {
    var result = exports.loadInputDocument(domdoc, name);

    var nodeindex = new tree.DocumentOrderIndex(result.tree);
    nodeindex.buildAll();
    result.nodeindex = nodeindex;

    return result;
}


/**
 * Return the proper document fragemnt adapter for the given deltadoc.
 */
exports.createFragmentAdapter = function(type) {
    if (type === 'xml') {
        return new xmlpayload.XMLFragmentAdapter(exports.treeAdapter);
    }
    else {
        return new xmlpayload.SerializedXMLFragmentAdapter(exports.treeAdapter);
    }
}


/**
 * Return the proper node equality test.
 */
exports.createNodeEqualityTest = function(doc1, doc2) {
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
 */
exports.createTreeEqualityTest = function(doc1, doc2) {
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
 */
exports.createValueTest = function(doc) {
    if (!doc.valueindex) {
        throw new Error('Parameter error: Document objects must have valueindex property');
    }

    // Use value index for node-comparison
    return function(a, b) {
        return doc.valueindex.get(a) === b;
    }
};


/**
 * Returns delta operation handler factory
 */
exports.createHandlerFactory = function() {
    return new domdelta.DOMOperationHandlerFactory();
}

/**
 * Serialize the data property into the src string and return it.
 */
exports.serializeDocument = function(doc) {
    doc.src = exports.payloadHandler.serializeToString(doc.data);

    return doc.src;
};
