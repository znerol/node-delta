var fs  = require('fs');
var mime = require('mime');

exports.checkfile = checkfile;

/**
 * Ensure that the filepath is accessible and check its mime type.
 *
 * The callback `onError` is yield with an error message if a check fails.
 * Default callback logs the message and exits the process.
 *
 * @param  {string}    description  file description to use in error messages
 * @param  {string}    filepath     path to the file to check
 * @param  {string}    wantmime     optional, expected mime
 * @param  {function}  onError      optional, callback called when a check fails
 * @return {string} file's detected mime type when the file exists.
 */
function checkfile(description, filepath, wantmime, onError) {
    var filemime;

    if (onError === undefined) {
        onError = function(msg){
            console.error(msg);
            process.exit(1);
        };
    }

    if (!filepath || !fs.existsSync(filepath)) {
        return onError('Path to ' + description + ' missing. Use the -h switch for help.');
    }

    filemime = mime.getType(filepath);
    if (wantmime && filemime !== wantmime) {
        return onError(description + ' is of the wrong type (' + filemime + ' vs. ' + wantmime + ')');
    }

    return filemime;
}
