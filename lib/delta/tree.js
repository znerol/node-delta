/**
 * Create a new tree node and set its value and optionally user data.
 */
function Node(value, data) {
    this.value = value;
    this.data = data;
    this.depth = 0;

    // this.par = undefined;
    // this.childidx = undefined;
    this.children = [];
}


/**
 * Append the given node as a child node.
 */
Node.prototype.append = function(child) {
    if (child.par) {
        throw new Error('Cannot append a child which already has a parent');
    }

    child.depth = this.depth + 1;
    child.par = this;
    child.childidx = this.children.length;
    this.children.push(child);
};


/**
 * Compare the given path to the path of the node. Return positive integer
 * if the node is later in the tree, return a negative integer if it is
 * earlier and return zero if the path matches exactly.
 */
Node.prototype.pathcmp = function(path) {
    var result;
    if (this.depth === 0) {
        result = 0;
    }
    else {
        result = this.par.pathcmp(path);
        if (result === 0) {
            result = this.childidx - path[this.depth - 1];
        }
    }

    return result;
}


/**
 * Invokes a callback for the node and all its child nodes in preorder
 * (document order).
 */
Node.prototype.forEach = function(callback, T) {
    callback.call(T, this);
    this.children.forEach(function(node) {
        node.forEach(callback, T);
    });
};


/**
 * Invokes a callback for the node and all its child nodes in postorder.
 */
Node.prototype.forEachPostorder = function(callback, T) {
    this.children.forEach(function(node) {
        node.forEachPostorder(callback, T);
    });
    callback.call(T, this);
};


/**
 * Equal to forEach except that the callback is not invoked for the context
 * node
 */
Node.prototype.forEachDescendant = function(callback, T) {
    this.children.forEach(function(node) {
        node.forEach(callback, T);
    });
};


/**
 * Call the given callback for the parent node and then for each ancestor
 * until reaching the root or callback returns a trueish value.
 */
Node.prototype.forEachAncestor = function(callback, T) {
    var brk;
    if (this.par) {
        brk = callback.call(T, this.par);
        if (!brk) {
            this.par.forEachAncestor(callback, T);
        }
    }
};


/**
 * Create a new Matching instance. Optionally specify the property used to
 * store partner links in target objects.
 */
function Matching(propname) {
    this.propname = propname || 'partner';
}


/**
 * Return the partner of given object.
 */
Matching.prototype.get = function(obj) {
    return obj && obj[this.propname];
};


/**
 * Associate the given objects.
 */
Matching.prototype.put = function(a, b) {
    if (a[this.propname] || b[this.propname]) {
        throw new Error('Cannot associate objects which are already part of a matching');
    }
    a[this.propname] = b;
    b[this.propname] = a;
};


/**
 * Create a new secondary tree structure providing quick access to all
 * nodes of a generation.
 *
 * @param root      A tree.Node representing the root of the tree
 * @param propname  The name of the property which will be used to cache
 *                  index values on tree.Node objects.
 */
function GenerationIndex(root, propname) {
    /**
     * The root of the tree.
     */
    this.root = root;

    /**
     * A property set at every indexed tree.Node indicating the position
     * of the node in the generation.
     */
    this.propname = propname || 'gencacheidx';

    /**
     * An array of arrays of tree.Nodes. Each containing tree.Nodes at the
     * same depth.
     */
    this.generations = [];

    /**
     * An array of booleans indexed by tree depth indicating whether all
     * nodes of a generation have been indexed.
     */
    this.gencomplete = [];

    /**
     * Return true if the whole generation index is complete.
     */
    this.idxcomplete = false;
}


/**
 * Build up complete generation index upfront if necessary.
 */
GenerationIndex.prototype.buildAll = function() {
    var i;
    if (!this.idxcomplete) {
        this.buildSubtree(this.root);
        for (i = 0; i < this.generations.length; i++) {
            this.gencomplete[i] = true;
        }
        this.idxcomplete = true;
    }
}


/**
 * Build up index of a subtree rooting at the specified node.
 */
GenerationIndex.prototype.buildSubtree = function(node) {
    var i, depth;
    depth = node.depth - this.root.depth;

    // Prepare generation structure
    if (this.generations.length === depth) {
        this.generations.push([]);
        this.gencomplete[depth] = true;
    }

    // Append current node
    node[this.propname] = this.generations[depth].length;
    this.generations[depth].push(node);

    // Recurse for children
    for (i = 0; i < node.children.length; i++) {
        this.buildSubtree(node.children[i]);
    }
};


/**
 * Extend generation index dynamically (not implemented yet)
 */
GenerationIndex.extendGeneration = function(depth, offset) {
    throw new Error('Dynamic index expansion not implemented yet');
};


/**
 * Return first node of the generation at depth.
 */
GenerationIndex.prototype.first = function(depth) {
    if (depth < this.generations.length) {
        // First node is in index, return it
        if (this.generations[depth].length > 0) {
            return this.generations[depth][0];
        }

        // Requested index is beyond upper bound of generation array
        // and the generation cache is complete.
        else if (this.gencomplete[depth]) {
            return undefined;
        }
    }

    if (this.idxcomplete) {
        // No need to attempt searching for the node if index is complete.
        return undefined;
    }
    else {
        // Extend generations
        // return this.extendGeneration(depth, refindex + offset);
        throw new Error('Dynamic index expansion not implemented yet');
    }
}


/**
 * Return last node of the generation at depth.
 */
GenerationIndex.prototype.last = function(depth) {
    if (depth < this.generations.length) {
        // Generation cache is complete. Return last item.
        if (this.gencomplete[depth]) {
            return this.generations[depth][this.generations[depth].length - 1];
        }
    }

    if (this.idxcomplete) {
        // No need to attempt searching for the node if index is complete.
        return undefined;
    }
    else {
        // Extend generations
        // return this.extendGeneration(depth, refindex + offset);
        throw new Error('Dynamic index expansion not implemented yet');
    }
}


/**
 * Return a tree.Node with the same depth at the given offset relative to
 * the given reference node.
 *
 * @param refnode   The reference tree.Node
 * @param offset    An integer value
 *
 * @returns tree.Node or undefined
 */
GenerationIndex.prototype.get = function(refnode, offset) {
    var depth, refindex;

    offset = offset || 0;

    if (refnode === this.root) {
        // Return the root node if refnode is equal to the tree root.
        if (offset === 0) {
            return refnode;
        }
        else {
            return undefined;
        }
    }

    depth = refnode.depth - this.root.depth;
    if (depth < this.generations.length) {
        // If we already have cached some nodes in this tree depth, go for
        // them.
        if (this.propname in refnode) {
            refindex = refnode[this.propname];
            if (this.generations[depth][refindex] !== refnode) {
                throw new Error('GenerationIndex index corrupt');
            }

            // Requested offset lies beyond lower bound. Return undefined.
            if (refindex + offset < 0) {
                return undefined;
            }

            // Requested offset is already indexed. Return it.
            else if (refindex + offset < this.generations[depth].length) {
                return this.generations[depth][refindex + offset];
            }

            // Requested index is beyond upper bound of generation array
            // and the generation cache is complete.
            else if (this.gencomplete[depth]) {
                return undefined;
            }

            // Requested index is beyand upper bound of generation array
            // but the generation cache is not yet complete. Fall through
            // to code outside below.
        }

    }

    if (this.idxcomplete) {
        // No need to attempt searching for the node if index is complete.
        return undefined;
    }
    else {
        // Extend generations
        // return this.extendGeneration(depth, refindex + offset);
        throw new Error('Dynamic index expansion not implemented yet');
    }
};


/**
 * Create a new secondary tree structure providing quick access to all
 * nodes in document order.
 *
 * @param root      A tree.Node representing the root of the tree
 * @param propname  The name of the property which will be used to cache
 *                  index values on tree.Node objects.
 */
function DocumentOrderIndex(root, propname) {
    /**
     * The root of the tree.
     */
    this.root = root;

    /**
     * A property set at every indexed tree.Node indicating the position
     * of the node in the generation.
     */
    this.propname = propname || 'docorderidx';

    /**
     * Return true if the whole generation index is complete.
     */
    this.idxcomplete = false;

    /**
     * Array of nodes in document order.
     */
    this.nodes = [];
}


/**
 * Build up complete document order index upfront if necessary.
 */
DocumentOrderIndex.prototype.buildAll = function() {
    if (!this.idxcomplete) {
        this.root.forEach(function(node) {
            node[this.propname] = this.nodes.length;
            this.nodes.push(node);
        }, this);
        this.idxcomplete = true;
    }
}


/**
 * Return a tree.Node at the offset relative to the given reference node.
 *
 * @param refnode   The reference tree.Node
 * @param offset    An integer value
 *
 * @returns tree.Node or undefined
 */
DocumentOrderIndex.prototype.get = function(refnode, offset) {
    var depth, refindex;

    offset = offset || 0;

    // If we already have cached some nodes in this tree depth, go for
    // them.
    if (this.propname in refnode) {
        refindex = refnode[this.propname];
        if (this.nodes[refindex] !== refnode) {
            throw new Error('Document order index corrupt');
        }

        // Requested offset lies beyond lower bound. Return undefined.
        if (refindex + offset < 0) {
            return undefined;
        }

        // Requested offset is already indexed. Return it.
        else if (refindex + offset < this.nodes.length) {
            return this.nodes[refindex + offset];
        }

        // Requested index is beyond upper bound of index. Fall through to
        // code outside the if below.
    }

    if (this.idxcomplete) {
        // No need to attempt searching for the node if index is complete.
        return undefined;
    }
    else {
        // Extend document order index
        // return this.extendIndex(depth, refnode, index);
        throw new Error('Dynamic index expansion not implemented yet');
    }
};


/**
 * Skip over a whole subtree rooted at refnode.
 */
DocumentOrderIndex.prototype.skip = function(refnode) {
    var depth, last;

    // Check cache
    if (this.propname in refnode) {
        refnode.forEach(function(n) {
            last = n;
        });
        return this.get(last, 1);
    }

    if (this.idxcomplete) {
        // No need to attempt searching for the node if index is complete.
        return undefined;
    }
    else {
        // Extend document order index
        // return this.extendIndex(depth, refnode, index);
        throw new Error('Dynamic index expansion not implemented yet');
    }
}


/**
 * Simple subtree hashing algorithm.
 */
function SimpleTreeHash(HashAlgorithm, nodehashindex) {
    this.HashAlgorithm = HashAlgorithm;
    this.nodehashindex = nodehashindex;
}


/**
 * Calculate hash value of subtree
 */
SimpleTreeHash.prototype.process = function(node, hash) {
    hash = hash || new this.HashAlgorithm();

    node.forEach(function(n) {
        var nodehash = this.nodehashindex.get(n);
        hash.update(nodehash);
    }, this);

    return hash.get();
}


function NodeHashIndex(nodehash, propname) {
    this.nodehash = nodehash;
    this.propname = propname || 'nodehash';
}


NodeHashIndex.prototype.get = function(node) {
    if (node) {
        if (!(this.propname in node)) {
            node[this.propname] = this.nodehash.process(node);
        }

        return node[this.propname];
    }
}


function TreeHashIndex(treehash, propname) {
    this.treehash = treehash;
    this.propname = propname || 'treehash';
}


TreeHashIndex.prototype.get = function(node) {
    if (node) {
        if (!(this.propname in node)) {
            node[this.propname] = this.treehash.process(node);
        }

        return node[this.propname];
    }
}


exports.Node = Node;
exports.Matching = Matching;
exports.GenerationIndex = GenerationIndex;
exports.DocumentOrderIndex = DocumentOrderIndex;
exports.SimpleTreeHash = SimpleTreeHash;
exports.NodeHashIndex = NodeHashIndex;
exports.TreeHashIndex = TreeHashIndex;
