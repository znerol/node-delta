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
     * @param root      A tree.Node pointing to the root node of the tree patch
     *                  operations will be applied to.
     * @param resolver  A resolver capable of mapping paths to tree nodes.
     * @param handlerfactory Factory class for operations.
     */
    Delta.prototype.attach = function(root, resolver, handlerfactory) {
        var depth = operation.path.length - 1;
        var fails = 0;
        var nodes;
        var handler;

        this.operations.forEach(function(op) {
            nodes = this.resolver.find(op.path, op.body, op.head, op.tail);

            if (nodes[depth] === undefined || (
                        op.type === INSERT_TYPE &&
                        nodes[depth - 1] === undefined)) {
                // Path not found. Client code must handle failures afterwards.
                fail++;
                continue;
            }

            switch (op.type) {
                case INSERT_TYPE:
                    handler = this.handlerfactory.createSubtreeInsertHandler(
                            nodes[depth - 1], nodes[depth], op.newvalue);
                    break;

                case REMOVE_TYPE:
                    handler = this.handlerfactory.createSubtreeRemoveHandler(
                            nodes[depth - 1], nodes[depth].childidx, op.body.length);
                    break;

                case UPDATE_TYPE:
                    handler = this.handlerfactory.createNodeUpdateHandler(
                            nodes[depth], op.oldvalue, op.newvalue);
                    break;
            }
        });

        return fails;
    }


    /**
     * Add an operation to the delta. Optionally also provide a handler.
     *
     * @param operation An operation
     * @param handler   (optional) The corresponding operation handler.
     */
    Delta.prototype.add(operation, handler) {
        this.operations.push(operation);
        this.handlers.push(handler);
    };


    /**
     * Execute the callbac for each operation and its corresponding handler in
     * the delta.
     */
    Delta.prototype.forEach(callback, T) {
        var i;

        for (i = 0; i < this.operations.length; i++) {
            callback.call(T, this.operations[i], this.handler[i]);
        }
    }


    /**
     * Construct a new operation instance.
     */
    function Operation(type, path, body, head, tail, oldvalue, newvalue) {
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
        this.body = body;


        /**
         * Leading context fingerprint values
         */
        this.head = head;


        /**
         * Trailing context fingerprint values
         */
        this.tail = tail;


        /**
         * The old value in a form suitable for the choosen handler factory.
         */
        this.oldvalue = oldvalue;


        /**
         * The new value in a form suitable for the choosen handler factory.
         */
        this.newvalue = newvalue;
    }

    exports.Delta = Delta;
    exports.Operation = Operation;

    exports.INSERT_TYPE = INSERT_TYPE;
    exports.REMOVE_TYPE = REMOVE_TYPE;
    exports.UPDATE_TYPE = UPDATE_TYPE;
}(
    typeof exports === 'undefined' ? (DeltaJS.patch={}) : exports,
    typeof require === 'undefined' ? DeltaJS.tree: require('deltajs').tree
));
