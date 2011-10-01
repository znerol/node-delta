(function(exports){
    var nodejsParseXML = function (text) {
        var parseXmlString = require('deltajs').xmlToDom.parseXmlString;
        return parseXmlString(text);
    }

    var browserParseXML = function (text) {
        // IE9 (Chakra): http://msdn.microsoft.com/en-us/library/ff975124(v=vs.85).aspx
        // No support for IE < 9 (not falling back to ActiveX Component).
        // FF (Gecko): https://developer.mozilla.org/en/DOM/DOMParser
        // No official documentation for WebKit (Safari, Chromium, Konqueror)
        // and Opera but recent versions of these browsers provide DomParser.
        var xmlParser = new DOMParser();
        var xmlDoc = xmlParser.parseFromString(text,"text/xml");

        return xmlDoc;
    }

    var nodejsSerializeXML = function (doc) {
        // FIXME
    }

    var browserSerializeXML = function (doc) {
        // IE9 (Chakra): http://msdn.microsoft.com/en-us/library/ff975124(v=vs.85).aspx
        // No support for IE < 9
        // FF (Gecko): https://developer.mozilla.org/en/XMLSerializer
        // No official documentation for WebKit (Safari, Chromium, Konqueror)
        // and Opera but recent versions of these browsers provide
        // XMLSerializer.
        var serializer = new XMLSerializer();
        return serializer.serializeToString(doc);
    }

    var parseXML = (typeof window === 'undefined' ? nodejsParseXML : browserParseXML);

    var serializeXML = (typeof window === 'undefined' ? nodejsSerializeXML : browserSerializeXML);

    exports.testParseSimpleXML = function(test) {
        var doc = parseXML('<hello-world/>');
        test.equals(doc.firstChild.nodeName, 'hello-world');
        test.done();
    }

    exports.testParseSimpleXMLDefaultNS = function(test) {
        var doc = parseXML('<hello xmlns="http://example.com/schema"><world creator="slartibartfast"/></hello>');
        test.equals(doc.firstChild.nodeName, 'hello');
        test.equals(doc.firstChild.namespaceURI, 'http://example.com/schema');

        test.equals(doc.firstChild.firstChild.nodeName, 'world');
        test.equals(doc.firstChild.firstChild.namespaceURI, 'http://example.com/schema');

        test.done();
    }

    exports.testSimpleRoundtrip = function(test) {
        var origText = '<hello-world/>'
        var doc = parseXML(origText);
        var serializedText = serializeXML(doc);
        test.equals(serializedText, origText);
        test.done();
    }

})(typeof exports === 'undefined' ? (this.domimplTest={}) : exports);
