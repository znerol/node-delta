#!/usr/bin/env node

var optparse = require('optparse');
var sys = require('sys');
var fs  = require('fs');
var path = require('path');
var mime = require('mime');
var patch = require('../lib/delta/patch');
var profiles = require('../lib/profiles');
var cmdutils = require('../lib/extra/cmdutils.js');

var checkfile = cmdutils.checkfile;

/**
 * Parse options and command line arguments and initialize the diff algorithm
 */
function main() {
    var options = {
        'origfile': undefined,
        'origenc': 'UTF-8',
//        'changedfile': undefined,
//        'changedenc': 'UTF-8',
        'filetype': undefined,
        'patchfile': undefined,
        'patchenc': 'UTF-8',
        'radius': 6,
        'threshold': 0.7,
    }

    var switches = [
        ['-h', '--help',            'Show this help'],
        ['-p', '--payload STRING', 'Specify payload type (xml or json, default: detect)'],
        ['-r', '--radius NUMBER',   'Search radius for fuzzy matching (default: 6)'],
        ['-t', '--threshold NUMBER','Threshold value for fuzzy matching (default: 0.7)'],
//        ['-o', '--output FILE',     'Write output to file path'],
        ['-d', '--debug',           'Log actions to console'],
        ];

    var parser = new optparse.OptionParser(switches);
    parser.banner = 'Usage: djdiff [options] FILE PATCH';

    parser.on('help', function(name, value) {
        sys.puts(parser.toString());
    });

    parser.on('payload', function(name, value) {
        options.filetype=value;
    });

    parser.on('radius', function(name, value) {
        options.radius=value;
    });

    parser.on('threshold', function(name, value) {
        options.threshold=value;
    });

//    parser.on('output', function(name, value) {
//        options.changedfile=value
//    });

    parser.on(2, function(value) {
        options.origfile=value
    });

    parser.on(3, function(value) {
        options.patchfile=value
    });

    parser.parse(process.argv);


    // Check input files
    var documentMimetype, patchMimetype, documentPayloadType, patchPayloadType,
        resolverProfile, documentProfile, deltaProfile;

    if (!options.filetype) {
        documentMimetype = checkfile('original file', options.origfile);

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

    patchMimetype = checkfile('patch file', options.patchfile);
    patchPayloadType = profiles.getPayloadType(patchMimetype);


    // Setup algorithm profile
    resolverProfile = profiles.getResolverProfile();
    if (!resolverProfile) {
        console.error('The specified patch algorithm is not supported');
        process.exit(1);
    }

    // Setup input profile
    documentProfile = profiles.getDocumentProfile(documentPayloadType);
    if (!documentProfile) {
        console.error('The file type "' + documentPayloadType + '" is not supported by djdiff');
        process.exit(1);
    }

    // Setup delta profile
    deltaProfile = profiles.getDeltaProfile(patchPayloadType);
    if (!deltaProfile) {
        console.error('The patch type "' + patchPayloadType + '" is not supported by djdiff');
        process.exit(1);
    }

    // Read input files
    var doc = documentProfile.loadOriginalDocument(
            fs.readFileSync(options.origfile, options.origenc),
            options.origfile);
    var fragadapter = documentProfile.createFragmentAdapter(patchPayloadType);
    var deltadoc = deltaProfile.loadDocument(
            fs.readFileSync(options.patchfile, options.patchenc),
            fragadapter, options.patchfile);

    var p = new patch.Patch(resolverProfile, documentProfile, deltaProfile);
    p.patch(doc, deltadoc);

    // Serialize tree
    sys.puts(documentProfile.serializeDocument(doc));
}

main();
