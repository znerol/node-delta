var dom = require("jsdom").level(3, 'core'),
    xml = require("libxmljs");
    saxToDom = require("./saxToDom.js");

exports.parseXmlString = function(markup) {
    var doc = new dom.Document();
    var parser = new xml.SaxParser(saxToDom.parserForDocument(doc));
    parser.parseString(markup);

    return doc;
}

exports.parseXmlFile = function(path) {
    var doc = new dom.Document();
    var parser = new xml.SaxParser(saxToDom.parserForDocument(doc));
    parser.parseString(markup);

    return doc;
}
