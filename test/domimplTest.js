(function(exports){
    var jsdomParseXML = function (text) {
        var parseXmlString = require('deltajs').xmlToDom.parseXmlString;
        return parseXmlString(text);
    }

    var libxmljsParseXml = function (text) {
        var libxmljs = require('libxmljs');
        return libxmljs.parseXmlString(text);
    }

    var browserParseXML = function (text) {
        var xmlParser;
        var xmlDoc;

        if (window.DOMParser) {
            xmlParser = new DOMParser();
            xmlDoc = xmlParser.parseFromString(text,"text/xml");
        }
        else {
            xmlDoc = new ActiveXObject("Microsoft.XMLDOM");
            xmlDoc.async="false";
            xmlDoc.loadXML(text);
        }

        return xmlDoc;
    }

    var parseXML = (typeof window === 'undefined' ? jsdomParseXML : browserParseXML);

    exports.testParseSimpleXML = function(test) {
        var doc = parseXML('<hello-world>');
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

})(typeof exports === 'undefined' ? (this.domimplTest={}) : exports);
