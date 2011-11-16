var dom = require("jsdom").level(3, 'core'),
    xml = require("libxmljs");

function XMLSerializer() {
    this.nsstack = [];
    this.defaultns = undefined;
    this.writer = new xml.TextWriter();
}

XMLSerializer.prototype.serializeToString = function(doc) {
    this.writer.openMemory();
    this.writer.startDocument();

    this.writeElement(doc.documentElement);

    this.writer.endDocument();
    return this.writer.outputMemory();
};

XMLSerializer.prototype.writeNode = function(node) {
    switch (node.nodeType) {
        case dom.Node.ELEMENT_NODE:
            this.writeElement(node);
            break;

        case dom.Node.ATTRIBUTE_NODE:
            this.writeAttribute(node);
            break;

        case dom.Node.TEXT_NODE:
            this.writeText(node);
            break;

        case dom.Node.CDATA_SECTION_NODE:
            this.writeCdata(node);
            break;

        default:
            console.log('Serialization of node type ' + node.nodeType +
                    ' not supported yet');
            break;
    }
};

XMLSerializer.prototype.writeElement = function(element) {
    var i;
    var prefix = element.prefix || undefined;
    var nsURI = element.namespaceURI || undefined;
    var name = element.tagName || undefined;

    /*
    if (prefix) {
        // Element with prefix. look up prefix in nsstack. If prefix/uri pair
        // is found, undefine prefix. If otherwise set new prefix/uri

    }
    if (namespace) {
        // Element in default namespace. Lookup default namespace. If it
        // matches, undefine namespace. Otherwise push new namespace.
    }
    */

    this.writer.startElementNS(prefix, name, nsURI);

    for (i=0; i < element.attributes.length; i++) {
        this.writeAttribute(element.attributes[i]);
    }

    for (i=0; i < element.childNodes.length; i++) {
        this.writeNode(element.childNodes[i]);
    }

    this.writer.endElement();
};

XMLSerializer.prototype.writeAttribute = function(attribute) {
    var prefix = attribute.prefix || undefined;
    var nsURI = attribute.namespaceURI || undefined;
    var name = attribute.name || undefined;

    this.writer.startAttributeNS(prefix, name, nsURI);
    this.writer.writeString(attribute.value);
    this.writer.endAttribute();
};

XMLSerializer.prototype.writeText = function(text) {
    this.writer.writeString(text.data);
};

XMLSerializer.prototype.writeCdata = function(cdata) {
    this.writer.startCdata();
    this.writer.writeString(cdata.data);
    this.writer.endCdata();
};

exports.XMLSerializer = XMLSerializer;
