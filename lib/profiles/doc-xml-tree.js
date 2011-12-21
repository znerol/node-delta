var xmlpayload = require('../delta/xmlpayload');
var fnv132 = require('../delta/fnv132');
var tree = require('../delta/tree');
var domtree = require('../delta/domtree');


/**
 * Return shared payload handler.
 */
exports.payloadHandler = new xmlpayload.XMLPayloadHandler();


/**
 * Return shared tree adapter.
 */
exports.treeAdapter = new domtree.DOMTreeAdapter();


/**
 * Return new document objects suitable for supplying to diff.Diff
 */
exports.createInputDocument = function(domdoc, name) {
    var result = {
        'data': domdoc,
        'name': name,
        'tree': exports.treeAdapter.adaptDocument(domdoc)
    };
    result.valueindex = new tree.NodeHashIndex(
            new domtree.DOMNodeHash(fnv132.Hash));

    return result;
}


/**
 * Return new document objects suitable for supplying to diff.Diff as the
 * original (unchanged) document.
 */
exports.createOriginalDocument = function(domdoc, name) {
    var result = exports.createInputDocument(domdoc, name);
    var nodeindex = new tree.DocumentOrderIndex(result.tree);
    nodeindex.buildAll();
    result.nodeindex = nodeindex;

    return result;
}


exports.createTreeFragmentAdapter = function(domdoc, type) {
    if (type === 'xml') {
        return new xmlpayload.XMLFragmentAdapter(domdoc, exports.treeAdapter);
    }
    else {
        return new xmlpayload.SerializedXMLFragmentAdapter(domdoc, exports.treeAdapter);
    }
}


exports.createNodeEqualityTest = function(doc1, doc2) {
    if (!doc1.valueindex || !doc2.valueindex) {
        throw new Error('Parameter error: Document objects must have valueindex property');
    }

    // Use value index for node-comparison
    return function(a, b) {
        return doc1.valueindex.get(a) === doc2.valueindex.get(b);
    }
}
