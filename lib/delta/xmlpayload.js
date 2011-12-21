/**
 * @file:   Payload handler for XML/DOM documents
 * @module  xmlpayload
 */

/** @ignore */
var xmlshim = require('xmlshim');


/**
 * @constructor
 */
function XMLPayloadHandler() {
}

XMLPayloadHandler.prototype.serializeToString = function(doc) {
    return (new xmlshim.XMLSerializer).serializeToString(doc);
};

XMLPayloadHandler.prototype.parseString = function(string) {
    return (new xmlshim.DOMParser).parseFromString(string, 'text/xml');
};

XMLPayloadHandler.prototype.createDocument = function() {
    return xmlshim.implementation.createDocument('', '', null);
};

XMLPayloadHandler.prototype.createTreeFragmentAdapter = function(docadapter, type) {
    if (type === 'xml') {
        return new exports.XMLFragmentAdapter(docadapter);
    }
    else {
        return new exports.SerializedXMLFragmentAdapter(docadapter);
    }
};


/**
 * @constructor
 */
function XMLFragmentAdapter(docadapter) {
    this.docadapter = docadapter;
}

XMLFragmentAdapter.prototype.adapt = function(doc, nodes, deep) {
    var i, result = doc.createDocumentFragment();

    for (i = 0; i < nodes.length; i++) {
        result.appendChild(doc.importNode(nodes[i].data, deep));
    }

    return result;
};


XMLFragmentAdapter.prototype.importFragment = function(domnodes, deep) {
    var result = [], node, i;

    for (i=0; i<domnodes.length; i++) {
        node = this.docadapter.adaptElement(domnodes[i]);
        if (node) {
            result.push(node);
        }
    }

    return result;
};


/**
 * @constructor
 */
function SerializedXMLFragmentAdapter(docadapter) {
    XMLFragmentAdapter.call(this, docadapter);
}

SerializedXMLFragmentAdapter.prototype.adapt = function(doc, nodes, deep) {
    mydoc = xmlshim.implementation.createDocument('', '', null);

    var frag = XMLFragmentAdapter.prototype.adapt.call(this, mydoc, nodes, deep);
    var root = mydoc.createElement('values');

    root.appendChild(frag);
    mydoc.appendChild(root);

    return (new xmlshim.XMLSerializer).serializeToString(mydoc);
};

exports.XMLPayloadHandler = XMLPayloadHandler;
exports.XMLFragmentAdapter = XMLFragmentAdapter;
exports.SerializedXMLFragmentAdapter = SerializedXMLFragmentAdapter;
