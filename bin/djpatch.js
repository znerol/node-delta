#!/usr/bin/env node

var optparse = require('optparse');
var sys = require('sys');
var fs  = require('fs');
var path = require('path');
var mime = require('mime');
var deltajs = require('../lib/main');


/**
 * Ensure that the filepath is accessible and check its mime type.
 */
function checkfile(description, filepath, wantmime) {
    var filemime;

    if (!filepath || !path.existsSync(filepath)) {
        console.error('Path to ' + description + ' missing. Use the -h switch for help.');
        process.exit(1);
    }

    filemime = mime.lookup(filepath);
    if (wantmime && filemime !== wantmime) {
        console.error(description + ' is of the wrong type');
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
function createValueIndex(type) {
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
 * Return proper operation handler factory for payload type.
 */
function createHandlerFactory(type) {
    var result;

    switch (type) {
        case 'xml':
            result = new deltajs.domdelta.DOMOperationHandlerFactory();
            break;
        case 'json':
            // no index
            console.error('JSON patch handler factory for not implemented yet');
            sys.exit(1);
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
        'radius': 6,
        'threshold': 0.7,
    }

    var switches = [
        ['-h', '--help',            'Show this help'],
        ['-r', '--radius NUMBER',   'Search radius for fuzzy matching (default: 6)'],
        ['-t', '--threshold NUMBER','Threshold value for fuzzy matching (default: 0.7)'],
        ['-o', '--output FILE',     'Write output to file path'],
        ['-d', '--debug',           'Log actions to console'],
        ];

    var parser = new optparse.OptionParser(switches);
    parser.banner = 'Usage: djdiff [options] FILE PATCH';

    parser.on('help', function(name, value) {
        sys.puts(parser.toString());
    });

    parser.on('radius', function(name, value) {
        options.radius=value;
    });

    parser.on('threshold', function(name, value) {
        options.threshold=value;
    });

    parser.on('output', function(name, value) {
        options.changedfile=value
    });

    parser.on(2, function(value) {
        options.origfile=value
    });

    parser.on(3, function(value) {
        options.patchfile=value
    });

    parser.parse(process.ARGV);


    // Check input files
    var documentMimetype, documentPayloadType, documentPayloadHandler,
        documentTreeAdapter;

    documentMimetype = checkfile('original file', options.origfile,
            documentMimetype);

    // Setup document payload handler and tree adapter
    documentPayloadType = getPayloadType(documentMimetype);
    if (!documentPayloadType) {
        console.error('This file type is not supported by djdiff');
    }

    documentPayloadHandler = createPayloadHandler(documentPayloadType);
    if (!documentPayloadHandler) {
        console.error('This file type is not supported by djdiff');
    }

    documentTreeAdapter = createTreeAdapter(documentPayloadType);


    // Check patch file
    var patchMimetype, patchPayloadType, patchPayloadHandler, patchAdapter;
    patchMimetype = checkfile('patch file', options.patchfile);


    // Setup patch payload handler and tree adapter
    patchPayloadType = getPayloadType(patchMimetype);
    if (!patchPayloadType) {
        console.error('This patch type is not supported by djdiff');
    }

    patchPayloadHandler = createPayloadHandler(patchPayloadType);
    if (!patchPayloadHandler) {
        console.error('This patch type is not supported by djdiff');
    }


    // Read input
    var data, doc, tree;
    data = fs.readFileSync(options.origfile, options.origenc);
    doc = documentPayloadHandler.parseString(data);
    tree = documentTreeAdapter.adaptDocument(doc);

    nodevalidx = createValueIndex(documentPayloadType);
    treevalidx = new deltajs.tree.TreeHashIndex(
            new deltajs.tree.SimpleTreeHash(deltajs.fnv132.Hash, nodevalidx));

    // Read patchfile
    var patch, fragadapter, deltaAdapter;
    fragadapter = documentPayloadHandler.createTreeFragmentAdapter(doc,
            documentTreeAdapter, patchPayloadType);
    deltaAdapter = createDeltaAdapter(patchPayloadType, fragadapter);

    patch = loadFile('patch file', options.patchfile, options.patchenc,
            patchPayloadHandler, deltaAdapter);

    // Resolve operations
    a_index = new deltajs.tree.DocumentOrderIndex(tree);
    a_index.buildAll();

    var resolver = new deltajs.resolver.ContextResolver(tree, a_index,
            options.radius, options.threshold);

    resolver.equalContent = function(docnode, patchnode, type) {
        if (type === deltamod.UPDATE_FOREST_TYPE) {
            return treevalidx.get(docnode) === treevalidx.get(patchnode);
        }
        else if (type === deltamod.UPDATE_NODE_TYPE) {
            return nodevalidx.get(docnode) === nodevalidx.get(patchnode);
        }
        else {
            throw new Error('Got unknown operation type in equalContent cb: ' + type);
        }
    }

    resolver.equalContext = function(docnode, value) {
        return nodevalidx.get(docnode) === value;
    }

    var handlerfactory = createHandlerFactory(documentPayloadType);
    var fails = patch.attach(resolver, handlerfactory);

    // Apply patch
    patch.forEach(function(op, handler) {
        if (handler) {
            handler.toggle();
        }
        else {
            console.error('failed to resolve hunk');
        }
    });

    // Serialize tree
    var buf = documentPayloadHandler.serializeToString(doc);
    sys.puts(buf);
}

main();
