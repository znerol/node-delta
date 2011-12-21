var xmlpayload = require('../delta/xmlpayload');
var fnv132 = require('../delta/fnv132');
var tree = require('../delta/tree');
var domtree = require('../delta/domtree');

exports.createPayloadHandler = function() {
    return new xmlpayload.XMLPayloadHandler();
}

exports.createTreeAdapter = function() {
    return new domtree.DOMTreeAdapter();
}

exports.createValueIndex = function() {
    return new tree.NodeHashIndex(new domtree.DOMNodeHash(fnv132.Hash));
}
