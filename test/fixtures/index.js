var fs = require('fs');
var findit = require('findit');

findit.sync(__dirname, function(file, stat) {
    var name;

    if (stat.isFile()) {
        name = file.substr(__dirname.length + 1);
        exports[name] = fs.readFileSync(file, 'UTF-8');
    }
});
