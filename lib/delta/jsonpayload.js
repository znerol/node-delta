/**
 * @file:   Payload handler for stringified JSON data
 */

(function(exports, platform) {
    function JSONPayloadHandler() {
    }

    JSONPayloadHandler.prototype.serialize = function(data) {
        return platform.serializeJSON(data);
    }

    JSONPayloadHandler.prototype.parse = function(string) {
        return platform.parseJSON(string);
    }

    exports.JSONPayloadHandler = JSONPayloadHandler;

}(
    typeof exports === 'undefined' ? (DeltaJS.jsonpayload={}) : exports,
    typeof require === 'undefined' ? DeltaJS.lcs : require('./platform.js')
));
