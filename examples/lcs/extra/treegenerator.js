var tree = require('../delta/tree');

/**
 * Create a new instance of the uniform tree model generator.
 *
 * @param {number} cpn  Number of children per node
 * @param {number} d    Tree depth
 * @creator
 */
function UniformTreeModel(cpn, d) {
    this.cpn = cpn;
    this.d = d;
}

/**
 * Return true if the tree builder should append a new child node at index on
 * the given parent.
 *
 * @param {object} par      The parent node
 * @param {object} index    The child index of the new node
 *
 * @return {boolean} True if a new child should be created, false otherwise
 */
UniformTreeModel.prototype.allowChild = function(par, index) {
    return index < this.cpn && par.depth < this.d;
}

/**
 * Create a new instance of a tree builder, constructing a tree on the basis
 * of a given tree model.
 *
 * @param {object} model    The tree model. E.g. an instance of UniformTreeModel.
 * @return {object} The root node of the generated tree
 * @creator
 */
function TreeBuilder(model) {
    this.model = model;
}

/**
 * Recursively build a tree. Call the given callback for each new node.
 *
 * @param {function} [callback] The callback which is invoked after
 *         constructing a new node.
 * @param {object} [T]          The context object. Upon callback invocation
 *         the "this" variable will be set to T.
 * @param {base} [object]       The base tree node to use. This parameter is
 *         used during recursive calls however one might specify an alternative
 *         tree root here if desired.
 */
TreeBuilder.prototype.build = function(callback, T, base) {
    var i=0, n;

    if (!base) {
        base = new tree.Node();
    }

    if (callback) {
        callback.call(T, base);
    }

    while(this.model.allowChild(base, i++)) {
        // Construct new node
        n = new tree.Node();
        base.append(n);

        // Recurse
        this.build(callback, T, n);
    }

    return base;
}

exports.UniformTreeModel = UniformTreeModel;
exports.TreeBuilder = TreeBuilder;
