var tree = require('../lib/delta/tree');

//     ------------ a ------------
//   /            /        \       \
//  a1          a2          a3      a4
//  |         /  |  \       |       |
//  a11    a21  a22  a23    a31     a41
//              / \         |
//          a221   a222     a311


var a       = new tree.Node('a'     );
var a1      = new tree.Node('a1'    );
var a11     = new tree.Node('a11'   );
var a2      = new tree.Node('a2'    );
var a21     = new tree.Node('a21'   );
var a22     = new tree.Node('a22'   );
var a221    = new tree.Node('a221'  );
var a222    = new tree.Node('a222'  );
var a23     = new tree.Node('a23'   );
var a3      = new tree.Node('a3'    );
var a31     = new tree.Node('a31'   );
var a311    = new tree.Node('a311'  );
var a4      = new tree.Node('a4'    );
var a41     = new tree.Node('a41'   );

a.append(a1);
a1.append(a11);
a.append(a2);
a2.append(a21);
a2.append(a22);
a22.append(a221);
a22.append(a222);
a2.append(a23);
a.append(a3);
a3.append(a31);
a31.append(a311);
a.append(a4);
a4.append(a41);

var nodeindex = new tree.DocumentOrderIndex(a);
nodeindex.buildAll();

function NodeValueHashGenerator() {
    this.process = function(node) {
        return node.value;
    }
}

function ConcatHash() {
    var data;
    this.update = function(str) {
        data = data ? data + '\x00' : '';
        data += str;

        return data;
    }
    this.get = function() {
        return data;
    }
}

exports['node hash index should return correct value'] = function(test) {
    var nh = new tree.NodeHashIndex(new NodeValueHashGenerator());
    test.deepEqual(nh.get(a), 'a');
    test.deepEqual(nh.get(a1), 'a1');
    test.deepEqual(nh.get(a2), 'a2');

    test.deepEqual(nh.get(a), 'a');
    test.deepEqual(nh.get(a1), 'a1');
    test.deepEqual(nh.get(a2), 'a2');

    test.done();
};

exports['tree hash index should return correct value'] = function(test) {
    var nh = new tree.NodeHashIndex(new NodeValueHashGenerator());
    var th = new tree.TreeHashIndex(new tree.SimpleTreeHash(ConcatHash, nh));

    test.deepEqual(th.get(a11), 'a11');
    test.deepEqual(th.get(a1), 'a1\x00a11');
    test.deepEqual(th.get(a), 'a\x00a1\x00a11' +
            '\x00a2\x00a21\x00a22\x00a221\x00a222\x00a23' +
            '\x00a3\x00a31\x00a311' +
            '\x00a4\x00a41');

    test.deepEqual(th.get(a11), 'a11');
    test.deepEqual(th.get(a1), 'a1\x00a11');
    test.deepEqual(th.get(a), 'a\x00a1\x00a11' +
            '\x00a2\x00a21\x00a22\x00a221\x00a222\x00a23' +
            '\x00a3\x00a31\x00a311' +
            '\x00a4\x00a41');

    test.done();
}
