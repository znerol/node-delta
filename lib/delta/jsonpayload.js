/**
 * @file:   Payload handler for stringified JSON data
 */

(function(exports, platform) {
    function JSONPayloadHandler() {
    }

    JSONPayloadHandler.prototype.serializeToString = function(data) {
        return platform.serializeJSON(data);
    }

    JSONPayloadHandler.prototype.parseString = function(string) {
        return platform.parseJSON(string);
    }

    JSONPayloadHandler.prototype.createDocument = function() {
        return {};
    }

    JSONPayloadHandler.prototype.createTreeFragmentAdapter = function(doc, type) {
        if (type === 'json') {
            return new JSONFragmentAdapter();
        }
        else {
            return new SerializedJSONFragmentAdapter();
        }
    }

    function JSONFragmentAdapter() {
    }

    JSONFragmentAdapter.prototype.adapt = function(nodes, deep) {
        var value, result = [], i;

        for (i = 0; i < nodes.length; i++) {
            if (deep) {
                value = {
                    'key': nodes[i].value,
                    'value': nodes[i].data,
                };
            }
            else {
                value = nodes[i].value;
            }

            result.push(value);
        }

        return result;
    }

    function SerializedJSONFragmentAdapter() {
    }

    SerializedJSONFragmentAdapter.prototype.adapt = function(nodes, deep) {
        var object = JSONFragmentAdapter.prototype.adapt.call(this, nodes, deep);
        return platform.serializeJSON(object);
    }

    exports.JSONPayloadHandler = JSONPayloadHandler;
    exports.JSONFragmentAdapter = JSONFragmentAdapter;
}(
    typeof exports === 'undefined' ? (DeltaJS.jsonpayload={}) : exports,
    typeof require === 'undefined' ? DeltaJS.lcs : require('./platform.js')
));
