var profiles = require('../lib/profiles');
var diffcmd = require('../lib/delta/diff');
var patchcmd = require('../lib/delta/patch');

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

var xccDiffProfile = profiles.getDiffProfile('xcc');
var skelmatchDiffProfile = profiles.getDiffProfile('skelmatch');
var docProfile = profiles.getDocumentProfile('xml');
var deltaProfile = profiles.getDeltaProfile('xml');
var resolverProfile = profiles.getResolverProfile();

exports['SVG roundtrip (XCC)'] = function(test) {
    // generate patch within an immediately invoked function expression in
    // order to keep all those vars from bleeding over into following test
    // parts. A string containing the serialized XML representation of a delta
    // will be assigned to the variable patch.
    var patch = (function() {
        // load tree1 and tree2
        var doc1 = docProfile.loadOriginalDocument(fixtures['logo-1.svg']);
        var doc2 = docProfile.loadInputDocument(fixtures['logo-2.svg']);

        var d = new diffcmd.Diff(xccDiffProfile, docProfile, deltaProfile);
        var deltadoc = d.diff(doc1, doc2);

        test.equal(deltadoc.delta.operations.length, 4);

        return deltaProfile.serializeDocument(deltadoc);
    }());

    test.ok(typeof patch === 'string');
    test.ok(patch.length > 0);

    // Apply the generated patch to logo-1 fixture.
    var logo1patched = (function(){
        // Load tree1 and delta
        var doc = docProfile.loadOriginalDocument(fixtures['logo-1.svg']);
        var fragadapter = docProfile.createFragmentAdapter('xml');
        var deltadoc = deltaProfile.loadDocument(patch, fragadapter);

        var p = new patchcmd.Patch(resolverProfile, docProfile, deltaProfile);
        var fails = p.patch(doc, deltadoc);

        test.equal(fails, 0);

        return docProfile.serializeDocument(doc);
    }());

    test.ok(typeof logo1patched === 'string');
    test.ok(logo1patched.length > 0);

    // Compare tree hash values of logo-2 and logo-1-patched. They should be
    // equal now.
    (function(){
        var doc1 = docProfile.loadOriginalDocument(fixtures['logo-1.svg']);
        var doc1patched = docProfile.loadInputDocument(logo1patched);
        var doc2 = docProfile.loadInputDocument(fixtures['logo-2.svg']);

        var hash1 = doc1.treevalueindex.get(doc1.tree);
        var hash1patched = doc1patched.treevalueindex.get(doc1patched.tree);
        var hash2 = doc2.treevalueindex.get(doc2.tree);

        test.notEqual(hash1, hash1patched);
        test.notEqual(hash1, hash2);
        test.equal(hash2, hash1patched);
    }());

    // Compute diff between logo-2 and logo-1-patched. It should not contain
    // any operation.
    (function(){
        // load tree1 and tree2
        var doc1patched = docProfile.loadOriginalDocument(logo1patched);
        var doc2 = docProfile.loadInputDocument(fixtures['logo-2.svg']);

        var d = new diffcmd.Diff(xccDiffProfile, docProfile, deltaProfile);
        var deltadoc = d.diff(doc1patched, doc2);

        test.equal(deltadoc.delta.operations.length, 0);
    }());

    test.done();
};

exports['SVG identity (XCC)'] = function(test) {
    // load tree1 and tree2
    var doc1 = docProfile.loadOriginalDocument(fixtures['logo-1.svg']);
    var doc2 = docProfile.loadInputDocument(fixtures['logo-1.svg']);

    var d = new diffcmd.Diff(xccDiffProfile, docProfile, deltaProfile);
    var deltadoc = d.diff(doc1, doc2);

    test.equal(deltadoc.delta.operations.length, 0);

    test.done();
};

exports['SVG roundtrip (Skel-Match)'] = function(test) {
    // generate patch within an immediately invoked function expression in
    // order to keep all those vars from bleeding over into following test
    // parts. A string containing the serialized XML representation of a delta
    // will be assigned to the variable patch.
    var patch = (function() {
        // load tree1 and tree2
        var doc1 = docProfile.loadOriginalDocument(fixtures['logo-1.svg']);
        var doc2 = docProfile.loadInputDocument(fixtures['logo-2.svg']);

        var d = new diffcmd.Diff(skelmatchDiffProfile, docProfile, deltaProfile);
        var deltadoc = d.diff(doc1, doc2);

        test.equal(deltadoc.delta.operations.length, 4);

        return deltaProfile.serializeDocument(deltadoc);
    }());

    test.ok(typeof patch === 'string');
    test.ok(patch.length > 0);

    // Apply the generated patch to logo-1 fixture.
    var logo1patched = (function(){
        // Load tree1 and delta
        var doc = docProfile.loadOriginalDocument(fixtures['logo-1.svg']);
        var fragadapter = docProfile.createFragmentAdapter('xml');
        var deltadoc = deltaProfile.loadDocument(patch, fragadapter);

        var p = new patchcmd.Patch(resolverProfile, docProfile, deltaProfile);
        var fails = p.patch(doc, deltadoc);

        test.equal(fails, 0);

        return docProfile.serializeDocument(doc);
    }());

    test.ok(typeof logo1patched === 'string');
    test.ok(logo1patched.length > 0);

    // Compare tree hash values of logo-2 and logo-1-patched. They should be
    // equal now.
    (function(){
        var doc1 = docProfile.loadOriginalDocument(fixtures['logo-1.svg']);
        var doc1patched = docProfile.loadInputDocument(logo1patched);
        var doc2 = docProfile.loadInputDocument(fixtures['logo-2.svg']);

        var hash1 = doc1.treevalueindex.get(doc1.tree);
        var hash1patched = doc1patched.treevalueindex.get(doc1patched.tree);
        var hash2 = doc2.treevalueindex.get(doc2.tree);

        test.notEqual(hash1, hash1patched);
        test.notEqual(hash1, hash2);
        test.equal(hash2, hash1patched);
    }());

    // Compute diff between logo-2 and logo-1-patched. It should not contain
    // any operation.
    (function(){
        // load tree1 and tree2
        var doc1patched = docProfile.loadOriginalDocument(logo1patched);
        var doc2 = docProfile.loadInputDocument(fixtures['logo-2.svg']);

        var d = new diffcmd.Diff(skelmatchDiffProfile, docProfile, deltaProfile);
        var deltadoc = d.diff(doc1patched, doc2);

        test.equal(deltadoc.delta.operations.length, 0);
    }());

    test.done();
};

exports['SVG identity (Skel-Match)'] = function(test) {
    // load tree1 and tree2
    var doc1 = docProfile.loadOriginalDocument(fixtures['logo-1.svg']);
    var doc2 = docProfile.loadInputDocument(fixtures['logo-1.svg']);

    var d = new diffcmd.Diff(skelmatchDiffProfile, docProfile, deltaProfile);
    var deltadoc = d.diff(doc1, doc2);

    test.equal(deltadoc.delta.operations.length, 0);

    test.done();
};



exports['HTML roundtrip (XCC)'] = function(test) {
    // generate patch within an immediately invoked function expression in
    // order to keep all those vars from bleeding over into following test
    // parts. A string containing the serialized XML representation of a delta
    // will be assigned to the variable patch.
    var patch = (function() {
        // load tree1 and tree2
        var doc1 = docProfile.loadOriginalDocument(fixtures['zappa-quote-1.html']);
        var doc2 = docProfile.loadInputDocument(fixtures['zappa-quote-2.html']);

        var d = new diffcmd.Diff(xccDiffProfile, docProfile, deltaProfile);
        var deltadoc = d.diff(doc1, doc2);

        test.equal(deltadoc.delta.operations.length, 6);

        return deltaProfile.serializeDocument(deltadoc);
    }());

    test.ok(typeof patch === 'string');
    test.ok(patch.length > 0);

    // Apply the generated patch to zappa-1 fixture.
    var zappa1patched = (function(){
        // Load tree1 and delta
        var doc = docProfile.loadOriginalDocument(fixtures['zappa-quote-1.html']);
        var fragadapter = docProfile.createFragmentAdapter('xml');
        var deltadoc = deltaProfile.loadDocument(patch, fragadapter);

        var p = new patchcmd.Patch(resolverProfile, docProfile, deltaProfile);
        var fails = p.patch(doc, deltadoc);

        test.equal(fails, 0);

        return docProfile.serializeDocument(doc);
    }());

    test.ok(typeof zappa1patched === 'string');
    test.ok(zappa1patched.length > 0);

    // Compare tree hash values of zappa-2 and zappa-1-patched. They should be
    // equal now.
    (function(){
        var doc1 = docProfile.loadOriginalDocument(fixtures['zappa-quote-1.html']);
        var doc1patched = docProfile.loadInputDocument(zappa1patched);
        var doc2 = docProfile.loadInputDocument(fixtures['zappa-quote-2.html']);

        var hash1 = doc1.treevalueindex.get(doc1.tree);
        var hash1patched = doc1patched.treevalueindex.get(doc1patched.tree);
        var hash2 = doc2.treevalueindex.get(doc2.tree);

        test.notEqual(hash1, hash1patched);
        test.notEqual(hash1, hash2);
        test.equal(hash2, hash1patched);
    }());

    // Compute diff between zappa-2 and zappa-1-patched. It should not contain
    // any operation.
    (function(){
        // load tree1 and tree2
        var doc1patched = docProfile.loadOriginalDocument(zappa1patched);
        var doc2 = docProfile.loadInputDocument(fixtures['zappa-quote-2.html']);

        var d = new diffcmd.Diff(xccDiffProfile, docProfile, deltaProfile);
        var deltadoc = d.diff(doc1patched, doc2);

        test.equal(deltadoc.delta.operations.length, 0);
    }());

    test.done();
};

exports['HTML identity (XCC)'] = function(test) {
    // load tree1 and tree2
    var doc1 = docProfile.loadOriginalDocument(fixtures['zappa-quote-1.html']);
    var doc2 = docProfile.loadInputDocument(fixtures['zappa-quote-1.html']);

    var d = new diffcmd.Diff(xccDiffProfile, docProfile, deltaProfile);
    var deltadoc = d.diff(doc1, doc2);

    test.equal(deltadoc.delta.operations.length, 0);

    test.done();
};

exports['HTML roundtrip (Skel-Match)'] = function(test) {
    // generate patch within an immediately invoked function expression in
    // order to keep all those vars from bleeding over into following test
    // parts. A string containing the serialized XML representation of a delta
    // will be assigned to the variable patch.
    var patch = (function() {
        // load tree1 and tree2
        var doc1 = docProfile.loadOriginalDocument(fixtures['zappa-quote-1.html']);
        var doc2 = docProfile.loadInputDocument(fixtures['zappa-quote-2.html']);

        var d = new diffcmd.Diff(skelmatchDiffProfile, docProfile, deltaProfile);
        var deltadoc = d.diff(doc1, doc2);

        test.equal(deltadoc.delta.operations.length, 6);

        return deltaProfile.serializeDocument(deltadoc);
    }());

    test.ok(typeof patch === 'string');
    test.ok(patch.length > 0);

    // Apply the generated patch to zappa-1 fixture.
    var zappa1patched = (function(){
        // Load tree1 and delta
        var doc = docProfile.loadOriginalDocument(fixtures['zappa-quote-1.html']);
        var fragadapter = docProfile.createFragmentAdapter('xml');
        var deltadoc = deltaProfile.loadDocument(patch, fragadapter);

        var p = new patchcmd.Patch(resolverProfile, docProfile, deltaProfile);
        var fails = p.patch(doc, deltadoc);

        test.equal(fails, 0);

        return docProfile.serializeDocument(doc);
    }());

    test.ok(typeof zappa1patched === 'string');
    test.ok(zappa1patched.length > 0);

    // Compare tree hash values of zappa-2 and zappa-1-patched. They should be
    // equal now.
    (function(){
        var doc1 = docProfile.loadOriginalDocument(fixtures['zappa-quote-1.html']);
        var doc1patched = docProfile.loadInputDocument(zappa1patched);
        var doc2 = docProfile.loadInputDocument(fixtures['zappa-quote-2.html']);

        var hash1 = doc1.treevalueindex.get(doc1.tree);
        var hash1patched = doc1patched.treevalueindex.get(doc1patched.tree);
        var hash2 = doc2.treevalueindex.get(doc2.tree);

        test.notEqual(hash1, hash1patched);
        test.notEqual(hash1, hash2);
        test.equal(hash2, hash1patched);
    }());

    // Compute diff between zappa-2 and zappa-1-patched. It should not contain
    // any operation.
    (function(){
        // load tree1 and tree2
        var doc1patched = docProfile.loadOriginalDocument(zappa1patched);
        var doc2 = docProfile.loadInputDocument(fixtures['zappa-quote-2.html']);

        var d = new diffcmd.Diff(skelmatchDiffProfile, docProfile, deltaProfile);
        var deltadoc = d.diff(doc1patched, doc2);

        test.equal(deltadoc.delta.operations.length, 0);
    }());

    test.done();
};

exports['HTML identity (Skel-Match)'] = function(test) {
    // load tree1 and tree2
    var doc1 = docProfile.loadOriginalDocument(fixtures['zappa-quote-1.html']);
    var doc2 = docProfile.loadInputDocument(fixtures['zappa-quote-1.html']);

    var d = new diffcmd.Diff(skelmatchDiffProfile, docProfile, deltaProfile);
    var deltadoc = d.diff(doc1, doc2);

    test.equal(deltadoc.delta.operations.length, 0);

    test.done();
};
