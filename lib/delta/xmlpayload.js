/**
 * @file:   Payload handler for XML/DOM documents
 */

(function(exports, platform) {
    function XMLPayloadHandler() {
    }

    XMLPayloadHandler.prototype.serializeToString = function(data) {
        return platform.serializeXML(data);
    }

    XMLPayloadHandler.prototype.parseString = function(string) {
        return platform.parseXML(string);
    }

    XMLPayloadHandler.prototype.createDocument = function() {
        return platform.createDocument();
    }

    function XMLFragmentAdapter(doc) {
        this.doc = doc;
    }

    XMLFragmentAdapter.prototype.adapt = function(nodes) {
        var result = this.doc.createDocumentFragment(),
            i;

        for (i = 0; i < nodes.length; i++) {
            result.appendChild(this.doc.importNode(nodes[i].data, true));
        }

        return result;
    }

    exports.XMLPayloadHandler = XMLPayloadHandler;
    exports.XMLFragmentAdapter = XMLFragmentAdapter;
}(
    typeof exports === 'undefined' ? (DeltaJS.xmlpayload={}) : exports,
    typeof require === 'undefined' ? DeltaJS.lcs : require('./platform.js')
));
