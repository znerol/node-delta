/**
 * Constructs a function which installs SAX handlers into a libxmljs.SaxParser
 * turning it into a DOM parser for the given doc.
 *
 * The function returned by this function will typically be used as the
 * argument of lixmljs.SaxParser Constructor.
 * <code>
 * var dom = require("jsdom").level(3, 'core'),
 *     xml = require("libxmljs"),
 *     saxTodom = require("./saxToDom.js");
 *
 * var doc = new dom.Document();
 * var parser = new xml.SaxParser(saxToDom.parserForDocument(doc));
 * parser.parseFile('example.xml');
 * // doc is now populated with the contents of example.xml file
 * </code>
 *
 * @param   doc A document instance implementing at least DOM Core Level 2.
 * @returns A function taking a SAX Parser instance, augmenting it with the
 *          necessary SAX handlers upon evaluation.
 */
exports.parserForDocument = function(doc) {
    /** @private */
    var currentElement = doc;
    /** @private */
    var currentCharacters = '';
    /** @private */
    var currentCdata = '';

    return (function(parser) {

        parser.onStartDocument(function() {});

        parser.onEndDocument(function() {});

        parser.onStartElementNS(function(elem, attrs, prefix, uri, namespaces) {
            var element;

            // Create element
            if (uri) {
                if (prefix) {
                    element = doc.createElementNS(uri, prefix + ':' + elem);
                }
                else {
                    element = doc.createElementNS(uri, elem);
                }
            }
            else {
                element = doc.createElement(elem);
            }

            // Add attributes
            attrs.forEach(function(inattr) {
                var attrLocalName = inattr[0];
                var attrPrefix = inattr[1];
                var attrUri = inattr[2];
                var attrValue = inattr[3];

                if (attrPrefix) {
                    element.setAttributeNS(attrUri,
                        attrPrefix + ':' + attrLocalName, attrValue);
                }
                else {
                    element.setAttribute(attrLocalName, attrValue);
                }
            });

            // Add namespace attributes. Default namespace has prefix=='',
            // ignore it.
            namespaces.forEach(function(ns) {
                if (ns[0]) {
                    element.setAttributeNS(
                        'http://www.w3.org/2000/xmlns/',
                        'xmlns:' + ns[1], ns[0]);
                }
            });

            currentElement.appendChild(element);
            currentElement = element;
        });

        parser.onEndElementNS(function(elem, prefix, uri) {
            if (currentCharacters) {
                currentElement.appendChild(
                    doc.createTextNode(currentCharacters));
                currentCharacters = '';
            }
            else if (currentCdata) {
                currentElement.appendChild(
                    doc.createTextNode(currentCdata));
                currentCdata = '';
            }
            currentElement = currentElement.parentNode;
        });

        parser.onCharacters(function(chars) {
            currentCharacters += chars;
        });

        parser.onCdata(function(cdata) {
            currentCdata += cdata;
        });

        parser.onComment(function(msg) {
            // FIXME
        });

        parser.onWarning(function(msg) {
            // FIXME
        });

        parser.onError(function(msg) {
            // FIXME
        });
    });
}
