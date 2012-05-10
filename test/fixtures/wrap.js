fs = require('fs');
util = require('util');
util.puts('module.exports=' + JSON.stringify(
            fs.readFileSync(process.argv[2]).toString()));
