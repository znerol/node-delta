/**
 * @file:   Resolver class capable of identifying nodes in a given tree by
 *          pattern matching.
 *
 * @see:    * Sebastian Rönnau, Christian Pauli, and Uwe M. Borghoff. Merging
 *            changes in XML documents using reliable context fingerprints:
 *            http://dx.doi.org/10.1145/1410140.1410151
 *          * Original Sourcecode:
 *            https://launchpad.net/xcc
 */

(function(exports, tree) {
    var INSERT_TYPE = 1;
    var REMOVE_TYPE = 2;
    var UPDATE_TYPE = 3;


    /**
     * Create new patch instance.
     */
    function Delta() {
        this.operations = [];
        this.handlers = [];
    }


    /**
     * Apply the delta to a tree using the specified resolver to identify the
     * locations and the handler factory to instantiate operation handlers.
     *
     * @param resolver  A resolver capable of mapping paths to tree nodes.
     * @param handlerfactory Factory class for operations.
     */
    Delta.prototype.attach = function(resolver, handlerfactory) {
        var fails = 0, depth, nodes, handler, op, i, n;

        for (i = 0; i < this.operations.length; i++) {
            op = this.operations[i];
            nodes = resolver.find(op.path, op.body, op.head, op.tail);

            if (nodes[depth] === undefined || (
                        op.type === INSERT_TYPE &&
                        nodes[depth - 1] === undefined)) {
                // Path not found. Client code must handle failures afterwards.
                fail++;
                continue;
            }

            switch (op.type) {
                case INSERT_TYPE:
                    handler = handlerfactory.createSubtreeInsertHandler(
                            nodes[depth - 1], nodes[depth], op.newvalue);
                    break;

                case REMOVE_TYPE:
                    handler = handlerfactory.createSubtreeRemoveHandler(
                            nodes[depth - 1], nodes[depth].childidx,
                            op.body.length);
                    break;

                case UPDATE_TYPE:
                    handler = handlerfactory.createNodeUpdateHandler(
                            nodes[depth], op.oldvalue, op.newvalue);
                    break;
            }
        }

        return fails;
    }


    /**
     * Add an operation to the delta. Optionally also provide a handler.
     *
     * @param operation An operation
     * @param handler   (optional) The corresponding operation handler.
     */
    Delta.prototype.add = function(operation, handler) {
        this.operations.push(operation);
        this.handlers.push(handler);
    };


    /**
     * Execute the callbac for each operation and its corresponding handler in
     * the delta.
     */
    Delta.prototype.forEach = function(callback, T) {
        var i;

        for (i = 0; i < this.operations.length; i++) {
            callback.call(T, this.operations[i], this.handler[i]);
        }
    };


    /**
     * Construct a new operation instance.
     */
    function Operation(type, path, fingerprint, oldvalue, newvalue) {
        /**
         * The operation type, one of INSERT_TYPE, REMOVE_TYPE, UPDATE_TYPE
         */
        this.type = type;


        /**
         * An array of integers representing the top-down path from the root
         * node to the anchor of this operation. The anchor point always is
         * the first position after the leading context values. For insert
         * operations it will must point to the first element of the tail
         * context.
         */
        this.path = path;


        /**
         * Fingerprint values for the content. For insert operations, this
         * array should be empty. For remove-operations, the array should
         * contain the fingerprint values of the nodes which should be removed,
         * for update operations, the only element should be the fingerprint
         * value of the original node.
         */
        this.fingerprint = fingerprint;


        /**
         * Null (insert), one tree.Node (update) or sequence of nodes (delete)
         */
        this.oldvalue = oldvalue;


        /**
         * Null (remove), one tree.Node (update) or sequence of nodes (insert)
         */
        this.newvalue = newvalue;
    }


    function FingerprintFactory(index, radius, nodehash, treehash) {
        this.r = radius;
        this.index = index;
        this.nodehash = nodehash || function(n) {return n && n.value;};
        this.treehash = treehash || function(n) {return n && n.value;};
    }


    /**
     * Return a fingerprint around the anchor node.
     */
    FingerprintFactory.prototype.fingerprint = function(anchor, length) {
        var i, n, fp = {
            'body':[],
            'head':[],
            'tail':[]
        };

        if (length == null) {
            length = 1;
        }

        i = -this.r;
        while (i < 0) {
            n = this.index.get(anchor, i++);
            fp.head.push(this.nodehash(n));
        }

        while (i < length) {
            n = this.index.get(anchor, i++);
            fp.body.push(this.treehash(n));
        }

        while (i < length + this.r) {
            n = this.index.get(anchor, i++);
            fp.tail.push(this.nodehash(n));
        }

        return fp;
    }


    function Editor(delta, fpfactory) {
        this.delta = delta;
        this.fpfactory = fpfactory;
    }


    Editor.prototype.update = function(path, a, b) {
        var fp = this.fpfactory.fingerprint(a);
        var op = new Operation(UPDATE_TYPE, path, fp, [a], [b]);
        this.delta.add(op);
    }


    Editor.prototype.insert = function(path, b_nodes) {
        var fp = this.fpfactory.fingerprint(b_nodes[0], b_nodes.length);
        var op = new Operation(INSERT_TYPE, path, fp, null, b_nodes);
        this.delta.add(op);
    }


    Editor.prototype.remove = function(path, a_nodes) {
        var fp = this.fpfactory.fingerprint(a_nodes[0], a_nodes.length);
        var op = new Operation(REMOVE_TYPE, path, fp, a_nodes, null);
        this.delta.add(op);
    }


    exports.Delta = Delta;
    exports.Operation = Operation;
    exports.Editor = Editor;
    exports.FingerprintFactory = FingerprintFactory;

    exports.INSERT_TYPE = INSERT_TYPE;
    exports.REMOVE_TYPE = REMOVE_TYPE;
    exports.UPDATE_TYPE = UPDATE_TYPE;
}(
    typeof exports === 'undefined' ? (DeltaJS.patch={}) : exports,
    typeof require === 'undefined' ? DeltaJS.tree: require('./tree.js')
));
