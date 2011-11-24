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
function createDeltaAdapter(type, fragadapter) {
    var result;

    switch (type) {
        case 'json':
            result = new deltajs.jsondelta.JSONDeltaAdapter(fragadapter);
            break;
        case 'xml':
            result = new deltajs.domdelta.DOMDeltaAdapter(fragadapter);
            break;
    }

    return result;
}

/**
 * Return proper tree value index for payload type.
 */
function createValueIndex(type, tree1, tree2) {
    var result;

    switch (type) {
        case 'xml':
            result = new deltajs.tree.NodeHashIndex(
                    new deltajs.domtree.DOMNodeHash(deltajs.fnv132.Hash));
            break;
        case 'json':
            // no index
            break;
    }

    return result;
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
        'patchfile': undefined,
        'patchenc': 'UTF-8',
        'patchtype': 'xml'
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
        options.patchtype='xml';
    });

    parser.on('json', function(name, value) {
        options.patchtype='json';
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


    // Check input files
    var documentMimetype, documentPayloadType, documentPayloadHandler,
        documentTreeAdapter;

    documentMimetype = checkfile('original file', options.origfile,
            documentMimetype);
    documentMimetype = checkfile('changed file', options.changedfile,
            documentMimetype);


    // Setup document payload handler and tree adapter
    documentPayloadType = getPayloadType(documentMimetype);
    if (!documentPayloadType) {
        console.log('This file type is not supported by djdiff');
    }

    documentPayloadHandler = createPayloadHandler(documentPayloadType);
    if (!documentPayloadHandler) {
        console.log('This file type is not supported by djdiff');
    }

    documentTreeAdapter = createTreeAdapter(documentPayloadType);


    // Setup delta payload handler
    var deltaPayloadHandler = createPayloadHandler(options.patchtype);
    if (!deltaPayloadHandler) {
        console.log('This delta type is not supported by djdiff');
    }


    // Match trees
    var tree1, tree2, valindex, diff, matching;
    tree1 = loadFile('original file', options.origfile, options.origenc,
            documentPayloadHandler, documentTreeAdapter);
    tree2 = loadFile('changed file', options.changedfile, options.changedenc,
            documentPayloadHandler, documentTreeAdapter);

    valindex = createValueIndex(documentPayloadType, tree1, tree2);

    matching = new deltajs.tree.Matching();
    diff = new deltajs.xcc.Diff(tree1, tree2);

    if (valindex) {
        diff.equals = function(a, b) {
            return valindex.get(a) === valindex.get(b);
        };
    }

    diff.matchTrees(matching);


    // Construct delta
    var delta, a_index, contextgen, updater;
    delta = new deltajs.delta.Delta();
    a_index = new deltajs.tree.DocumentOrderIndex(tree1);
    a_index.buildAll();

    contextgen = new deltajs.delta.ContextGenerator(4, a_index, valindex);
    updater = diff.createUpdater(matching);
    delta.collect(tree1, matching, contextgen, updater);


    // Serialize delta
    var doc = deltaPayloadHandler.createDocument();
    var fragadapter = documentPayloadHandler.createTreeFragmentAdapter(doc,
            documentTreeAdapter, options.patchtype);
    deltaAdapter = createDeltaAdapter(options.patchtype, fragadapter);

    showFile('patch file', delta, doc, deltaPayloadHandler, deltaAdapter);

    /*
    saveFile('patch file', options.patchfile, options.patchenc, delta, doc,
            deltaPayloadHandler, deltaAdapter);
            */
}

main();
