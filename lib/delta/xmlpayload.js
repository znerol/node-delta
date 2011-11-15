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

    exports.XMLPayloadHandler = XMLPayloadHandler;

}(
    typeof exports === 'undefined' ? (DeltaJS.xmlpayload={}) : exports,
    typeof require === 'undefined' ? DeltaJS.lcs : require('./platform.js')
));
