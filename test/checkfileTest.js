var checkfile = require('../lib/extra/cmdutils').checkfile;

exports['works fine when file exists and valid mimetype'] = function(test) {
    var filepath = 'test/fixtures/logo-1.svg';
    var mimetype = 'image/svg+xml';
    var returned = checkfile('file.ext', filepath, mimetype, function(msg){
        test.ok(false, "Error callback not supposed to be called");
    });
    test.equal(mimetype, returned);
    test.done();
};

exports['works fine when file exists and no mimetype'] = function(test) {
    var filepath = 'test/fixtures/logo-1.svg';
    var returned = checkfile('file.ext', filepath, undefined, function(msg){
        test.ok(false, "Error callback not supposed to be called");
    });
    test.equal('image/svg+xml', returned);
    test.done();
};

exports['calls error callback when file does not exist'] = function(test) {
    var yield = false;
    var filepath = 'no/such/file.xml';
    checkfile('file.ext', filepath, undefined, function(msg){
        test.equals("Path to file.ext missing. Use the -h switch for help.", msg);
        yield = true
    });
    test.ok(yield, "error callback yield");
    test.done();
};

exports['calls error callback when wrong mime type'] = function(test) {
    var yield = false;
    var filepath = 'test/fixtures/logo-1.svg';
    var mimetype = 'wrong/mime';
    checkfile('file.ext', filepath, mimetype, function(msg){
        test.equals("file.ext is of the wrong type (image/svg+xml vs. wrong/mime)", msg);
        yield = true
    });
    test.ok(yield, "error callback yield");
    test.done();
};

