define(["require", "exports", "module"], function(require, exports, module) {
/**
 * @file:   Payload handler for stringified JSON data
 *
 * @module  jsonpayload
 */

/**
 * @constructor
 */
function JSONPayloadHandler() {
}

JSONPayloadHandler.prototype.serializeToString = function(data) {
    return JSON.stringify(data);
};

JSONPayloadHandler.prototype.parseString = function(string) {
    return JSON.parse(string);
};

JSONPayloadHandler.prototype.createDocument = function() {
    return {};
};

JSONPayloadHandler.prototype.createTreeFragmentAdapter = function(doc, type) {
    if (type === 'json') {
        return new exports.JSONFragmentAdapter();
    }
    else {
        return new exports.SerializedJSONFragmentAdapter();
    }
};


/**
 * @constructor
 */
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
};


/**
 * @constructor
 */
function SerializedJSONFragmentAdapter() {
}

SerializedJSONFragmentAdapter.prototype.adapt = function(nodes, deep) {
    var object = JSONFragmentAdapter.prototype.adapt.call(this, nodes, deep);
    return JSON.stringify(object);
};

exports.JSONPayloadHandler = JSONPayloadHandler;
exports.JSONFragmentAdapter = JSONFragmentAdapter;

});
