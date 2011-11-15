#!/usr/bin/env node

var optparse = require('optparse');
var sys = require('sys');
var fs  = require('fs');
var path = require('path');
var deltajs = require('../lib/delta.js');
var mime = require('mime');

/**
 * Ensure that the filepath is accessible and check its mime type.
 */
function checkfile(description, filepath, wantmime) {
    var filemime;

    if (!filepath || !path.existsSync(filepath)) {
        console.log('Path to ' + description + ' missing. Use the -h switch for help.');
        process.exit(1);
    }

    filemime = mime.lookup(filepath);
    if (wantmime && filemime !== wantmime) {
        console.log(description + ' is of the wrong type');
        process.exit(1);
    }
    return filemime;
}


/**
 * Parses and loads a file using the given adapter classes
 */
function loadFile(description, filepath, encoding, payloadhandler, dataadapter) {
    var data, doc, tree;
    data = fs.readFileSync(filepath, encoding);
    doc = payloadhandler.parseString(data);
    tree = dataadapter.adaptDocument(doc);
    return tree;
}


/**
 * Save data to a file using the given adapter and payload handler
 */
function saveFile(description, filepath, encoding, data, doc, payloadhandler, docadapter) {
    var buf;
    docadapter.createDocument(doc, data);
    buf = payloadhandler.serializeToString(doc);
    fs.writeFileSync(filepath, buf, encoding);
}


/**
 * Write serialized data to stdout
 */
function showFile(description, data, doc, payloadhandler, docadapter) {
    var buf;
    docadapter.createDocument(doc, data);
    buf = payloadhandler.serializeToString(doc);
    sys.puts(buf);
}


/**
 * Return the payload type for a given mimetype.
 */
function getPayloadType(mimetype) {
    if (mimetype === 'application/json') {
        return 'json';
    }
    else if (mimetype === 'application/xml' || mimetype.slice(-4) === '+xml') {
        return 'xml';
    }
}


/**
 * Return the proper payload handler for the given mime type. Return undefined
 * if no suitable payload handler is available.
 */
function createPayloadHandler(type) {
    var result;

    switch(type) {
        case 'json':
            result = new deltajs.jsonpayload.JSONPayloadHandler();
            break;
        case 'xml':
            result = new deltajs.xmlpayload.XMLPayloadHandler();
            break;
    }

    return result;
}


/**
 * Return the proper tree adapter for this payload type.
 */
function createTreeAdapter(type) {
    var result;

    switch(type) {
        case 'json':
            result = new deltajs.jsobjecttree.JSObjectTreeAdapter();
            break;
        case 'xml':
            result = new deltajs.domtree.DOMTreeAdapter();
            break;
    }

    return result;
}


/**
 * Return the proper tree adapter for this payload type.
 */
function createDeltaAdapter(type) {
    var result;

    switch(type) {
        case 'json':
            result = new deltajs.jsondelta.JSONDeltaAdapter();
            break;
        case 'xml':
            result = new deltajs.domdelta.DOMDeltaAdapter();
            break;
    }

    return result;
}


/**
 * Return proper payload adapter used to embedd tree fragments in patch file.
 */
function createTreeFragmentAdapter(documentPayloadType, patchtype) {
    if (documentPayloadType === 'xml' && patchtype === 'xml') {
        return new deltajs.xmlpayload.XMLFragmentAdapter();
    }
    else if (documentPayloadType === 'json' && patchtype === 'json') {
        return null;
    }
    else {
        throw new Error('Cross format patch files not supported yet');
    }
}


/**
 * Parse options and command line arguments and initialize the diff algorithm
 */
function main() {
    var options = {
        'origfile': undefined,
        'origenc': 'UTF-8',
        'changedfile': undefined,
        'changedenc': 'UTF-8',
        'documentPayloadType': undefined,
        'mimetype': undefined,

        'deltaPayloadType': 'xml',
        'patchfile': undefined,
        'patchenc': 'UTF-8',

        // Parse serialized files or strings into a document specific
        // structure.  This structure is the DOM for XML files and plain
        // JavaScript objects for JSON.
        'documentPayloadHandler': undefined,

        // Serialize patch file
        'deltaPayloadHandler': undefined,

        // Generate a mapping between the document specific datastructure and
        // a deltajs tree structure. The tree-adapter is responsible for
        // calculating the hashes for tree.Node values.
        'documentTreeAdapter': undefined,

        // Convert delta into a document specific datastructure
        'deltaAdapter': undefined,

        // Serialize tree fragments into the proper form when required due to
        // the combination of payload and patch format.
        'treeFragmentAdapter': undefined
    }

    var switches = [
        ['-h', '--help',    'Show this help'],
        ['-x', '--xml',     'Use XML patch format (default)'],
        ['-j', '--json',    'Use JSON patch format'],
        ['-d', '--debug',   'Log actions to console'],
        ];

    var parser = new optparse.OptionParser(switches);
    parser.banner = 'Usage: djdiff [options] FILE1 FILE2';

    parser.on('help', function(name, value) {
        sys.puts(parser.toString());
    });

    parser.on('xml', function(name, value) {
        options.deltaPayloadType='xml';
    });

    parser.on('json', function(name, value) {
        options.deltaPayloadType='json';
    });

    parser.on(2, function(value) {
        options.origfile=value
    });

    parser.on(3, function(value) {
        options.changedfile=value
    });

    parser.on(4, function(value) {
        options.patchfile=value
    });

    parser.parse(process.ARGV);

    options.mimetype = checkfile('original file', options.origfile,
            options.mimetype);
    options.mimetype = checkfile('changed file', options.changedfile,
            options.mimetype);

    options.documentPayloadType = getPayloadType(options.mimetype);
    if (!options.documentPayloadType) {
        console.log('This file type is not supported by djdiff');
    }

    options.documentPayloadHandler =
        createPayloadHandler(options.documentPayloadType);
    if (!options.documentPayloadHandler) {
        console.log('This file type is not supported by djdiff');
    }

    options.documentTreeAdapter =
        createTreeAdapter(options.documentPayloadType);

    options.deltaPayloadHandler =
        createPayloadHandler(options.deltaPayloadType);
    if (!options.deltaPayloadHandler) {
        console.log('This delta type is not supported by djdiff');
    }

    options.deltaAdapter = createDeltaAdapter(options.deltaPayloadType);

    options.treeFragmentAdapter = createTreeFragmentAdapter(
            options.documentPayloadType, options.deltaPayloadType);

    var tree1, tree2, diff, matching;
    tree1 = loadFile('original file', options.origfile, options.origenc,
            options.documentPayloadHandler, options.documentTreeAdapter);
    tree2 = loadFile('changed file', options.changedfile, options.changedenc,
            options.documentPayloadHandler, options.documentTreeAdapter);

    matching = new deltajs.tree.Matching();
    diff = new deltajs.xcc.Diff(tree1, tree2);
    diff.matchTrees(matching);

    var delta = new deltajs.delta.Delta();
    var a_index = new deltajs.tree.DocumentOrderIndex(tree1);
    a_index.buildAll();
    var fpfactory = new deltajs.delta.FingerprintFactory(a_index, 4);
    var editor = new deltajs.delta.Editor(delta, fpfactory);
    diff.generatePatch(matching, editor);

    var doc = options.deltaPayloadHandler.createDocument();
    // Hack: need to figure out some nice way to inject dependencies properly
    if (options.deltaPayloadType === 'xml') {
        options.treeFragmentAdapter.doc = doc;
        options.deltaAdapter.fragmentadapter = options.treeFragmentAdapter;
    }

    showFile('patch file', delta, doc, options.deltaPayloadHandler,
            options.deltaAdapter);

    /*
    saveFile('patch file', options.patchfile, options.patchenc, delta, doc,
            options.deltaPayloadHandler, options.deltaAdapter);
            */
}

main();
