var resolver = require('../delta/resolver');
var deltamod = require('../delta/delta');

exports.options = {
    'radius': 6,
    'threshold': 0.7
};

exports.createResolver = function(doc, equalValue, equalNode, equalTree) {
    if (!doc.tree) {
        throw new Error('Parameter error: Document objects must have tree property');
    }
    if (!doc.nodeindex) {
        throw new Error('Parameter error: Document objects must have nodeindex property');
    }

    var res = new resolver.ContextResolver(doc.tree, doc.nodeindex,
            exports.options.radius, exports.options.threshold);

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
