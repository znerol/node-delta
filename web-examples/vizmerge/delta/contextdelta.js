define(["require", "exports", "module", "./tree","./delta"], function(require, exports, module) {
/**
 * This module provides classes and methods for the conversion between attached
 * operations and detached context delta operations.
 */

/** @ignore */
var tree = require('./tree');

/** @ignore */
var deltamod = require('./delta');


/**
 * Construct a new detached context delta operation instance. This is a pure
 * data object without any methods.
 *
 * @constructor
 */
function DetachedContextOperation(type, path, remove, insert, head, tail) {
    /**
     * The operation type, one of deltamod.UPDATE_NODE_TYPE, deltamod.UPDATE_FOREST_TYPE
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
     * Fingerprint values for the content. For insert operations, this
     * array should be empty. For remove-operations, the array should
     * contain the fingerprint values of the nodes which should be removed,
     * for update operations, the only element should be the fingerprint
     * value of the original node.
     */
    this.head = head;
    this.tail = tail;
}


/**
 * Return a string representation of the operation
 */
DetachedContextOperation.prototype.toString = function() {
    var result = 'Unknown operation', i, parts, rvals, ivals;

    switch (this.type) {
        case deltamod.UPDATE_NODE_TYPE:
            result = 'Update "' + this.remove[0].value + '" at /' +
                this.path.join('/');
            break;
        case deltamod.UPDATE_FOREST_TYPE:
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
 * Create new operation detacher instance.
 *
 * @constructor
 */
function Detacher(contextgen) {
    this.contextgen = contextgen;
}


/**
 * Create new detached context operation from an attached operation.
 */
Detacher.prototype.detach = function(op) {
    var deep = (op.type === deltamod.UPDATE_FOREST_TYPE);
    var head = this.contextgen.head(op.anchor);
    var tail = this.contextgen.tail(op.anchor, op.remove.length, deep);
    return new DetachedContextOperation(op.type, op.path, op.remove, op.insert,
            head, tail);
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
     * @param anchor    The tree.Anchor specifying the first node after head.
     */
    this.head = function(anchor) {
        var i, ref, result = [], par = anchor.base, before = anchor.index;

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
     * @param anchor    The tree.Anchor specifying the first node after head.
     * @param length    The number of siblings affected by the operation.
     * @param depth     Wether the operation affects subtrees (true) or only
     *                  one node (false).
     *
     */
    this.tail = function(anchor, length, deep) {
        var i, ref, result = [], par = anchor.base, after = anchor.index + length - 1;

        // ref represents the last node affected by the operation or the node
        // immediately preceeding the tail respectively.

        // FIXME: Divide this logic into two methods. One for depth=true and
        // another for depht=false.
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
        else {
            if (deep) {
                ref = nodeindex.get(anchor.target,
                        nodeindex.size(anchor.target) - 1);
            }
            else {
                ref = anchor.target;
            }
        }

        for (i = 1; i < radius + 1; i++) {
            result.push(valindex.get(ref && nodeindex.get(ref, i)));
        }
        return result;
    };
}


exports.DetachedContextOperation = DetachedContextOperation;
exports.Detacher = Detacher;
exports.ContextGenerator = ContextGenerator;

});
