define(["require", "exports", "module", "./tree"], function(require, exports, module) {
/**
 * @file:   Adapter class converting an XML DOM document into a simple tree
 *          structure suitable for comparison using the XCC tree diff
 *          algorithm.
 *
 * @module  jsobjectree
 */

/** @ignore */
var tree = require('./tree');

/**
 * A function that visits every value of a JSON object tree in preorder.
 * Calls a callback with the visited value and the result of the callback
 * from visitting the parent.
 *
 * This function is a modified version of Douglas Crockfords walk_the_DOM
 * function from his book "Javascript: The Good Parts".
 *
 * @param value     A JSON value representing the starting point for the
 *                  mapping operation
 * @param callback  function(value, parents_result)
 * @param T         context parameter bound to "this" when invoking the
 *                  callback 
 * @param presult   Internal use.
 */
function mapvalue(value, key, callback, T, presult) {
    var prop, result = callback.call(T, key, value, presult);

    if (typeof value === 'object') {
        for (prop in value) {
            if (value.hasOwnProperty(prop)) {
                mapvalue(value[prop], key, callback, T, result);
            }
        }
    }

    return result;
}


/**
 * @constructor
 */
function JSObjectTreeAdapter() {
}


/**
 * Create value wrappers for the specified element or text value and all its
 * descentants and return toplevel wrapper.
 **/
JSObjectTreeAdapter.prototype.adaptElement = function(element, key) {
    return mapvalue(element, key, function(key, value, wrappedParent) {
        var wrappedNode;

        if (typeof value !== 'object') {
            key = value;
        }

        wrappedNode = new tree.Node(key, value);

        if (wrappedParent) {
            wrappedParent.append(wrappedNode);
        }

        return wrappedNode;
    }, this);
};


/**
 * Create value wrappers for all element and text values in the specified
 * document and return the root wrapper.
 */
JSObjectTreeAdapter.prototype.adaptDocument = function(doc) {
    return this.adaptElement(doc);
};


exports.JSObjectTreeAdapter = JSObjectTreeAdapter;

});
