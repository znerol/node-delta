#!/usr/bin/env node

var optparse = require('optparse');
var fs  = require('fs');
var path = require('path');
var mime = require('mime');
var diff = require('../lib/delta/diff');
var profiles = require('../lib/profiles');
var cmdutils = require('../lib/extra/cmdutils.js');

var checkfile = cmdutils.checkfile;

/**
 * Parse options and command line arguments and initialize the diff algorithm
 */
function main() {
    var options = {
        'algo': 'skelmatch',
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
        ['-g', '--algo STRING', 'Specify algorithm (skelmatch or xcc, default: skelmatch)'],
        ['-x', '--xml',     'Use XML patch format (default)'],
        ['-j', '--json',    'Use JSON patch format'],
//        ['--xmldocopt',     'Enable optimization for XML documents. Treat elements containing exactly one text node as a single unit.'],
        ['-d', '--debug',   'Log actions to console']
        ];

    var parser = new optparse.OptionParser(switches);
    parser.banner = 'Usage: djdiff [options] FILE1 FILE2';

    parser.on('help', function(name, value) {
        console.log(parser.toString());
    });

    parser.on('payload', function(name, value) {
        options.filetype=value;
    });

    parser.on('algo', function(name, value) {
        options.algo=value;
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

//    parser.on('xmldocopt', function(name, value) {
//        options.xmldocopt = true;
//    });

    parser.on(2, function(value) {
        options.origfile=value
    });

    parser.on(3, function(value) {
        options.changedfile=value
    });

    parser.on(4, function(value) {
        options.patchfile=value
    });

    parser.parse(process.argv);


    // Check input files
    var documentMimetype, documentPayloadType, diffProfile, documentProfile,
        deltaProfile;

    if (!options.filetype) {
        documentMimetype = checkfile('original file', options.origfile,
                documentMimetype);
        documentMimetype = checkfile('changed file', options.changedfile,
                documentMimetype);

        // Setup document payload handler and tree adapter
        documentPayloadType = profiles.getPayloadType(documentMimetype);
        if (!documentPayloadType) {
            console.error('This file type is not supported by djdiff');
            process.exit(1);
        }
    }
    else {
        documentPayloadType = options.filetype;
    }

    // Setup algorithm profile
    diffProfile = profiles.getDiffProfile(options.algo);
    if (!diffProfile) {
        console.error('The specified algorithm is not supported');
        process.exit(1);
    }

    // Setup input profile
    documentProfile = profiles.getDocumentProfile(documentPayloadType);
    if (!documentProfile) {
        console.error('The file type "' + documentPayloadType + '" is not supported by djdiff');
        process.exit(1);
    }

    // Setup delta profile
    deltaProfile = profiles.getDeltaProfile(options.patchtype);
    if (!deltaProfile) {
        console.error('The patch type "' + options.patchtype + '" is not supported by djdiff');
        process.exit(1);
    }

    // Read input files
    var doc1 = documentProfile.loadOriginalDocument(
            fs.readFileSync(options.origfile, options.origenc),
            options.origfile);
    var doc2 = documentProfile.loadInputDocument(
            fs.readFileSync(options.changedfile, options.changedenc),
            options.changedfile);

    // Run diff
    var d = new diff.Diff(diffProfile, documentProfile, deltaProfile);
    var deltadoc = d.diff(doc1, doc2);

    // Write result to stdout
    console.log(deltaProfile.serializeDocument(deltadoc));
}

main();
