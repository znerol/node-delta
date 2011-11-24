var platform = require('deltajs').platform;

exports.testParseSimpleXML = function(test) {
    var doc = platform.parseXML('<hello-world/>');
    test.equals(doc.firstChild.nodeName, 'hello-world');
    test.done();
};

exports.testParseSimpleXMLDefaultNS = function(test) {
    var doc = platform.parseXML('<hello xmlns="http://example.com/schema"><world creator="slartibartfast"/></hello>');
    test.equals(doc.firstChild.nodeName, 'hello');
    test.equals(doc.firstChild.namespaceURI, 'http://example.com/schema');

    test.equals(doc.firstChild.firstChild.nodeName, 'world');
    test.equals(doc.firstChild.firstChild.namespaceURI, 'http://example.com/schema');

    test.done();
};

exports.testSimpleRoundtrip = function(test) {
    var origText = '<hello-world/>';
    var doc = platform.parseXML(origText);
    var serializedText = platform.serializeXML(doc);

    // Remove XML declaration and trim string
    serializedText = serializedText.replace(/^<\?xml[^>]*>/,'');
    serializedText = serializedText.replace(/^\s*/,'');
    serializedText = serializedText.replace(/\s*$/,'');

    test.equals(serializedText, origText);
    test.done();
};

exports['should have access to node type constants through node instances'] = function(test) {
    var doc = platform.parseXML('<hello-world/>');
    n = doc.firstChild;
    test.equals(n.ELEMENT_NODE, 1);
    test.done();
};

exports['Simple patching scenario'] = function(test) {
    var original_doc = platform.parseXML('<r><c1/><c2/><c3/><c4/></r>');
    var r = original_doc.firstChild;
    var c1= r.firstChild;
    var c2 = c1.nextSibling;
    var c3 = c2.nextSibling;
    var c4 = c3.nextSibling;
    var original_nodes = [c2, c3];
    var anchor_node = c4;

    var replacement_doc = platform.parseXML('<d><c2x/></d>');
    var c2xr = replacement_doc.firstChild.firstChild;
    var c2xo = original_doc.importNode(c2xr, true);
    var replacement_nodes = [c2xo];

    var expect_siblings;
    var actual_siblings;

    // replace original nodes with replacement nodes
    replacement_nodes.forEach(function(n) {
        r.insertBefore(n, anchor_node);
    });
    original_nodes.forEach(function(n) {
        r.removeChild(n);
    });

    expect_siblings = [c1, c2xo, c4];
    actual_siblings = Array.prototype.slice.call(r.childNodes);
    test.deepEqual(actual_siblings, expect_siblings);

    // switch back from replacement nodes to original nodes
    original_nodes.forEach(function(n) {
        r.insertBefore(n, anchor_node);
    });
    replacement_nodes.forEach(function(n) {
        r.removeChild(n);
    });

    expect_siblings = [c1, c2, c3, c4];
    actual_siblings = Array.prototype.slice.call(r.childNodes);
    test.deepEqual(actual_siblings, expect_siblings);

    test.done();
};
