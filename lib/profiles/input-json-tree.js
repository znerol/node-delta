var jsonpayload = require('../delta/jsonpayload');
var fnv132 = require('../delta/fnv132');
var tree = require('../delta/tree');
var jsobjecttree = require('../delta/jsobjecttree');

exports.createPayloadHandler = function() {
    return new jsonpayload.JSONPayloadHandler();
}

exports.createTreeAdapter = function() {
    return new jsobjecttree.JSObjectTreeAdapter();
}

exports.createValueIndex = function() {
    // no index
}
