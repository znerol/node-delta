var connect = require('connect');
var fs = require('fs');
var port = 3000;
var dir = __dirname;
var server;

dir = process.argv[2] || dir;
port = process.argv[3] || Number(port);

try {
    if (!fs.statSync(dir).isDirectory()) {
        console.log('The supplied path is not a directory');
        process.exit(1);
    }
}
catch (e){
        console.log('The supplied path does not exist');
        process.exit(1);
}

server = connect.createServer(
        connect.favicon(),
        connect.logger(),
        connect.static(dir)
        );
server.listen(port);
console.log('Serving on localhost:' + port);
console.log('Basedir: ' + dir);
