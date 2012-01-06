/**
 * @file:   Resolver class capable of identifying nodes in a given tree by
 *          pattern matching.
 *
 * @see:    * Sebastian Rönnau, Christian Pauli, and Uwe M. Borghoff. Merging
 *            changes in XML documents using reliable context fingerprints:
 *            http://dx.doi.org/10.1145/1410140.1410151
 *          * Original Sourcecode:
 *            https://launchpad.net/xcc
 *
 * @module  delta
 */

/** @ignore */
var tree = require('./tree');

/**
 * @constant
 */
var UPDATE_NODE_TYPE = 1;

/**
 * @constant
 */
var UPDATE_FOREST_TYPE = 2;

/**
 * Create new patch instance.
 *
 * @constructor
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
    var fails = 0, i, start, op, nodes, depth, handler, parent, parenthandler;

    // FIXME: parent and parenthandler is a hack for the following situation.
    // Whenever a dom node is swapped for its replacement, operations on child
    // nodes need to reference the new node.data. This is only possible if
    // operations on child-nodes/sequences may lookup the data on parent. The
    // current workaround only works when operations in patches are in document
    // order. This is always the case for XML-format patches produced by
    // delta.js.
    for (i = 0; i < this.operations.length; i++) {
        op = this.operations[i];

        // Resolve anchor node
        nodes = resolver.find(op.path, op.remove, op.head, op.tail, op.type);

        // Check if we can accept the resolved location depending on the
        // operation type
        depth = op.path.length;

        if (!nodes) {
            // Resolving failed completely
            fails++;
        }
        else if (op.remove.length && !nodes[depth]) {
            // If an old value is supplied (node-update, subtree-remove), the
            // path must be complete.
            fails++;
        }
        else if (op.type === UPDATE_FOREST_TYPE && !nodes[depth - 1]) {
            // Operations on forests require the parent node
            fails++;
        }
        else {
            handler = undefined;
            switch (op.type) {
                case UPDATE_FOREST_TYPE:
                    // Operation should start at the node index of the resolved
                    // node or after the last node.
                    start = nodes[depth] ? nodes[depth].childidx :
                        nodes[depth - 1].children.length;
                    // If we have nothing to remove, start should point after
                    // the resolved node. Hm... Probably not really.
                    // if (!op.remove.length) {
                    //     start++;
                    // }

                    handler = handlerfactory.createForestUpdateOperationHandler(
                            nodes[depth - 1], start, op.remove.length,
                            op.insert, nodes[depth - 1] === parent && parenthandler);
                    break;

                case UPDATE_NODE_TYPE:
                    handler = handlerfactory.createNodeUpdateOperationHandler(
                            nodes[depth], op.insert[0],
                            (nodes[depth - 1] === parent && parenthandler));

                    // This node is the new parent
                    parent = nodes[depth];
                    parenthandler = handler;
                    break;
            }

            this.handlers[i] = handler;
        }
    }

    return fails;
};


/**
 * Private utility class: Creates a new ParameterBuffer instance.
 *
 * @constructor
 */
function ParameterBuffer(callback, T) {
    this.callback = callback;
    this.T = T;
    this.removes = [];
    this.inserts = [];
}


/**
 * Append an item to the end of the buffer
 */
ParameterBuffer.prototype.pushRemove = function(item) {
    this.removes.push(item);
};


/**
 * Append an item to the end of the buffer
 */
ParameterBuffer.prototype.pushInsert = function(item) {
    this.inserts.push(item);
};


/**
 * Invoke callback with the contents of the buffer array and empty the
 * buffer afterwards.
 */
ParameterBuffer.prototype.flush = function() {
    if (this.removes.length > 0 || this.inserts.length > 0) {
        this.callback.call(this.T, this.removes, this.inserts);
        this.removes = [];
        this.inserts = [];
    }
};


function DeltaCollector(matching, root_a, root_b) {
    this.matching = matching;
    this.root_a = root_a;
    this.root_b = root_b || matching.get(root_a);
}


DeltaCollector.prototype.equals = function(a, b) {
    return a.value === b.value;
}


/**
 * Invoke a callback for each changeset detected between tree a and tree b
 * according to the given matching.
 *
 * @param callback  A function(type, path, removes, inserts) called
 *                  for each detected set of changes.
 * @param T         Context object bound to "this" when the callback is
 * @param root_a    (internal use) Root node in tree a
 * @param root_b    (internal use) Root node in tree b
 *                  invoked.
 * @param path      (internal use) current path relative to base node. Used
 *                  from recursive calls.
 */
DeltaCollector.prototype.forEachChange = function(callback, T, root_a, root_b,
        path) {
    var parambuf, i, k, a_nodes, b_nodes, a, b;

    // Initialize stuff if not provided
    path = path || [];
    root_a = root_a || this.root_a;
    root_b = root_b || this.root_b;

    if (root_a !== this.matching.get(root_b)) {
        throw new Error('Parameter error, root_a and root_b must be partners');
    }

    // Flag node-update if value of partners do not match
    if (!this.equals(root_a, root_b)) {
        callback.call(T, UPDATE_NODE_TYPE, path.slice(), root_a.par,
                [root_a], [root_b]);
    }

    // Operation aggregator for subtree changes
    parambuf = new ParameterBuffer(function(removes, inserts) {
        callback.call(T, UPDATE_FOREST_TYPE,
            path.concat(i-removes.length), root_a, removes, inserts);
    });


    // Descend one level
    a_nodes = root_a.children;
    b_nodes = root_b.children;
    i = 0; k = 0;
    while (a_nodes[i] || b_nodes[k]) {
        a = a_nodes[i];
        b = b_nodes[k];

        if (a && !this.matching.get(a)) {
            parambuf.pushRemove(a);
            i++;
        }
        else if (b && !this.matching.get(b)) {
            parambuf.pushInsert(b);
            k++;
        }
        else if (a && b && a === this.matching.get(b)) {
            // Flush item aggregators
            parambuf.flush();

            // Recurse
            this.forEachChange(callback, T, a, b, path.concat(i));

            i++;
            k++;
        }
        else {
            throw new Error('Matching is not consistent.');
        }
    }

    parambuf.flush();

    return;
};


/**
 * Collect changeset on given node and all its descendants. Construct and
 * add operations for each.
 *
 * @param node      The node where to start. Typically the root of tree a
 * @param matching  The node matching built up using matchTrees
 * @param contextgen The context generator
 * @param updater   A function(node, callback, T) calling callback if an
 *                  update operation should be performed on node.
 */
Delta.prototype.collect = function(node, matching, contextgen, updater) {
    var partner = matching.get(node);
    var collector = new exports.DeltaCollector(matching, node, partner);

    collector.equals = function(a, b) {
        var result = true;
        updater(a, function(a, b) {
            result = false;
        });
        return result;
    }
    collector.forEachChange(function(type, path, par, removes, inserts) {
        var deep = (type === UPDATE_FOREST_TYPE);
        // Hack ahead: If this operation is a node update, then par is
        // undefined for the root node (path.length === 0). The only node in
        // removes therefore is the root node. Just use that as a reference to
        // build up context using head and tail. Otherwise use par.
        var ref = (type === UPDATE_NODE_TYPE && path.length === 0) ? removes[0] : par;
        var idx = path[path.length-1];
        var head = contextgen.head(ref, idx);
        var tail = contextgen.tail(ref, idx + removes.length - 1, deep);
        var op = new Operation(type, path, head, tail, removes, inserts);
        this.add(op);
    }, this);
};


/**
 * Collect changeset on given node and all its descendants. Construct and
 * add operations for each.
 *
 * @param node      The node where to start. Typically the root of tree a
 * @param matching  The node matching built up using matchTrees
 * @param contextgen The context generator
 * @param updater   A function(node, callback, T) calling callback if an
 *                  update operation should be performed on node.
 */
Delta.prototype.collect2 = function(collector, contextgen) {
    collector.forEachChange(function(type, path, par, removes, inserts) {
        var deep = (type === UPDATE_FOREST_TYPE);
        // Hack ahead: If this operation is a node update, then par is
        // undefined for the root node (path.length === 0). The only node in
        // removes therefore is the root node. Just use that as a reference to
        // build up context using head and tail. Otherwise use par.
        var ref = (type === UPDATE_NODE_TYPE && path.length === 0) ? removes[0] : par;
        var idx = path[path.length-1];
        var head = contextgen.head(ref, idx);
        var tail = contextgen.tail(ref, idx + removes.length - 1, deep);
        var op = new Operation(type, path, head, tail, removes, inserts);
        this.add(op);
    }, this);
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
 *
 * @constructor
 */
function Operation(type, path, head, tail, remove, insert) {
    /**
     * The operation type, one of UPDATE_NODE_TYPE, UPDATE_FOREST_TYPE
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
    this.remove = remove;


    /**
     * Null (remove), one tree.Node (update) or sequence of nodes (insert)
     */
    this.insert = insert;
}

Operation.prototype.toString = function() {
    var result = 'Unknown operation', i, parts, rvals, ivals;

    switch (this.type) {
        case UPDATE_NODE_TYPE:
            result = 'Update "' + this.remove[0].value + '" at /' +
                this.path.join('/');
            break;
        case UPDATE_FOREST_TYPE:
            rvals = [];
            ivals = [];
            parts = [];
            for (i = 0; i < this.remove.length; i++) {
                rvals.push(this.remove[i].value);
            }
            for (i = 0; i < this.insert.length; i++) {
                ivals.push(this.insert[i].value);
            }
            if (rvals.length) {
                parts.push('remove "' + rvals.join('", "') + '"');
            }
            if (ivals.length) {
                parts.push('insert "' + ivals.join('", "') + '"');
            }

            result = parts.join(" and ") + " at /" + this.path.join('/');

            // uppercase first character
            result = result.replace(/^([a-z])/,
                    function (c) { return c.toUpperCase();});
            break;
    }

    return result;
}


/**
 * Constructor for a simple context generator with the given radius. Node
 * locations are resolved using nodeindex (typically an instance of
 * tree.DocumentOrderIndex) and values are mapped using the valindex.
 * @constructor
 */
function ContextGenerator(radius, nodeindex, valindex) {
    /**
     * Return n values representing the head-context where n is the size of the
     * radius.
     *
     * @param par       The parent node or undefined (for the root node)
     * @param before    An index into pars children list. Nodes up to but not
     *                  including the node at this index will be returned as
     *                  the head context.
     */
    this.head = function(par, before) {
        var i, ref, result = [];

        // ref represents the last node of the head context.

        if (par) {
            if (before < 1) {
                ref = nodeindex.get(par, before);
            }
            else if (before <= par.children.length) {
                ref = nodeindex.get(par.children[before - 1],
                    nodeindex.size(par.children[before - 1]) - 1);
            }
            else if (before > par.children.length) {
                ref = nodeindex.skip(par);
            }
            else {
                ref = nodeindex.get(par, -1);
            }
        }

        for (i = -radius + 1; i < 1; i++) {
            result.push(valindex.get(ref && nodeindex.get(ref, i)));
        }
        return result;
    };

    /**
     * Return the values for the tail context starting with the given node.
     *
     * @param par       The parent node or undefined (for the root node)
     * @param after     An index into pars children list. Nodes following
     *                  the node at this index will be returned as the tail
     *                  context.
     */
    this.tail = function(par, after, deep) {
        var i, ref, result = [];

        // ref represents the last node affected by the operation or the node
        // immediately preceeding the tail respectively.

        if (par) {
            if (after < 0) {
                ref = nodeindex.get(par, after + 1);
            }
            else if (after < par.children.length) {
                if (deep) {
                    ref = nodeindex.get(par.children[after],
                            nodeindex.size(par.children[after]) - 1);
                }
                else {
                    ref = par.children[after];
                }
            }
            else if (after >= par.children.length) {
                ref = nodeindex.get(par, nodeindex.size(par) - 1);
            }
            else {
                if (deep) {
                    ref = nodeindex.get(par, nodeindex.size(par) - 1);
                }
                else {
                    ref = par;
                }
            }
        }

        for (i = 1; i < radius + 1; i++) {
            result.push(valindex.get(ref && nodeindex.get(ref, i)));
        }
        return result;
    };
}


/**
 * Returns a new updater function suitable for Delta.collect based on the
 * given matching and equality callback.
 */
function defaultMatchingUpdater(matching, equals, Teq) {
    equals = equals || function(a, b) {
        return a.value === b.value;
    };

    return function(node, update, Tup) {
        var partner = matching.get(node);
        if (!equals.call(Teq, node, partner)) {
            update.call(Tup, node, partner);
        }
    };
}


exports.Delta = Delta;
exports.Operation = Operation;
exports.DeltaCollector = DeltaCollector;
exports.ContextGenerator = ContextGenerator;
exports.defaultMatchingUpdater = defaultMatchingUpdater;

exports.UPDATE_NODE_TYPE = UPDATE_NODE_TYPE;
exports.UPDATE_FOREST_TYPE = UPDATE_FOREST_TYPE;
