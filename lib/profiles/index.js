/**
 * Return the payload type for a given mimetype.
 */
exports.getPayloadType = function(mimetype) {
    if (mimetype === 'application/json') {
        return 'json';
    }
    else if (mimetype === 'application/xml' || mimetype.slice(-4) === '+xml') {
        return 'xml';
    }
}


/**
 * Return proper diff profile
 */
exports.getDiffProfile = function(type) {
    var result;
    switch(type) {
        case 'bonematch':
            result = require('./diff-bonematch');
            break;
        case 'xcc':
            result = require('./diff-xcc');
            break;
    }

    return result;
}


/**
 * Return proper resolver profile
 */
exports.getResolverProfile = function() {
    return require('./patch-default');
}


/**
 * Return proper document profile
 */
exports.getDocumentProfile = function(type) {
    var result;
    switch(type) {
        case 'json':
            result = require('./doc-json-tree');
            break;
        case 'xml':
            result = require('./doc-xml-tree');
            break;
    }

    return result;
}


/**
 * Return proper delta profile
 */
exports.getDeltaProfile = function(type) {
    var result;
    switch(type) {
        case 'json':
            result = require('./output-json-delta.js');
            break;
        case 'xml':
            result = require('./output-xml-delta.js');
            break;
    }

    return result;
}

