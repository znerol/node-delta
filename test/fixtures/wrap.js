fs = require('fs');
sys = require('sys');
sys.puts('module.exports=' + JSON.stringify(
            fs.readFileSync(process.argv[2]).toString()));
