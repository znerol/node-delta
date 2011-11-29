var domdelta = require('../lib/delta/domdelta');
var domtree = require('../lib/delta/domtree');
var tree = require('../lib/delta/tree');
var xmlshim = require('xmlshim');
var dp;

function attributesArray(node) {
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


exports.setUp = function(callback) {
    dp = new xmlshim.DOMParser;
    callback();
}


exports['Simple subtree operation'] = function(test) {
    var original_doc = dp.parseFromString('<r><c1/><c2/><c3/><c4/></r>', 'text/xml');
    var r = original_doc.firstChild;
    var c1= r.firstChild;
    var c2 = c1.nextSibling;
    var c3 = c2.nextSibling;
    var c4 = c3.nextSibling;
    var original_nodes = [c2, c3];
    var before = c4;

    var replacement_doc = dp.parseFromString('<d><c2x/></d>', 'text/xml');
    var c2xr = replacement_doc.firstChild.firstChild;
    var c2xo = original_doc.importNode(c2xr, true);
    var replacement_nodes = [c2xo];

    var op = new domdelta.DOMTreeSequenceOperationHandler(r, before, original_nodes, replacement_nodes);

    var expect_siblings;
    var actual_siblings;

    // replace original nodes with replacement nodes
    op.toggle();

    expect_siblings = [c1, c2xo, c4];
    actual_siblings = Array.prototype.slice.call(r.childNodes);
    test.deepEqual(actual_siblings, expect_siblings);

    // switch back from replacement nodes to original nodes
    op.toggle();

    expect_siblings = [c1, c2, c3, c4];
    actual_siblings = Array.prototype.slice.call(r.childNodes);
    test.deepEqual(actual_siblings, expect_siblings);

    test.done();
}

exports['Simple node replace operation'] = function(test) {
    var original_doc = dp.parseFromString('<n id="1" name="test" value="3"><a/><b/></n>', 'text/xml');
    var original_node = original_doc.firstChild;
    var original_attrs = [
        original_node.getAttributeNode('id'),
        original_node.getAttributeNode('name'),
        original_node.getAttributeNode('value'),
        ];
    var original_children = [
        original_node.firstChild,
        original_node.firstChild.nextSibling,
        ];

    var replacement_doc = dp.parseFromString('<nx name="changed" value="2"/>', 'text/xml');
    var replacement_node = original_doc.importNode(replacement_doc.firstChild, true);
    var replacement_attrs = [
        replacement_node.getAttributeNode('name'),
        replacement_node.getAttributeNode('value'),
        ];

    var op = new domdelta.DOMNodeReplaceOperationHandler(original_node, replacement_node);

    var expect_attributes;
    var actual_attributes;

    // replace original attrs with replacement attrs
    op.toggle();

    expect_attributes = replacement_attrs;
    actual_attributes = attributesArray(original_doc.firstChild);
    test.deepEqual(actual_attributes, expect_attributes);

    expect_children = original_children;
    actual_children = Array.prototype.slice.call(original_doc.firstChild.childNodes);
    test.deepEqual(actual_children, expect_children);

    // switch back from replacement attrs to original attrs
    op.toggle();

    expect_attributes = original_attrs;
    actual_attributes = attributesArray(original_doc.firstChild);
    test.deepEqual(actual_attributes, expect_attributes);

    expect_children = original_children;
    actual_children = Array.prototype.slice.call(original_doc.firstChild.childNodes);
    test.deepEqual(actual_children, expect_children);

    test.done();
}

exports['Insert operation using operation factory'] = function(test) {
    var original_doc = dp.parseFromString('<r><c1/><c2/><c3/><c4/></r>', 'text/xml');
    var treeAdapter = new domtree.DOMTreeAdapter();
    var original_tree = treeAdapter.adaptDocument(original_doc);
    var original_c4 = original_tree.children[3];

    var replacement_doc = dp.parseFromString('<insert><c2x/></insert>', 'text/xml');
    var replacement_tree = treeAdapter.adaptDocument(replacement_doc);

    var factory = new domdelta.DOMOperationHandlerFactory();
    var insert_op = factory.createForestUpdateOperationHandler(
            original_tree, original_c4, 0, replacement_tree.children);

    var r = original_doc.firstChild;
    var expect_nodes;
    var actual_nodes;

    // replace original nodes with replacement nodes
    insert_op.toggle();
    expect_nodes = ['c1','c2','c3','c2x','c4'];
    actual_nodes = Array.prototype.slice.call(r.childNodes).map(
            function(n) {return n.tagName});
    test.deepEqual(actual_nodes, expect_nodes);

    // switch back from replacement nodes to original nodes
    insert_op.toggle();
    expect_nodes = ['c1','c2','c3','c4'];
    actual_nodes = Array.prototype.slice.call(r.childNodes).map(
            function(n) {return n.tagName});
    test.deepEqual(actual_nodes, expect_nodes);

    test.done();
}

exports['Remove operation using operation factory'] = function(test) {
    var original_doc = dp.parseFromString('<r><c1/><c2/><c3/><c4/></r>', 'text/xml');
    var treeAdapter = new domtree.DOMTreeAdapter();
    var original_tree = treeAdapter.adaptDocument(original_doc);
    var original_c2 = original_tree.children[1];

    var factory = new domdelta.DOMOperationHandlerFactory();
    var remove_op = factory.createForestUpdateOperationHandler(
            original_tree, original_c2, 2, []);

    var r = original_doc.firstChild;
    var expect_nodes;
    var actual_nodes;

    // replace original nodes with replacement nodes
    remove_op.toggle();
    expect_nodes = ['c1','c4'];
    actual_nodes = Array.prototype.slice.call(r.childNodes).map(
            function(n) {return n.tagName});
    test.deepEqual(actual_nodes, expect_nodes);

    // switch back from replacement nodes to original nodes
    remove_op.toggle();
    expect_nodes = ['c1','c2','c3','c4'];
    actual_nodes = Array.prototype.slice.call(r.childNodes).map(
            function(n) {return n.tagName});
    test.deepEqual(actual_nodes, expect_nodes);

    test.done();
}
