#!/usr/bin/env node

var optparse = require('optparse');
var sys = require('sys');
var fs  = require('fs');
var path = require('path');
var mime = require('mime');
var diff = require('../lib/delta/diff');



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
function showFile(description, doc, payloadhandler) {
    var buf;
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
 * Return proper input profile
 */
function getInputProfile(type) {
    var result;
    switch(type) {
        case 'json':
            result = require('../lib/profiles/input-json-tree');
            break;
        case 'xml':
            result = require('../lib/profiles/input-xml-tree');
            break;
    }

    return result;
}


/**
 * Return proper document profile
 */
function getDocumentProfile(type) {
    var result;
    switch(type) {
        case 'json':
            result = require('../lib/profiles/doc-json-tree');
            break;
        case 'xml':
            result = require('../lib/profiles/doc-xml-tree');
            break;
    }

    return result;
}


/**
 * Return proper delta profile
 */
function getDeltaProfile(type) {
    var result;
    switch(type) {
        case 'json':
            result = require('../lib/profiles/output-json-delta.js');
            break;
        case 'xml':
            result = require('../lib/profiles/output-xml-delta.js');
            break;
    }

    return result;
}


/**
 * Setup diff options for given payload type
 */
function createXccOptions(type) {
    var result;

    function rejectUpdateOnXMLElementContainingSingleTextNode(node) {
        var result = false;
        var domnode = node.data;

        if (domnode.childNodes.length === 1 &&
                domnode.firstChild.nodeType === domnode.TEXT_NODE) {
            result = true;
        }

        return result;
    }

    switch (type) {
        case 'xml':
            result = {
                'ludRejectCallbacks': [
                    rejectUpdateOnXMLElementContainingSingleTextNode
                ],
                'detectLeafUpdates': true
            };
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
        'filetype': undefined,
        'patchfile': undefined,
        'patchenc': 'UTF-8',
        'patchtype': 'xml',
        'debug': false,
        'xmldocopt': false
    }

    var switches = [
        ['-h', '--help',    'Show this help'],
        ['-p', '--payload STRING', 'Specify payload type (xml or json, default: detect)'],
        ['-x', '--xml',     'Use XML patch format (default)'],
        ['-j', '--json',    'Use JSON patch format'],
        ['--xmldocopt',     'Enable optimization for XML documents. Treat elements containing exactly one text node as a single unit.'],
        ['-d', '--debug',   'Log actions to console']
        ];

    var parser = new optparse.OptionParser(switches);
    parser.banner = 'Usage: djdiff [options] FILE1 FILE2';

    parser.on('help', function(name, value) {
        sys.puts(parser.toString());
    });

    parser.on('payload', function(name, value) {
        options.filetype=value;
    });

    parser.on('xml', function(name, value) {
        options.patchtype='xml';
    });

    parser.on('json', function(name, value) {
        options.patchtype='json';
    });

    parser.on('debug', function(name, value) {
        console.warn('debug enabled');
        options.debug=true;
    });

    parser.on('xmldocopt', function(name, value) {
        options.xmldocopt = true;
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
    var documentMimetype, documentPayloadType, documentProfile, deltaProfile;

    if (!options.filetype) {
        documentMimetype = checkfile('original file', options.origfile,
                documentMimetype);
        documentMimetype = checkfile('changed file', options.changedfile,
                documentMimetype);

        // Setup document payload handler and tree adapter
        documentPayloadType = getPayloadType(documentMimetype);
        if (!documentPayloadType) {
            console.error('This file type is not supported by djdiff');
        }
    }
    else {
        documentPayloadType = options.filetype;
    }

    documentProfile = getDocumentProfile(documentPayloadType);
    if (!documentProfile) {
        console.error('The file type "'+ documentPayloadType +'" is not supported by djdiff');
    }

    // Setup delta payload handler
    deltaProfile = getDeltaProfile(options.patchtype);
    if (!deltaProfile) {
        console.error('This delta type is not supported by djdiff');
    }

    // Run diff
    var doc1 = documentProfile.createOriginalDocument(
        documentProfile.payloadHandler.parseString(fs.readFileSync(options.origfile, options.origenc)),
        options.origfile)
    var doc2 = documentProfile.createInputDocument(
        documentProfile.payloadHandler.parseString(fs.readFileSync(options.changedfile, options.changedenc)),
        options.changedfile)

    var diffProfile = require('../lib/profiles/diff-bonematch');
    var d = new diff.Diff(diffProfile, documentProfile, deltaProfile);
    var delta = d.diff(doc1, doc2);

    // Serialize delta
    var doc = deltaProfile.createOutputDocument(delta, documentProfile);

    showFile('patch file', doc, deltaProfile.payloadHandler);

    /*
    saveFile('patch file', options.patchfile, options.patchenc, delta, doc,
            deltaProfile.payloadHandler, deltaAdapter);
            */
}

main();
