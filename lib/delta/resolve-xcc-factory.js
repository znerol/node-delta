/**
 * @fileoverview This module contains the factory class necessary to
 * instantiate the XCC resolver algorithm.
 */


/** @ignore */
var resolver = require('../delta/resolver');
/** @ignore */
var deltamod = require('../delta/delta');


/**
 * Create a new instance of the XCC resolver factory.
 *
 * @param {object} [options]    A set of options which is used during
 *         instantiation of the resolver class. Specify the properties
 *         ``radius`` for the maximal search radius used during fuzzy matching
 *         (Default: 6) and ``threshold`` for the match quality threshold
 *         (Default: 0.7).
 *
 * @constructor
 */
function ResolveXCCFactory(options) {
    this.options = options || {};
    if (typeof this.options.radius === 'undefined') {
        this.options.radius = 6;
    }
    if (typeof this.options.threshold === 'undefined') {
        this.options.threshold = 0.7;
    }
}


/**
 * Return new initialized instance of the XCC resolver algorithm for the given
 * document.
 *
 * @param {Object} doc              The original document. Use
 *         ``loadOriginalDocument`` of the document factory to load a suitable
 *         document.
 * @param {function} [equalValue]   The equality test-function used when
 *         comparing node values against context values of a patch. Use the
 *         method ``createValueTest`` of the document factory to create a
 *         suitable function.
 * @param {function} [equalNode]    The equality test-function used when
 *         comparing two nodes. Use the method ``createNodeEqualityTest`` of
 *         the document factory to create a suitable function.
 * @param {function} [equalTree]    The equality test-function used when
 *         comparing two subtrees. Use the method ``createNodeEqualityTest`` of
 *         the document factory to create a suitable function.
 *
 * @return {ContextResolver} An initialized context aware resolver instance.
 */
ResolveXCCFactory.prototype.createResolver = function(doc, equalValue, equalNode, equalTree) {
    if (!doc.tree) {
        throw new Error('Parameter error: Document objects must have tree property');
    }
    if (!doc.nodeindex) {
        throw new Error('Parameter error: Document objects must have nodeindex property');
    }

    var res = new resolver.ContextResolver(doc.tree, doc.nodeindex,
            this.options.radius, this.options.threshold);

    if (equalValue && equalNode && equalTree) {
        res.equalContent = function(docnode, patchnode, type) {
            if (type === deltamod.UPDATE_FOREST_TYPE) {
                return equalTree(docnode, patchnode);
            }
            else if (type === deltamod.UPDATE_NODE_TYPE) {
                return equalNode(docnode, patchnode);
            }
            else {
                throw new Error('Got unknown operation type in equalContent cb: ' + type);
            }
        }

        res.equalContext = function(docnode, value) {
            return equalValue(docnode, value);
        }
    }

    return res;
}


exports.ResolveXCCFactory = ResolveXCCFactory;
