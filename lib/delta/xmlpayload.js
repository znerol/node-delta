/**
 * @file:   Payload handler for XML/DOM documents
 */

var xmlshim = require('xmlshim');

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

XMLPayloadHandler.prototype.createTreeFragmentAdapter = function(doc, docadapter, type) {
    if (type === 'xml') {
        return new exports.XMLFragmentAdapter(doc, docadapter);
    }
    else {
        return new exports.SerializedXMLFragmentAdapter(doc, docadapter);
    }
};


function XMLFragmentAdapter(doc, docadapter) {
    this.doc = doc;
    this.docadapter = docadapter;
}

XMLFragmentAdapter.prototype.adapt = function(nodes, deep) {
    var result = this.doc.createDocumentFragment(),
        i;

    for (i = 0; i < nodes.length; i++) {
        result.appendChild(this.doc.importNode(nodes[i].data, deep));
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


function SerializedXMLFragmentAdapter(doc, docadapter) {
    XMLFragmentAdapter.call(this, doc, docadapter);
}

SerializedXMLFragmentAdapter.prototype.adapt = function(nodes, deep) {
    this.doc = xmlshim.implementation.createDocument('', '', null);

    var frag = XMLFragmentAdapter.prototype.adapt.call(this, nodes, deep);
    var root = this.doc.createElement('values');

    root.appendChild(frag);
    this.doc.appendChild(root);

    return (new xmlshim.XMLSerializer).serializeToString(this.doc);
};

exports.XMLPayloadHandler = XMLPayloadHandler;
exports.XMLFragmentAdapter = XMLFragmentAdapter;
