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

var tree = require('./tree.js');

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
    var fails = 0; 

    this.operations.forEach(function(op, i) {
        var nodes, depth, handler;

        // Resolve anchor node
        nodes = resolver.find(op.path, op.oldvalue, op.head, op.tail);

        // Check if we can accept the resolved location depending on the
        // operation type
        depth = op.path.length;
        if (!nodes || nodes[depth] === undefined || (
                op.type === INSERT_TYPE &&
                nodes[depth - 1] === undefined)) {
            // Path not found. Client code must handle failures afterwards.
            fails++;
            return;
        }

        handler = undefined;
        switch (op.type) {
            case INSERT_TYPE:
                handler = handlerfactory.createSubtreeInsertOperationHandler(
                    nodes[depth - 1], nodes[depth], op.newvalue);
                break;

            case REMOVE_TYPE:
                handler = handlerfactory.createSubtreeRemoveOperationHandler(
                        nodes[depth - 1], nodes[depth].childidx,
                        op.oldvalue.length);
                break;

            case UPDATE_TYPE:
                handler = handlerfactory.createNodeUpdateOperationHandler(
                        nodes[depth], op.newvalue[0]);
                break;
        }

        this.handlers[i] = handler;
    }, this);

    return fails;
}


/**
 * Private utility class: Creates a new ParameterBuffer instance.
 */
function ParameterBuffer(callback, T) {
    this.callback = callback;
    this.T = T;
    this.items = [];
}


/**
 * Append an item to the end of the buffer
 */
ParameterBuffer.prototype.push = function(item) {
    this.items.push(item);
}


/**
 * Invoke callback with the contents of the buffer array and empty the
 * buffer afterwards.
 */
ParameterBuffer.prototype.flush = function() {
    if (this.items.length > 0) {
        this.callback.call(this.T, this.items);
        this.items = [];
    }
}


/**
 * Collect changeset on given node and all its descendants. Construct and
 * add operations for each.
 *
 * @param node      The node where to start. Typically the root of tree a
 * @param matching  The node matching built up using matchTrees
 * @param contextgen The context generator
 * @param updater   A function(node, callback, T) calling callback if an
 *                  update operation should be performed on node.
 * @param path      (internal use) current path relative to base node. Used
 *                  from recursive calls.
 */
Delta.prototype.collect = function(node, matching, contextgen, updater, path) {
    var inserter, remover, i, k, l, a_nodes, b_nodes, a, b, anchor;

    // Initialize path if not provided
    path = path || [];

    if (!matching.get(node)) {
        throw new Error('Delta.collect may not be invoked for unmatched nodes');
    }

    // Generate update command if values of node and its partner do not
    // match
    updater && updater(node, function(a, b) {
        var head = contextgen.head(a);
        var tail = contextgen.tail(a);
        var op = new Operation(UPDATE_TYPE, path.slice(), head, tail, [a], [b]);
        this.add(op);
    }, this);


    // Operation aggregator for inserts
    inserter = new ParameterBuffer(function(inserts) {
        var head = contextgen.head(anchor);
        var tail = contextgen.tail(anchor);
        var op = new Operation(INSERT_TYPE, path.slice(), head, tail, [], inserts);
        this.add(op);
    }, this);


    // Operation aggregator for removes
    remover = new ParameterBuffer(function(removes) {
        var head = contextgen.head(anchor);
        var tail = contextgen.tail(removes[removes.length-1]);
        var op = new Operation(REMOVE_TYPE, path.slice(), head, tail, removes, []);
        this.add(op);
    }, this);


    // Descend one level
    path.push(0);
    anchor = node;
    a_nodes = node.children;
    b_nodes = matching.get(node).children;
    i = 0; k = 0; l = 0;
    while (a_nodes[i] || b_nodes[k]) {
        a = a_nodes[i];
        b = b_nodes[k];

        if (b && matching.get(b)) {
            k++;
        }
        else if (a && matching.get(a)) {
            // Prepare path, used in item aggregator closures
            path[path.length-1] = i - l;
            l = 0;

            // Flush item aggregators
            remover.flush();
            inserter.flush();

            // Recurse
            anchor = this.collect(a, matching, contextgen, updater, path);

            i++;
        }
        else if (b && !matching.get(b)) {
            inserter.push(b);
            k++;
        }
        else if (a && !matching.get(a)) {
            remover.push(a);
            i++;
            l++;
        }
        else {
            throw new Error('Unexpected state in delta.collection');
        }
    }

    remover.flush();
    inserter.flush();

    // Go back up
    path.pop();

    return anchor;
};


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
        callback.call(T, this.operations[i], this.handlers[i]);
    }
};


/**
 * Construct a new operation instance.
 */
function Operation(type, path, head, tail, oldvalue, newvalue) {
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
    this.head = head;
    this.tail = tail;


    /**
     * Null (insert), one tree.Node (update) or sequence of nodes (delete)
     */
    this.oldvalue = oldvalue;


    /**
     * Null (remove), one tree.Node (update) or sequence of nodes (insert)
     */
    this.newvalue = newvalue;
}


/**
 * Constructor for a simple context generator with the given radius. Node
 * locations are resolved using nodeindex (typically an instance of
 * tree.DocumentOrderIndex) and values are mapped using the valindex.
 */
function ContextGenerator(radius, nodeindex, valindex) {
    /**
     * Return the values for the head context with the given node as the last
     * item in the array.
     */
    this.head = function(last) {
        var i, result = [];
        for (i = -radius + 1; i <= 0; i++) {
            result.push(valindex.get(nodeindex.get(last, i)));
        }
        return result;
    }

    /**
     * Return the values for the tail context starting after the given node.
     */
    this.tail = function(after) {
        var i, result = [];
        after = after && nodeindex.skip(after);
        for (i = 0; i < radius; i++) {
            result.push(valindex.get(after && nodeindex.get(after, i)));
        }
        return result;
    }
}


/**
 * Returns a new updater function suitable for Delta.collect based on the
 * given matching and equality callback.
 */
function defaultMatchingUpdater(matching, equals, Teq) {
    equals = equals || function(a, b) {
        return a.value === b.value;
    }

    return function(node, update, Tup) {
        var partner = matching.get(node);
        if (!equals.call(Teq, node, partner)) {
            update.call(Tup, node, partner);
        }
    };
}


exports.Delta = Delta;
exports.Operation = Operation;
exports.ContextGenerator = ContextGenerator;
exports.defaultMatchingUpdater = defaultMatchingUpdater;

exports.INSERT_TYPE = INSERT_TYPE;
exports.REMOVE_TYPE = REMOVE_TYPE;
exports.UPDATE_TYPE = UPDATE_TYPE;
