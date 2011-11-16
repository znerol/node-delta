/**
 * @file:   Platform specific implementation and abstractions
 */

(function(exports) {
    exports.isBrowser = function() {
        return typeof window !== 'undefined';
    };


    /**
     * Construct and return a DOM document from an xml string
     */
    exports.parseXML = function (text) {
        if (exports.isBrowser()) {
            // IE9 (Chakra): http://msdn.microsoft.com/en-us/library/ff975124(v=vs.85).aspx
            // No support for IE < 9 (not falling back to ActiveX Component).
            // FF (Gecko): https://developer.mozilla.org/en/DOM/DOMParser
            // No official documentation for WebKit (Safari, Chromium, Konqueror)
            // and Opera but recent versions of these browsers provide DomParser.
            return (new DOMParser()).parseFromString(text,"text/xml");
        }
        else {
            // Node.js: Use our own implementation around jsdom
            return require('./xmlToDom.js').parseXmlString(text);
        }
    };


    /**
     * Serialize a DOM document into an xml string
     */
    exports.serializeXML = function (doc) {
        if (exports.isBrowser()) {
            // IE9 (Chakra): http://msdn.microsoft.com/en-us/library/ff975124(v=vs.85).aspx
            // No support for IE < 9
            // FF (Gecko): https://developer.mozilla.org/en/XMLSerializer
            // No official documentation for WebKit (Safari, Chromium, Konqueror)
            // and Opera but recent versions of these browsers provide
            // XMLSerializer.
            return (new XMLSerializer()).serializeToString(doc);
        }
        else {
            var domToXml = require('./domToXml.js');
            var XMLSerializer = domToXml.XMLSerializer;
            return (new XMLSerializer()).serializeToString(doc);
        }
    };


    /**
     * Create a new DOM document and return it
     */
    exports.createDocument = function() {
        if (exports.isBrowser()) {
            // FIXME
        }
        else {
            var dom = require("jsdom").level(3, 'core');
            return new dom.Document();
        }
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

        if (exports.isBrowser()) {
            result = node.hasAttributes() ? Array.prototype.slice.call(node.attributes) : [];
        }
        else {
            // Need to construct the array manually when using jsdom/node.js
            result = [];
            for (i = 0; i < node.attributes.length; i++) {
                result.push(node.attributes[i]);
            }
        }

        return result;
    };

}(
    typeof exports === 'undefined' ? (DeltaJS.platform={}) : exports
));
