/**
 * @file:   Payload handler for XML/DOM documents
 */

var platform = require('./platform.js')

function XMLPayloadHandler() {
}

XMLPayloadHandler.prototype.serializeToString = function(doc) {
    return platform.serializeXML(doc);
}

XMLPayloadHandler.prototype.parseString = function(string) {
    return platform.parseXML(string);
}

XMLPayloadHandler.prototype.createDocument = function() {
    return platform.createDocument();
}

XMLPayloadHandler.prototype.createTreeFragmentAdapter = function(doc, docadapter, type) {
    if (type === 'xml') {
        return new XMLFragmentAdapter(doc, docadapter);
    }
    else {
        return new SerializedXMLFragmentAdapter(doc, docadapter);
    }
}


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
}


XMLFragmentAdapter.prototype.importFragment = function(domnodes, deep) {
    var result = [], node, i;

    for (i=0; i<domnodes.length; i++) {
        node = this.docadapter.adaptElement(domnodes[i]);
        if (node) {
            result.push(node);
        }
    }

    return result;
}


function SerializedXMLFragmentAdapter(doc, docadapter) {
    XMLFragmentAdapter.call(this, doc, docadapter);
}

SerializedXMLFragmentAdapter.prototype.adapt = function(nodes, deep) {
    this.doc = platform.createDocument();

    var frag = XMLFragmentAdapter.prototype.adapt.call(this, nodes, deep);
    var root = this.doc.createElement('values');

    root.appendChild(frag);
    this.doc.appendChild(root);

    return platform.serializeXML(this.doc);
}

exports.XMLPayloadHandler = XMLPayloadHandler;
exports.XMLFragmentAdapter = XMLFragmentAdapter;
