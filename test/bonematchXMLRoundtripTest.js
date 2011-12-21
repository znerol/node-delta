var deltamod = require('../lib/delta/delta');
var domdelta = require('../lib/delta/domdelta');
var domtree = require('../lib/delta/domtree');
var fnv132 = require('../lib/delta/fnv132');
var resolver = require('../lib/delta/resolver');
var tree = require('../lib/delta/tree');
var bonematch = require('../lib/delta/bonematch');
var xmlpayload = require('../lib/delta/xmlpayload');

var fixtures;
try {
    // Browserify/fileify export fixtures as a module, therefore we have to try
    // the require module-method here.
    fixtures = require('fixtures');
}
catch (e) {
    // Fallback to relative require under node.js
    fixtures = require('./fixtures');
}

exports['SVG roundtrip'] = function(test) {
    var payloadHandler = new xmlpayload.XMLPayloadHandler();
    var treeAdapter = new domtree.DOMTreeAdapter();

    // generate patch within an immediately invoked function expression in
    // order to keep all those vars from bleeding over into following test
    // parts. A string containing the serialized XML representation of a delta
    // will be assigned to the variable patch.
    var patch = (function() {
        // load tree1 and tree2
        var doc1 = payloadHandler.parseString(fixtures['logo-1.svg']);
        var doc2 = payloadHandler.parseString(fixtures['logo-2.svg']);

        var tree1 = treeAdapter.adaptDocument(doc1);
        var tree2 = treeAdapter.adaptDocument(doc2);

        // match trees
        var valindex = new tree.NodeHashIndex(new domtree.DOMNodeHash(fnv132.Hash));
        var matching = new tree.Matching();
        var diff = new bonematch.Diff(tree1, tree2);
        diff.equals = function(a, b) {
            return valindex.get(a) === valindex.get(b);
        };
        diff.matchTrees(matching);

        // construct patch
        var delta = new deltamod.Delta();
        var a_index = new tree.DocumentOrderIndex(tree1);
        a_index.buildAll();

        var contextgen = new deltamod.ContextGenerator(4, a_index, valindex);
        var collector = new deltamod.DeltaCollector(matching, tree1, tree2);
        collector.equals = diff.equals;
        delta.collect2(collector, contextgen);

        // Serialize delta
        var deltadoc = payloadHandler.createDocument();
        var fragadapter = payloadHandler.createTreeFragmentAdapter(deltadoc,
                treeAdapter, 'xml');
        var deltaAdapter = new domdelta.DOMDeltaAdapter(fragadapter);
        deltaAdapter.createDocument(deltadoc, delta);
        return payloadHandler.serializeToString(deltadoc);
    }());

    test.ok(typeof patch === 'string');
    test.ok(patch.length > 0);

    // Apply the generated patch to logo-1 fixture.
    var logo1patched = (function(){
        // Load tree1 and delta
        var doc = payloadHandler.parseString(fixtures['logo-1.svg']);
        var deltadoc = payloadHandler.parseString(patch);

        var tree1 = treeAdapter.adaptDocument(doc);

        var fragadapter = payloadHandler.createTreeFragmentAdapter(deltadoc,
                treeAdapter, 'xml');
        var deltaAdapter = new domdelta.DOMDeltaAdapter(fragadapter);
        var delta = deltaAdapter.adaptDocument(deltadoc);

        // Resolve operations
        var nodevalidx= new tree.NodeHashIndex(
            new domtree.DOMNodeHash(fnv132.Hash));
        var treevalidx = new tree.TreeHashIndex(
            new tree.SimpleTreeHash(fnv132.Hash, nodevalidx));
        var a_index = new tree.DocumentOrderIndex(tree1);
        a_index.buildAll();

        var res = new resolver.ContextResolver(tree1, a_index);
        res.equalContent = function(docnode, patchnode, type) {
            if (type === deltamod.UPDATE_FOREST_TYPE) {
                return treevalidx.get(docnode) === treevalidx.get(patchnode);
            }
            else if (type === deltamod.UPDATE_NODE_TYPE) {
                return nodevalidx.get(docnode) === nodevalidx.get(patchnode);
            }
            else {
                throw new Error('Got unknown operation type in equalContent cb: ' + type);
            }
        };
        res.equalContext = function(docnode, value) {
            return nodevalidx.get(docnode) === value;
        };

        var handlerfactory = new domdelta.DOMOperationHandlerFactory();
        var fails = delta.attach(res, handlerfactory);

        // Apply patch
        delta.forEach(function(op, handler) {
            if (handler) {
                handler.toggle();
            }
            else {
                throw new Error('failed to resolve hunk');
            }
        });
        return payloadHandler.serializeToString(doc);
    }());

    test.ok(typeof logo1patched === 'string');
    test.ok(logo1patched.length > 0);

    // Compare tree hash values of logo-2 and logo-1-patched. They should be
    // equal now.
    (function(){
        var doc1 = payloadHandler.parseString(fixtures['logo-1.svg']);
        var doc1patched = payloadHandler.parseString(logo1patched);
        var doc2 = payloadHandler.parseString(fixtures['logo-2.svg']);

        var tree1 = treeAdapter.adaptDocument(doc1);
        var tree1patched = treeAdapter.adaptDocument(doc1patched);
        var tree2 = treeAdapter.adaptDocument(doc2);

        var nodevalidx= new tree.NodeHashIndex(
            new domtree.DOMNodeHash(fnv132.Hash));
        var treevalidx = new tree.TreeHashIndex(
            new tree.SimpleTreeHash(fnv132.Hash, nodevalidx));

        var hash1 = treevalidx.get(tree1);
        var hash1patched = treevalidx.get(tree1patched);
        var hash2 = treevalidx.get(tree2);

        test.notEqual(hash1, hash1patched);
        test.notEqual(hash1, hash2);
        test.equal(hash2, hash1patched);
    }());

    // Compute diff between logo-2 and logo-1-patched. It should not contain
    // any operation.
    (function(){
        // load tree1 and tree2
        var doc1patched = payloadHandler.parseString(logo1patched);
        var doc2 = payloadHandler.parseString(fixtures['logo-2.svg']);

        var tree1patched = treeAdapter.adaptDocument(doc1patched);
        var tree2 = treeAdapter.adaptDocument(doc2);

        // match trees
        var valindex = new tree.NodeHashIndex(new domtree.DOMNodeHash(fnv132.Hash));
        var matching = new tree.Matching();
        var diff = new bonematch.Diff(tree1patched, tree2);
        diff.equals = function(a, b) {
            return valindex.get(a) === valindex.get(b);
        };
        diff.matchTrees(matching);

        // construct patch
        var delta = new deltamod.Delta();
        var a_index = new tree.DocumentOrderIndex(tree1patched);
        a_index.buildAll();

        var contextgen = new deltamod.ContextGenerator(4, a_index, valindex);
        var collector = new deltamod.DeltaCollector(matching, tree1patched, tree2);
        collector.equals = diff.equals;
        delta.collect2(collector, contextgen);

        delta.forEach(function(op) {
            throw new Error('Should not produce any operation for two identical trees');
        });
    }());

    test.done();
};

exports['SVG identity'] = function(test) {
    var payloadHandler = new xmlpayload.XMLPayloadHandler();
    var treeAdapter = new domtree.DOMTreeAdapter();

    // load tree1 and tree2
    var doc1 = payloadHandler.parseString(fixtures['logo-1.svg']);
    var doc2 = payloadHandler.parseString(fixtures['logo-1.svg']);

    var tree1 = treeAdapter.adaptDocument(doc1);
    var tree2 = treeAdapter.adaptDocument(doc2);

    // match trees
    var valindex = new tree.NodeHashIndex(new domtree.DOMNodeHash(fnv132.Hash));
    var matching = new tree.Matching();
    var diff = new bonematch.Diff(tree1, tree2);
    diff.equals = function(a, b) {
        return valindex.get(a) === valindex.get(b);
    };
    diff.matchTrees(matching);

    // construct patch
    var delta = new deltamod.Delta();
    var a_index = new tree.DocumentOrderIndex(tree1);
    a_index.buildAll();

    var contextgen = new deltamod.ContextGenerator(4, a_index, valindex);
    var collector = new deltamod.DeltaCollector(matching, tree1, tree2);
    collector.equals = diff.equals;
    delta.collect2(collector, contextgen);

    delta.forEach(function(op) {
        throw new Error('Should not produce any operation for two identical trees');
    });

    test.done();
};
