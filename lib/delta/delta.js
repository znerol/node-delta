/**
 * @fileoverview Provides classes and methods necessary for the construction of
 * attached operations.
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

/**
 * Utility class to construct a sequence of attached operations from a
 * matching.
 *
 * @constructor
 */
function DeltaCollector(matching, root_a, root_b) {
    this.matching = matching;
    this.root_a = root_a;
    this.root_b = root_b || matching.get(root_a);
}


/**
 * Default equality test. Override this method if you need to test other
 * node properties instead/beside node value.
 */
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
 *
 */
DeltaCollector.prototype.forEachChange = function(callback, T, root_a, root_b,
        path) {
    var parambuf, i, k, a_nodes, b_nodes, a, b, op, me = this;

    // Initialize stuff if not provided
    path = path || [];
    root_a = root_a || this.root_a;
    root_b = root_b || this.root_b;

    if (root_a !== this.matching.get(root_b)) {
        throw new Error('Parameter error, root_a and root_b must be partners');
    }

    // Flag node-update if value of partners do not match
    if (!this.equals(root_a, root_b)) {
        op = new AttachedOperation(
                new tree.Anchor(this.root_a, root_a),
                UPDATE_NODE_TYPE,
                path.slice(),
                [root_a], [root_b]);
        callback.call(T, op);
    }

    // Operation aggregator for subtree changes
    parambuf = new ParameterBuffer(function(removes, inserts) {
        var start = i - removes.length;
        var op = new AttachedOperation(
                new tree.Anchor(me.root_a, root_a, start),
                UPDATE_FOREST_TYPE,
                path.concat(start),
                removes, inserts);
        callback.call(T, op);
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
 * Construct a new attached operation instance. An attached operation is always
 * bound to a tree-node identified thru the anchor.
 *
 * @constructor
 */
function AttachedOperation(anchor, type, path, remove, insert, handler) {
    /**
     * The anchor where the operation is attached
     */
    this.anchor = anchor;


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
     * Null (insert), one tree.Node (update) or sequence of nodes (delete)
     */
    this.remove = remove;


    /**
     * Null (remove), one tree.Node (update) or sequence of nodes (insert)
     */
    this.insert = insert;


    /**
     * A handler object used to toggle operation state in the document. I.e.
     * apply and unapply the operation.
     */
    this.handler = handler;
}

/**
 * Return string representation of the operation.
 */
AttachedOperation.prototype.toString = function() {
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
 * Create a new operation attacher instance. Use this class to convert detached
 * operations read from a patch-file.
 *
 * @constructor
 */
function Attacher(resolver) {
    this.resolver = resolver;
}


/**
 * Resolve anchor of one operation and return new attached operation instance.
 */
Attacher.prototype.attach = function(op) {
    res = this.resolver.find(op.path, op.remove, op.head, op.tail, op.type);

    if (res.anchor && res.tail.length === 0) {
        return new AttachedOperation(res.anchor, op.type, op.path, op.remove,
                op.insert);
    }
}


exports.DeltaCollector = DeltaCollector;
exports.AttachedOperation = AttachedOperation;
exports.Attacher = Attacher;

exports.UPDATE_NODE_TYPE = UPDATE_NODE_TYPE;
exports.UPDATE_FOREST_TYPE = UPDATE_FOREST_TYPE;
