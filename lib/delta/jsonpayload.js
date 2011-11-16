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

    function JSONFragmentAdapter(doc) {
        this.doc = doc;
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

    exports.JSONPayloadHandler = JSONPayloadHandler;
    exports.JSONFragmentAdapter = JSONFragmentAdapter;
}(
    typeof exports === 'undefined' ? (DeltaJS.jsonpayload={}) : exports,
    typeof require === 'undefined' ? DeltaJS.lcs : require('./platform.js')
));
