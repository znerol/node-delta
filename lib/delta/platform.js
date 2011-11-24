/**
 * @file:   Platform specific implementation and abstractions
 */

var xmlshim = require('xmlshim');

/**
 * Construct and return a DOM document from an xml string
 */
exports.parseXML = function (text) {
    return (new xmlshim.DOMParser()).parseFromString(text, "text/xml");
};


/**
 * Serialize a DOM document into an xml string
 */
exports.serializeXML = function (doc) {
    return (new xmlshim.XMLSerializer()).serializeToString(doc);
};


/**
 * Create a new DOM document and return it
 */
exports.createDocument = function() {
    return xmlshim.implementation.createDocument('', '', null);
}


exports.parseJSON = function(data) {
    return JSON.parse(data);
}


exports.serializeJSON = function(doc) {
    return JSON.stringify(doc);
}


/**
 * Return an array of the attributes of the given node.
 */
exports.attributesArray = function(node) {
    var result, i, n;

    if (process.title === 'node') {
        // Need to construct the array manually when using jsdom/node.js
        result = [];
        for (i = 0; i < node.attributes.length; i++) {
            result.push(node.attributes[i]);
        }
    }
    else {
        result = node.hasAttributes() ? Array.prototype.slice.call(node.attributes) : [];
    }

    return result;
};
