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
        case 'skelmatch':
            result = require('./algo-diff-skelmatch');
            break;
        case 'xcc':
            result = require('./algo-diff-xcc');
            break;
    }

    return result;
}


/**
 * Return proper resolver profile
 */
exports.getResolverProfile = function() {
    return require('./algo-resolve-xcc');
}


/**
 * Return proper document profile
 */
exports.getDocumentProfile = function(type) {
    var result;
    switch(type) {
        case 'json':
            result = require('./doc-tree-json');
            break;
        case 'xml':
            result = require('./doc-tree-xml');
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
            result = require('./delta-tree-json');
            break;
        case 'xml':
            result = require('./delta-tree-xml');
            break;
    }

    return result;
}

