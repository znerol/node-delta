#!/usr/bin/env node

var optparse = require('optparse');
var fs  = require('fs');
var profiles = require('../lib/profiles');

function indent(level, s) {
    var i, result = '';
    s = s || '    ';
    for (i = 0; i < level; i++) {
        result += s;
    }
    return result;
}

function fill(line, pos, s) {
    var i, result;
    s = s || ' ';
    result = line + s;
    while(result.length < pos) {
        result += s;
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
    }

    var switches = [];

    var parser = new optparse.OptionParser(switches);
    parser.banner = 'Usage: djhash [options] FILE';

    parser.on('help', function(name, value) {
        console.log(parser.toString());
    });

    parser.on(2, function(value) {
        options.origfile=value
    });

    parser.parse(process.argv);

    // Setup input profile
    var documentProfile = profiles.getDocumentProfile('xml');

    // Read input files
    var doc = documentProfile.loadOriginalDocument(
            fs.readFileSync(options.origfile, options.origenc),
            options.origfile);

    var i = 0, node, line;
    while ((node = doc.nodeindex.get(doc.tree, i))) {
        line = indent(node.depth) + ' ' + node.value;

        line = fill(line, 40);
        line += doc.valueindex.get(node).toString(16);
        line += " " + doc.treevalueindex.get(node).toString(16);
        console.log(line);
        i++;
    }
}

main();
