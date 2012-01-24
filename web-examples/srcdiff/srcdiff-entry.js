var xccDiffProfile = require('./lib/profiles/algo-diff-xcc');
var skelmatchDiffProfile = require('./lib/profiles/algo-diff-skelmatch');
var docProfile = require('./lib/profiles/doc-tree-xml');
var deltaProfile = require('./lib/profiles/delta-tree-xml');

var diff = require('./lib/delta/diff');

var da = require('./docannotator');
var style_html = require('./beautify-html').style_html;

/**
 * Annotate source tree by injecting comments into the underlying DOM
 */
function annotate_source(doc, matching, invert) {
    var collector = deltaProfile.createCollector(delta, doc,
            docProfile.createNodeEqualityTest(doc, doc));
    var domdoc = doc.tree.data.ownerDocument;
    var annotator = new da.DocumentAnnotator(domdoc);
    var excludes = [];

    
    //collector.forEachChange(function(type, path, par, remove, insert) {
    collector.forEachChange(function(op) {
        var deep = (op.type === 2),
        i, nodes, dompar, before, ancestors;

    if (op.anchor.base) {
        dompar = op.anchor.base.data;
        before = op.anchor.target;
        before = before && before.data;
    }
    else {
        dompar = domdoc;
        before = doc.tree.data;
    }

    for (nodes = [], i = 0; i < op.remove.length; i++) {
        nodes.push(op.remove[i].data.cloneNode(deep));
    }
    annotator.wrap(dompar, before, nodes,
        '<span class="change change-remove">', '</span>');

    for (nodes = [], i = 0; i < op.insert.length; i++) {
        nodes.push(domdoc.importNode(op.insert[i].data, deep));
    }
    annotator.wrap(dompar, before, nodes,
            '<span class="change change-insert">', '</span>');

    for (nodes = [], i = 0; i < op.remove.length; i++) {
        excludes.push([op.remove[i].data, deep]);
    }
    });

    for (var i = 0; i < excludes.length; i++) {
        annotator.exclude.apply(annotator, excludes[i]);
    }

    return annotator.toHTML();
}

function refresh() {
    if (doc1.tree && doc2.tree) {
        var d = new diff.Diff(skelmatchDiffProfile, docProfile, deltaProfile);
        delta = d.diff(doc1, doc2);

        $('#patch > pre').text(style_html(deltaProfile.serializeDocument(delta)));

        doc1.ansrc = annotate_source(doc1, delta.matching, false);
        doc2.ansrc = annotate_source(doc2, delta.matching, true);
    }
    $('#src1 > pre').html(doc1.ansrc);
    $('#src2 > pre').html(doc2.ansrc);
    prettyPrint();
}

function load_document(files, doc) {
    var file = files[0];
    var reader;
    var me = this;
    if (file) {
        if (file.type.match(/^(text\/xml|text\/html|.*\+xml)$/)) {
            reader = new FileReader();
            reader.onload = function(evt) {
                me[doc] = docProfile.loadOriginalDocument(evt.target.result);
                refresh();
            }
            reader.onerror = function(evt) {
                alert('Failed to load document.');
            }
            reader.readAsText(file);
        }
        else {
            alert('Filetype not supported');
        }
    }
}

$(function() {
    $('#file1').change(function() {
        load_document(this.files, 'doc1')
    });
    $('#file2').change(function() {
        load_document(this.files, 'doc2')
    });
});
