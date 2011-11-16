/**
 * @file:   Payload handler for XML/DOM documents
 */

(function(exports, platform) {
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

    XMLPayloadHandler.prototype.createTreeFragmentAdapter = function(doc, type) {
        if (type === 'xml') {
            return new XMLFragmentAdapter(doc);
        }
        else {
            return new SerializedXMLFragmentAdapter();
        }
    }

    function XMLFragmentAdapter(doc) {
        this.doc = doc;
    }

    XMLFragmentAdapter.prototype.adapt = function(nodes, deep) {
        var result = this.doc.createDocumentFragment(),
            i;

        for (i = 0; i < nodes.length; i++) {
            result.appendChild(this.doc.importNode(nodes[i].data, deep));
        }

        return result;
    }

    function SerializedXMLFragmentAdapter() {
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
}(
    typeof exports === 'undefined' ? (DeltaJS.xmlpayload={}) : exports,
    typeof require === 'undefined' ? DeltaJS.lcs : require('./platform.js')
));
