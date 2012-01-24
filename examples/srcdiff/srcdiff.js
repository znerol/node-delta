var require = function (file, cwd) {
    var resolved = require.resolve(file, cwd || '/');
    var mod = require.modules[resolved];
    if (!mod) throw new Error(
        'Failed to resolve module ' + file + ', tried ' + resolved
    );
    var res = mod._cached ? mod._cached : mod();
    return res;
}

require.paths = [];
require.modules = {};
require.extensions = [".js",".coffee"];

require._core = {
    'assert': true,
    'events': true,
    'fs': true,
    'path': true,
    'vm': true
};

require.resolve = (function () {
    return function (x, cwd) {
        if (!cwd) cwd = '/';
        
        if (require._core[x]) return x;
        var path = require.modules.path();
        var y = cwd || '.';
        
        if (x.match(/^(?:\.\.?\/|\/)/)) {
            var m = loadAsFileSync(path.resolve(y, x))
                || loadAsDirectorySync(path.resolve(y, x));
            if (m) return m;
        }
        
        var n = loadNodeModulesSync(x, y);
        if (n) return n;
        
        throw new Error("Cannot find module '" + x + "'");
        
        function loadAsFileSync (x) {
            if (require.modules[x]) {
                return x;
            }
            
            for (var i = 0; i < require.extensions.length; i++) {
                var ext = require.extensions[i];
                if (require.modules[x + ext]) return x + ext;
            }
        }
        
        function loadAsDirectorySync (x) {
            x = x.replace(/\/+$/, '');
            var pkgfile = x + '/package.json';
            if (require.modules[pkgfile]) {
                var pkg = require.modules[pkgfile]();
                var b = pkg.browserify;
                if (typeof b === 'object' && b.main) {
                    var m = loadAsFileSync(path.resolve(x, b.main));
                    if (m) return m;
                }
                else if (typeof b === 'string') {
                    var m = loadAsFileSync(path.resolve(x, b));
                    if (m) return m;
                }
                else if (pkg.main) {
                    var m = loadAsFileSync(path.resolve(x, pkg.main));
                    if (m) return m;
                }
            }
            
            return loadAsFileSync(x + '/index');
        }
        
        function loadNodeModulesSync (x, start) {
            var dirs = nodeModulesPathsSync(start);
            for (var i = 0; i < dirs.length; i++) {
                var dir = dirs[i];
                var m = loadAsFileSync(dir + '/' + x);
                if (m) return m;
                var n = loadAsDirectorySync(dir + '/' + x);
                if (n) return n;
            }
            
            var m = loadAsFileSync(x);
            if (m) return m;
        }
        
        function nodeModulesPathsSync (start) {
            var parts;
            if (start === '/') parts = [ '' ];
            else parts = path.normalize(start).split('/');
            
            var dirs = [];
            for (var i = parts.length - 1; i >= 0; i--) {
                if (parts[i] === 'node_modules') continue;
                var dir = parts.slice(0, i + 1).join('/') + '/node_modules';
                dirs.push(dir);
            }
            
            return dirs;
        }
    };
})();

require.alias = function (from, to) {
    var path = require.modules.path();
    var res = null;
    try {
        res = require.resolve(from + '/package.json', '/');
    }
    catch (err) {
        res = require.resolve(from, '/');
    }
    var basedir = path.dirname(res);
    
    var keys = Object_keys(require.modules);
    
    for (var i = 0; i < keys.length; i++) {
        var key = keys[i];
        if (key.slice(0, basedir.length + 1) === basedir + '/') {
            var f = key.slice(basedir.length);
            require.modules[to + f] = require.modules[basedir + f];
        }
        else if (key === basedir) {
            require.modules[to] = require.modules[basedir];
        }
    }
};

require.define = function (filename, fn) {
    var dirname = require._core[filename]
        ? ''
        : require.modules.path().dirname(filename)
    ;
    
    var require_ = function (file) {
        return require(file, dirname)
    };
    require_.resolve = function (name) {
        return require.resolve(name, dirname);
    };
    require_.modules = require.modules;
    require_.define = require.define;
    var module_ = { exports : {} };
    
    require.modules[filename] = function () {
        require.modules[filename]._cached = module_.exports;
        fn.call(
            module_.exports,
            require_,
            module_,
            module_.exports,
            dirname,
            filename
        );
        require.modules[filename]._cached = module_.exports;
        return module_.exports;
    };
};

var Object_keys = Object.keys || function (obj) {
    var res = [];
    for (var key in obj) res.push(key)
    return res;
};

if (typeof process === 'undefined') process = {};

if (!process.nextTick) process.nextTick = function (fn) {
    setTimeout(fn, 0);
};

if (!process.title) process.title = 'browser';

if (!process.binding) process.binding = function (name) {
    if (name === 'evals') return require('vm')
    else throw new Error('No such module')
};

if (!process.cwd) process.cwd = function () { return '.' };

require.define("path", function (require, module, exports, __dirname, __filename) {
    function filter (xs, fn) {
    var res = [];
    for (var i = 0; i < xs.length; i++) {
        if (fn(xs[i], i, xs)) res.push(xs[i]);
    }
    return res;
}

// resolves . and .. elements in a path array with directory names there
// must be no slashes, empty elements, or device names (c:\) in the array
// (so also no leading and trailing slashes - it does not distinguish
// relative and absolute paths)
function normalizeArray(parts, allowAboveRoot) {
  // if the path tries to go above the root, `up` ends up > 0
  var up = 0;
  for (var i = parts.length; i >= 0; i--) {
    var last = parts[i];
    if (last == '.') {
      parts.splice(i, 1);
    } else if (last === '..') {
      parts.splice(i, 1);
      up++;
    } else if (up) {
      parts.splice(i, 1);
      up--;
    }
  }

  // if the path is allowed to go above the root, restore leading ..s
  if (allowAboveRoot) {
    for (; up--; up) {
      parts.unshift('..');
    }
  }

  return parts;
}

// Regex to split a filename into [*, dir, basename, ext]
// posix version
var splitPathRe = /^(.+\/(?!$)|\/)?((?:.+?)?(\.[^.]*)?)$/;

// path.resolve([from ...], to)
// posix version
exports.resolve = function() {
var resolvedPath = '',
    resolvedAbsolute = false;

for (var i = arguments.length; i >= -1 && !resolvedAbsolute; i--) {
  var path = (i >= 0)
      ? arguments[i]
      : process.cwd();

  // Skip empty and invalid entries
  if (typeof path !== 'string' || !path) {
    continue;
  }

  resolvedPath = path + '/' + resolvedPath;
  resolvedAbsolute = path.charAt(0) === '/';
}

// At this point the path should be resolved to a full absolute path, but
// handle relative paths to be safe (might happen when process.cwd() fails)

// Normalize the path
resolvedPath = normalizeArray(filter(resolvedPath.split('/'), function(p) {
    return !!p;
  }), !resolvedAbsolute).join('/');

  return ((resolvedAbsolute ? '/' : '') + resolvedPath) || '.';
};

// path.normalize(path)
// posix version
exports.normalize = function(path) {
var isAbsolute = path.charAt(0) === '/',
    trailingSlash = path.slice(-1) === '/';

// Normalize the path
path = normalizeArray(filter(path.split('/'), function(p) {
    return !!p;
  }), !isAbsolute).join('/');

  if (!path && !isAbsolute) {
    path = '.';
  }
  if (path && trailingSlash) {
    path += '/';
  }
  
  return (isAbsolute ? '/' : '') + path;
};


// posix version
exports.join = function() {
  var paths = Array.prototype.slice.call(arguments, 0);
  return exports.normalize(filter(paths, function(p, index) {
    return p && typeof p === 'string';
  }).join('/'));
};


exports.dirname = function(path) {
  var dir = splitPathRe.exec(path)[1] || '';
  var isWindows = false;
  if (!dir) {
    // No dirname
    return '.';
  } else if (dir.length === 1 ||
      (isWindows && dir.length <= 3 && dir.charAt(1) === ':')) {
    // It is just a slash or a drive letter with a slash
    return dir;
  } else {
    // It is a full dirname, strip trailing slash
    return dir.substring(0, dir.length - 1);
  }
};


exports.basename = function(path, ext) {
  var f = splitPathRe.exec(path)[2] || '';
  // TODO: make this comparison case-insensitive on windows?
  if (ext && f.substr(-1 * ext.length) === ext) {
    f = f.substr(0, f.length - ext.length);
  }
  return f;
};


exports.extname = function(path) {
  return splitPathRe.exec(path)[3] || '';
};

});

require.define("/lib/profiles/algo-diff-xcc.js", function (require, module, exports, __dirname, __filename) {
    var tree = require('../delta/tree');
var xcc = require('../delta/xcc');

/**
 * Return new initialized instance of XCC diff algorithm.
 */
exports.createDiffAlgorithm = function(doc1, doc2, equals) {
    var diff;

    if (!doc1.tree || !doc2.tree) {
        throw new Error('Parameter error: Document objects must have tree property');
    }

    diff = new xcc.Diff(doc1.tree, doc2.tree);

    if (equals) {
        diff.equals = equals;
    }

    return diff;
}

/**
 * Return new tree matching object
 */
exports.createMatching = function() {
    return new tree.Matching();
}

});

require.define("/lib/delta/tree.js", function (require, module, exports, __dirname, __filename) {
    /**
 * @file:   A collection of classes supporting tree structures and operations
 * @module  tree
 */

/**
 * Create a new tree node and set its value and optionally user data.
 *
 * @constructor
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
};


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
 *
 * @constructor
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
 *
 * @constructor
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
};


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
};


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
};


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
        if (refnode.hasOwnProperty(this.propname)) {
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
 *
 * @constructor
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
};


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
    if (refnode.hasOwnProperty(this.propname)) {
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
    // Check cache
    if (refnode.hasOwnProperty(this.propname)) {
        return this.get(refnode, this.size(refnode));
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
 * Return the size of a subtree when traversed using this index
 * Static function: must work also with nodes which are not part of the index.
 */
DocumentOrderIndex.prototype.size = function(refnode) {
    var i=0;
    refnode.forEach(function(n) {
        i++;
    });
    return i;
};


/**
 * Return an array of all nodes contained in the subtree under refnode in
 * document order index.
 * Static function: must work also with nodes which are not part of the index.
 */
DocumentOrderIndex.prototype.flatten = function(refnode) {
    var result = [];
    refnode.forEach(function(n) {
        result.push(n);
    });
    return result;
};


/**
 * Simple subtree hashing algorithm.
 *
 * @constructor
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
};


/**
 * @constructor
 */
function NodeHashIndex(nodehash, propname) {
    this.nodehash = nodehash;
    this.propname = propname || 'nodehash';
}


NodeHashIndex.prototype.get = function(node) {
    if (node) {
        if (!(node.hasOwnProperty(this.propname))) {
            node[this.propname] = this.nodehash.process(node);
        }

        return node[this.propname];
    }
};


/**
 * @constructor
 */
function TreeHashIndex(treehash, propname) {
    this.treehash = treehash;
    this.propname = propname || 'treehash';
}


TreeHashIndex.prototype.get = function(node) {
    if (node) {
        if (!(node.hasOwnProperty(this.propname))) {
            node[this.propname] = this.treehash.process(node);
        }

        return node[this.propname];
    }
};


/**
 * Construct a new tree anchor object. The tree anchor is a pure data object
 * used to point to a position in the tree. The object has the following
 * properties:
 *
 * base
 *      The base node of the anchor. If the anchor points at the root node,
 *      base is undefined.
 *
 * target
 *      The target node this anchor points at. This node is a child node of
 *      base. This property may be undefined if the anchor points before or
 *      after the children list.
 *
 * index
 *      The index into the children list of the base node. This property is
 *      undefined when the anchor points at the root of the tree.
 *
 * @param root  The root node of the tree.
 * @param base  The base node for this anchor. If index is left away, this
 *              parameter specifies the target node.
 * @param index The child index of the target node.
 *
 * @constructor
 */
function Anchor(root, base, index) {
    if (!root) {
        throw new Error('Parameter error: need a reference to the tree root');
    }

    if (!base || (root === base && typeof index === 'undefined')) {
        this.base = undefined;
        this.target = root;
        this.index = undefined;
    }
    else if (typeof index === 'undefined') {
        this.base = base.par;
        this.target = base;
        this.index = base.childidx;
    }
    else {
        this.base = base;
        this.target = base.children[index];
        this.index = index;
    }
}


exports.Node = Node;
exports.Matching = Matching;
exports.GenerationIndex = GenerationIndex;
exports.DocumentOrderIndex = DocumentOrderIndex;
exports.SimpleTreeHash = SimpleTreeHash;
exports.NodeHashIndex = NodeHashIndex;
exports.TreeHashIndex = TreeHashIndex;
exports.Anchor = Anchor;

});

require.define("/lib/delta/xcc.js", function (require, module, exports, __dirname, __filename) {
    /**
 * @file:   Implementation of Rönnau/Berghoff XML tree diff algorithm XCC.
 *
 * @see:
 * * http://dx.doi.org/10.1007/s00450-010-0140-2
 * * https://launchpad.net/xcc
 *
 * @module  xcc
 */

/** @ignore */
var lcs = require('./lcs');

/**
 * @constructor
 */
function Diff(a, b, options) {
    this.a = a; // Root node of tree a
    this.b = b; // Root node of tree b
    this.options = options || {
        'ludRejectCallbacks': undefined,
            'detectLeafUpdates': true
    };
}

/**
 * Create a matching between the two nodes using the xcc diff algorithm
 */
Diff.prototype.matchTrees = function(matching) {
    // Associate root nodes
    matching.put(this.b, this.a);

    this.matchLeafLCS(matching);
    if (this.options.detectLeafUpdates) {
        this.matchLeafUpdates(matching);
    }
};


/**
 * Default equality test. Override this method if you need to test other
 * node properties instead/beside node value.
 */
Diff.prototype.equals = function(a, b) {
    return (a.value === b.value);
};


/**
 * Identify unchanged leaves by comparing them using myers longest common
 * subsequence algorithm.
 */
Diff.prototype.matchLeafLCS = function(matching) {
    var a_leaves = [],
        b_leaves = [],
        lcsinst = new lcs.LCS(a_leaves, b_leaves);

    // Leaves are considered equal if their values match and if they have
    // the same tree depth. Need to wrap the equality-test function into
    // a closure executed immediately in order to maintain correct context
    // (rename 'this' into 'that').
    lcsinst.equals = (function(that){
        return function(a, b) {
            return a.depth === b.depth && that.equals(a, b);
        };
    }(this));

    // Populate leave-node arrays.
    this.a.forEachDescendant(function(n) {
        if (n.children.length === 0) {
            a_leaves.push(n);
        }
    });
    this.b.forEachDescendant(function(n) {
        if (n.children.length === 0) {
            b_leaves.push(n);
        }
    });

    // Identify structure-preserving changes. Run lcs over leave nodes of
    // tree a and tree b. Associate the identified leaf nodes and also
    // their ancestors except if this would result in structure-affecting
    // change.
    lcsinst.forEachCommonSymbol(function(x, y) {
        var a = a_leaves[x], b = b_leaves[y], a_nodes = [], b_nodes = [], i;

        // Bubble up hierarchy until we encounter the first ancestor which
        // already has been matched. Record potential pairs in the a_nodes and
        // b_nodes arrays.
        while(a && b && !matching.get(a) && !matching.get(b)) {
            a_nodes.push(a);
            b_nodes.push(b);
            a = a.par;
            b = b.par;
        }

        // Record nodes a and b and all of their ancestors in the matching if
        // and only if the nearest matched ancestors are partners.
        if (a && b && a === matching.get(b)) {
            for (i=0; i<a_nodes.length; i++) {
                matching.put(a_nodes[i], b_nodes[i]);
            }
        }
    }, this);
};


/**
 * Identify leaf-node updates by traversing descendants of b_node top-down.
 * b_node must already be part of the matching.
 */
Diff.prototype.matchLeafUpdatesOnDescendants = function(matching, a_node, reject) {
    var a_nodes = a_node.children,
        b_nodes = matching.get(a_node).children,
        pm = true,  // True if the previous node pair matched
        i = 0,      // Array index into a_nodes
        k = 0,      // Array index into b_nodes
        a,          // Current candidate node in a_nodes
        b;          // Current candidate node in b_nodes

    // Loop through a_nodes and b_nodes simultaneously
    while (a_nodes[i] && b_nodes[k]) {
        a = a_nodes[i];
        b = b_nodes[k];

        if (reject && !matching.get(a) && reject(a)) {
            // Skip a if it gets rejected by the user defined function
            pm = false;
            i++;
        }
        else if (reject && !matching.get(b) && reject(b)) {
            // Skip b if it gets rejected by the user defined function
            pm = false;
            k++;
        }
        else if (pm && !matching.get(a) && !matching.get(b) && a.children.length === 0 && b.children.length === 0) {
            // If the previous sibling takes part in the matching and both
            // candidates are leaf-nodes, they should form a pair (leaf-update)
            matching.put(a, b);
            i++;
            k++;
        }
        else if (pm && !matching.get(a) && !matching.get(b) && this.equals(a, b)) {
            // If the previous sibling takes part in the matching and both
            // candidates have the same value, they should form a pair
            matching.put(a, b);
            // Recurse
            this.matchLeafUpdatesOnDescendants(matching, a, reject);
            i++;
            k++;
        }
        else if (!matching.get(a)) {
            // Skip a if above rules did not apply and a is not in the matching
            pm = false;
            i++;
        }
        else if (!matching.get(b)) {
            // Skip b if above rules did not apply and b is not in the matching
            pm = false;
            k++;
        }
        else if (a === matching.get(b)) {
            // Recurse, both candidates are in the matching
            this.matchLeafUpdatesOnDescendants(matching, a, reject);
            pm = true;
            i++;
            k++;
        }
        else {
            // Both candidates are in the matching but they are no partners.
            // This is impossible, bail out.
            throw new Error('Matching is not consistent');
        }
    }
}


/**
 * Detect updated leaf nodes by analyzing their neighborhood top-down.
 */
Diff.prototype.matchLeafUpdates = function(matching) {
    var i, rejects = this.options.ludRejectCallbacks || [undefined];
    for (i=0; i<rejects.length; i++) {
        this.matchLeafUpdatesOnDescendants(matching, this.b, rejects[i]);
    }
};


/**
 * Return an updater function for Delta.collect
 */
Diff.prototype.createUpdater = function(matching) {
    return (function(that){
        return function(node, callback, T) {
            var partner = matching.get(node);
            if (!that.equals(node, partner)) {
                callback.call(T, node, partner);
            }
        };
    }(this));
};


exports.Diff = Diff;

});

require.define("/lib/delta/lcs.js", function (require, module, exports, __dirname, __filename) {
    /**
 * @file:   Implementation of Myers linear space longest common subsequence
 *          algorithm.
 * @see:
 * * http://dx.doi.org/10.1007/BF01840446
 * * http://citeseer.ist.psu.edu/viewdoc/summary?doi=10.1.1.4.6927
 *
 * @module  lcs
 */

/**
 * Create a new instance of the LCS implementation.
 *
 * @param a     The first sequence
 * @param b     The second sequence
 *
 * @constructor
 */
function LCS(a, b) {
    this.a = a;
    this.b = b;
}


/**
 * Returns true if the sequence members a and b are equal. Override this
 * method if your sequences contain special things.
 */
LCS.prototype.equals = function(a, b) {
    return (a === b);
};


/**
 * Compute longest common subsequence using myers divide & conquer linear
 * space algorithm.
 *
 * Call a callback for each snake which is part of the longest common
 * subsequence.
 *
 * This algorithm works with strings and arrays. In order to modify the
 * equality-test, just override the equals(a, b) method on the LCS
 * object.
 *
 * @param callback  A function(x, y) called for A[x] and B[y] for symbols
 *                  taking part in the LCS.
 * @param T         Context object bound to "this" when the callback is
 *                  invoked.
 * @param limit     A Limit instance constraining the window of operation to
 *                  the given limit. If undefined the algorithm will iterate
 *                  over the whole sequences a and b.
 */
LCS.prototype.compute = function(callback, T, limit) {
    var midleft = new exports.KPoint(),
        midright = new exports.KPoint(),
        d;

    if (typeof limit === 'undefined') {
        limit = this.defaultLimit();
    }

    // Return if there is nothing left
    if (limit.N <= 0 && limit.M <= 0) {
        return 0;
    }

    // Callback for each right-edge when M is zero and return number of
    // edit script operations.
    if (limit.N > 0 && limit.M === 0) {
        midleft.set(0, 0).translate(limit.left);
        midright.set(1, 1).translate(limit.left);
        for (d = 0; d < limit.N; d++) {
            callback.call(T, midleft, midright);
            midleft.moveright();
            midright.moveright();
        }
        return d;
    }

    // Callback for each down-edge when N is zero and return number of edit
    // script operations.
    if (limit.N === 0 && limit.M > 0) {
        midleft.set(0, 0).translate(limit.left);
        midright.set(0, -1).translate(limit.left);
        for (d = 0; d < limit.M; d++) {
            callback.call(T, midleft, midright);
            midleft.movedown();
            midright.movedown();
        }
        return d;
    }

    // Find the middle snake and store the result in midleft and midright
    d = this.middleSnake(midleft, midright, limit);

    if (d === 0) {
        // No single insert / delete operation was identified by the middle
        // snake algorithm, this means that all the symbols between left and
        // right are equal -> one straight diagonal on k=0
        if (!limit.left.equal(limit.right)) {
            callback.call(T, limit.left, limit.right);
        }
    }
    else if (d === 1) {
        // Middle-snake algorithm identified exactly one operation. Report
        // the involved snake(s) to the caller.
        if (!limit.left.equal(midleft)) {
            callback.call(T, limit.left, midleft);
        }

        if (!midleft.equal(midright)) {
            callback.call(T, midleft, midright);
        }

        if (!midright.equal(limit.right)) {
            callback.call(T, midright, limit.right);
        }
    }
    else {
        // Recurse if the middle-snake algorithm encountered more than one
        // operation.
        if (!limit.left.equal(midleft)) {
            this.compute(callback, T, new exports.Limit(limit.left, midleft));
        }

        if (!midleft.equal(midright)) {
            callback.call(T, midleft, midright);
        }

        if (!midright.equal(limit.right)) {
            this.compute(callback, T, new exports.Limit(midright, limit.right));
        }
    }

    return d;
};


/**
 * Call a callback for each symbol which is part of the longest common
 * subsequence between A and B.
 *
 * Given that the two sequences A and B were supplied to the LCS
 * constructor, invoke the callback for each pair A[x], B[y] which is part
 * of the longest common subsequence of A and B.
 *
 * This algorithm works with strings and arrays. In order to modify the
 * equality-test, just override the equals(a, b) method on the LCS
 * object.
 *
 * Usage:
 * <code>
 * var lcs = [];
 * var A = 'abcabba';
 * var B = 'cbabac';
 * var l = new LCS(A, B);
 * l.forEachCommonSymbol(function(x, y) {
 *     lcs.push(A[x]);
 * });
 * console.log(lcs);
 * // -> [ 'c', 'a', 'b', 'a' ]
 * </code>
 *
 * @param callback  A function(x, y) called for A[x] and B[y] for symbols
 *                  taking part in the LCS.
 * @param T         Context object bound to "this" when the callback is
 *                  invoked.
 */
LCS.prototype.forEachCommonSymbol = function(callback, T) {
    return this.compute(function(left, right) {
        this.forEachPositionInSnake(left, right, callback, T);
    }, this);
};


/**
 * Internal use. Compute new values for the next head on the given k-line
 * in forward direction by examining the results of previous calculations
 * in V in the neighborhood of the k-line k.
 *
 * @param head  (Output) Reference to a KPoint which will be populated
 *              with the new values
 * @param k     (In) Current k-line
 * @param kmin  (In) Lowest k-line in current d-round
 * @param kmax  (In) Highest k-line in current d-round
 * @param limit (In) Current lcs search limits (left, right, N, M, delta, dmax)
 * @param V     (In-/Out) Vector containing the results of previous
 *              calculations. This vector gets updated automatically by
 *              nextSnakeHeadForward method.
 */
LCS.prototype.nextSnakeHeadForward = function(head, k, kmin, kmax, limit, V) {
    var k0, x, bx, by, n;

    // Determine the preceeding snake head. Pick the one whose furthest
    // reaching x value is greatest.
    if (k === kmin || (k !== kmax && V[k-1] < V[k+1])) {
        // Furthest reaching snake is above (k+1), move down.
        k0 = k+1;
        x = V[k0];
    }
    else {
        // Furthest reaching snake is left (k-1), move right.
        k0 = k-1;
        x = V[k0] + 1;
    }

    // Follow the diagonal as long as there are common values in a and b.
    bx = limit.left.x;
    by = bx - (limit.left.k + k);
    n = Math.min(limit.N, limit.M + k);
    while (x < n && this.equals(this.a[bx + x], this.b[by + x])) {
        x++;
    }

    // Store x value of snake head after traversing the diagonal in forward
    // direction.
    head.set(x, k).translate(limit.left);

    // Memozie furthest reaching x for k
    V[k] = x;

    // Return k-value of preceeding snake head
    return k0;
};


/**
 * Internal use. Compute new values for the next head on the given k-line
 * in reverse direction by examining the results of previous calculations
 * in V in the neighborhood of the k-line k.
 *
 * @param head  (Output) Reference to a KPoint which will be populated
 *              with the new values
 * @param k     (In) Current k-line
 * @param kmin  (In) Lowest k-line in current d-round
 * @param kmax  (In) Highest k-line in current d-round
 * @param limit (In) Current lcs search limits (left, right, N, M, delta, dmax)
 * @param V     (In-/Out) Vector containing the results of previous
 *              calculations. This vector gets updated automatically by
 *              nextSnakeHeadForward method.
 */
LCS.prototype.nextSnakeHeadBackward = function(head, k, kmin, kmax, limit, V) {
    var k0, x, bx, by, n;

    // Determine the preceeding snake head. Pick the one whose furthest
    // reaching x value is greatest.
    if (k === kmax || (k !== kmin && V[k-1] < V[k+1])) {
        // Furthest reaching snake is underneath (k-1), move up.
        k0 = k-1;
        x = V[k0];
    }
    else {
        // Furthest reaching snake is left (k-1), move right.
        k0 = k+1;
        x = V[k0]-1;
    }

    // Store x value of snake head before traversing the diagonal in
    // reverse direction.
    head.set(x, k).translate(limit.left);

    // Follow the diagonal as long as there are common values in a and b.
    bx = limit.left.x - 1;
    by = bx - (limit.left.k + k);
    n = Math.max(k, 0);
    while (x > n && this.equals(this.a[bx + x], this.b[by + x])) {
        x--;
    }

    // Memozie furthest reaching x for k
    V[k] = x;

    // Return k-value of preceeding snake head
    return k0;
};


/**
 * Internal use. Find the middle snake and set lefthead to the left end and
 * righthead to the right end.
 *
 * @param lefthead  (Output) A reference to a KPoint which will be
 *                  populated with the values corresponding to the left end
 *                  of the middle snake.
 * @param righthead (Output) A reference to a KPoint which will be
 *                  populated with the values corresponding to the right
 *                  end of the middle snake.
 * @param limit     (In) Current lcs search limits (left, right, N, M, delta, dmax)
 *
 * @returns         d, number of edit script operations encountered within
 *                  the given limit
 */
LCS.prototype.middleSnake = function (lefthead, righthead, limit) {
    var d, k, head, k0;
    var delta = limit.delta;
    var dmax = Math.ceil(limit.dmax / 2);
    var checkBwSnake = (delta % 2 === 0);
    var Vf = {};
    var Vb = {};

    Vf[1] = 0;
    Vb[delta-1] = limit.N;
    for (d = 0; d <= dmax; d++) {
        for (k = -d; k <= d; k+=2) {
            k0 = this.nextSnakeHeadForward(righthead, k, -d, d, limit, Vf);

            // check for overlap
            if (!checkBwSnake && k >= -d-1+delta && k <= d-1+delta) {
                if (Vf[k] >= Vb[k]) {
                    // righthead already contains the right stuff, now set
                    // the lefthead to the values of the last k-line.
                    lefthead.set(Vf[k0], k0).translate(limit.left);
                    // return the number of edit script operations
                    return 2 * d - 1;
                }
            }
        }

        for (k = -d+delta; k <= d+delta; k+=2) {
            k0 = this.nextSnakeHeadBackward(lefthead, k, -d+delta, d+delta, limit, Vb);

            // check for overlap
            if (checkBwSnake && k >= -d && k <= d) {
                if (Vf[k] >= Vb[k]) {
                    // lefthead already contains the right stuff, now set
                    // the righthead to the values of the last k-line.
                    righthead.set(Vb[k0], k0).translate(limit.left);
                    // return the number of edit script operations
                    return 2 * d;
                }
            }
        }
    }
};


/**
 * Return the default limit spanning the whole input
 */
LCS.prototype.defaultLimit = function() {
    return new exports.Limit(
            new exports.KPoint(0,0),
            new exports.KPoint(this.a.length, this.a.length - this.b.length));
};


/**
 * Invokes a function for each position in the snake between the left and
 * the right snake head.
 *
 * @param left      Left KPoint
 * @param right     Right KPoint
 * @param callback  Callback of the form function(x, y)
 * @param T         Context object bound to "this" when the callback is
 *                  invoked.
 */
LCS.prototype.forEachPositionInSnake = function(left, right, callback, T) {
    var k = right.k;
    var x = (k > left.k) ? left.x + 1 : left.x;
    var n = right.x;

    while (x < n) {
        callback.call(T, x, x-k);
        x++;
    }
};


/**
 * Create a new KPoint instance.
 *
 * A KPoint represents a point identified by an x-coordinate and the
 * number of the k-line it is located at.
 *
 * @constructor
 */
var KPoint = function(x, k) {
    /**
     * The x-coordinate of the k-point.
     */
    this.x = x;

    /**
     * The k-line on which the k-point is located at.
     */
    this.k = k;
};


/**
 * Return a new copy of this k-point.
 */
KPoint.prototype.copy = function() {
    return new KPoint(this.x, this.k);
};


/**
 * Set the values of a k-point.
 */
KPoint.prototype.set = function(x, k) {
    this.x = x;
    this.k = k;
    return this;
};


/**
 * Translate this k-point by adding the values of the given k-point.
 */
KPoint.prototype.translate = function(other) {
    this.x += other.x;
    this.k += other.k;
    return this;
};


/**
 * Move the point left by d units
 */
KPoint.prototype.moveleft = function(d) {
    this.x -= d || 1;
    this.k -= d || 1;
    return this;
};


/**
 * Move the point right by d units
 */
KPoint.prototype.moveright = function(d) {
    this.x += d || 1;
    this.k += d || 1;
    return this;
};


/**
 * Move the point up by d units
 */
KPoint.prototype.moveup = function(d) {
    this.k -= d || 1;
    return this;
};


/**
 * Move the point down by d units
 */
KPoint.prototype.movedown = function(d) {
    this.k += d || 1;
    return this;
};


/**
 * Returns true if the given k-point has equal values
 */
KPoint.prototype.equal = function(other) {
    return (this.x === other.x && this.k === other.k);
};


/**
 * Create a new LCS Limit instance. This is a pure data object which holds
 * precalculated parameters for the lcs algorithm.
 *
 * @constructor
 */
var Limit = function(left, right) {
    this.left = left;
    this.right = right;
    this.delta = right.k - left.k;
    this.N = right.x - left.x;
    this.M = this.N - this.delta;
    this.dmax = this.N + this.M;
};


// CommonJS exports
exports.LCS = LCS;
exports.KPoint = KPoint;
exports.Limit = Limit;

});

require.define("/lib/profiles/algo-diff-skelmatch.js", function (require, module, exports, __dirname, __filename) {
    var tree = require('../delta/tree');
var skelmatch = require('../delta/skelmatch');

/**
 * Return new initialized instance of skelmatch diff algorithm.
 */
exports.createDiffAlgorithm = function(doc1, doc2, equals) {
    var diff;

    if (!doc1.tree || !doc2.tree) {
        throw new Error('Parameter error: Document objects must have tree property');
    }

    diff = new skelmatch.Diff(doc1.tree, doc2.tree);

    if (equals) {
        diff.equals = equals;
    }

    return diff;
}

/**
 * Return new tree matching object
 */
exports.createMatching = function() {
    return new tree.Matching();
}

});

require.define("/lib/delta/skelmatch.js", function (require, module, exports, __dirname, __filename) {
    /**
 * @fileoverview    Implementation of the "skelmatch" tree matching algorithm.
 *
 * This algorithm is heavily inspired by the XCC tree matching algorithm by
 * Sebastian Rönnau and Uwe M. Berghoff. It shares the idea that the
 * interesting bits are found towards the bottom of the tree.
 *
 * Skel-match divides the problem of finding a partial matching between two
 * structured documents represented by ordered trees into two subproblems:
 * 1.   Detect changes in document content (Longest Common Subsequence among
 *      leaf-nodes).
 * 2.   Detect changes in remaining document structure.
 *
 * By default leaf-nodes are considered content, and internal nodes are
 * treated as structure.
 */


/** @ignore */
var lcs = require('./lcs');


/**
 * @constructor
 */
function Diff(a, b, options) {
    this.a = a; // Root node of tree a
    this.b = b; // Root node of tree b
}


/**
 * Create a matching between the two nodes using the skelmatch algorithm
 */
Diff.prototype.matchTrees = function(matching) {
    // Associate root nodes
    matching.put(this.b, this.a);

    this.matchContent(matching);
    this.matchStructure(matching);
};


/**
 * Return true if the given node should be treated as a content node.
 *
 * Default: Return true for leaf-nodes.
 */
Diff.prototype.isContent = function(node) {
    return (node.children.length === 0);
};


/**
 * Return true if the given node should be treated as a structure node.
 *
 * Default: Return true for internal nodes.
 */
Diff.prototype.isStructure = function(node) {
    return !this.isContent(node);
};


/**
 * Default equality test for node values. Override this method if you need to
 * test other node properties instead/beside node value.
 */
Diff.prototype.equals = function(a, b) {
    return (a.value === b.value);
};


/**
 * Default equality test for content nodes. Also test all descendants of a and
 * b for equality. Override this method if you want to use tree hashing for
 * this purpose.
 */
Diff.prototype.equalContent = function(a, b) {
    var i;

    if (a.children.length !== b.children.length) {
        return false;
    }
    for (i = 0; i < a.children.length; i++) {
        if (!this.equalContent(a.children[i], b.children[i])) {
            return false;
        }
    }

    return this.equals(a, b);
};


/**
 * Default equality test for structure nodes. Return true if ancestors either
 * have the same node value or if they form a pair. Override this method if you
 * want to use tree hashing for this purpose.
 */
Diff.prototype.equalStructure = function(matching, a, b) {
    if (!matching.get(a) && !matching.get(b)) {
        // Return true if all ancestors fullfill the requirement and if the
        // values of a and b are equal.
        return this.equalStructure(matching, a.par, b.par) && this.equals(a, b);
    }
    else {
        // Return true if a and b form a pair.
        return a === matching.get(b);
    }
};


/**
 * Return true if a pair is found in the ancestor chain of a and b.
 */
Diff.prototype.matchingCheckAncestors = function(matching, a, b) {
    if (!a || !b) {
        return false;
    }
    else if (!matching.get(a) && !matching.get(b)) {
        return this.matchingCheckAncestors(matching, a.par, b.par);
    }
    else {
        return a === matching.get(b);
    }
};


/**
 * Put a and b and all their unmatched ancestors into the matching.
 */
Diff.prototype.matchingPutAncestors = function(matching, a, b) {
    if (!a || !b) {
        throw new Error('Parameter error: may not match undefined tree nodes');
    }
    else if (!matching.get(a) && !matching.get(b)) {
        this.matchingPutAncestors(matching, a.par, b.par);
        matching.put(a, b);
    }
    else if (a !== matching.get(b)) {
        throw new Error('Parameter error: fundamental matching rule violated.');
    }
};


/**
 * Identify unchanged leaves by comparing them using myers longest common
 * subsequence algorithm.
 */
Diff.prototype.matchContent = function(matching) {
    var a_content = [],
        b_content = [],
        lcsinst = new lcs.LCS(a_content, b_content);

    // Leaves are considered equal if their values match and if they have
    // the same tree depth. Need to wrap the equality-test function into
    // a closure executed immediately in order to maintain correct context
    // (rename 'this' into 'that').
    lcsinst.equals = (function(that){
        return function(a, b) {
            return a.depth === b.depth && that.equalContent(a, b);
        };
    }(this));

    // Populate leave-node arrays.
    this.a.forEachDescendant(function(n) {
        if (this.isContent(n)) a_content.push(n);
    }, this);
    this.b.forEachDescendant(function(n) {
        if (this.isContent(n)) b_content.push(n);
    }, this);

    // Identify structure-preserving changes. Run lcs over leave nodes of
    // tree a and tree b. Associate the identified leaf nodes and also
    // their ancestors except if this would result in structure-affecting
    // change.
    lcsinst.forEachCommonSymbol(function(x, y) {
        var a = a_content[x], b = b_content[y];

        // Verify that ancestor chain allows that a and b to form a pair.
        if (this.matchingCheckAncestors(matching, a, b)) {
            // Record nodes a and b and all of their ancestors in the
            // matching if and only if the nearest matched ancestors are
            // partners.
            this.matchingPutAncestors(matching, a, b);
        }
    }, this);
};


/**
 * Return an array of the bottom-most structure-type nodes beneath the given
 * node.
 */
Diff.prototype.collectBones = function(node) {
    var result = [], outer, i = 0;

    if (this.isStructure(node)) {
        for (i = 0; i < node.children.length; i++) {
            outer = this.collectBones(node.children[i]);
            Array.prototype.push.apply(outer);
        }
        if (result.length === 0) {
            // If we do not have any structure-type descendants, this node is
            // the outer most.
            result.push(node);
        }
    }

    return result;
}


/**
 * Invoke the given callback with each sequence of unmatched nodes.
 *
 * @param matching  A partial matching
 * @param a_sibs    A sequence of siblings from tree a
 * @param b_sibs    A sequence of siblings from tree b
 * @param callback  A function (a_nodes, b_nodes, a_parent, b_parent) called
 *                  for every consecutive sequence of nodes from a_sibs and
 *                  b_sibs seperated by one or more node pairs.
 * @param T         Context object bound to "this" when the callback is
 *                  invoked.
 */
Diff.prototype.forEachUnmatchedSequenceOfSiblings = function(matching,
        a_sibs, b_sibs, callback, T)
{
    var a_xmatch = [],  // Array of consecutive sequence of unmatched nodes
                        // from a_sibs.
        b_xmatch = [],  // Array of consecutive sequence of unmatched nodes
                        // from b_sibs.
        i = 0,      // Array index into a_sibs
        k = 0,      // Array index into b_sibs
        a,          // Current candidate node in a_sibs
        b;          // Current candidate node in b_sibs

    // Loop through a_sibs and b_sibs simultaneously
    while (a_sibs[i] || b_sibs[k]) {
        a = a_sibs[i];
        b = b_sibs[k];

        if (a && !matching.get(a)) {
            // Skip a if above rules did not apply and a is not in the matching
            a_xmatch.push(a);
            i++;
        }
        else if (b && !matching.get(b)) {
            // Skip b if above rules did not apply and b is not in the matching
            b_xmatch.push(b);
            k++;
        }
        else if (a && b && a === matching.get(b)) {
            // Collect nodes at border structure and detect matches
            callback.call(T, a_xmatch, b_xmatch, a, b);
            a_xmatch = [];
            b_xmatch = [];

            // Recurse, both candidates are in the matching
            this.forEachUnmatchedSequenceOfSiblings(matching, a.children, b.children, callback, T);
            i++;
            k++;
        }
        else {
            // Both candidates are in the matching but they are no partners.
            // This is impossible, bail out.
            throw new Error('Matching is not consistent');
        }
    }

    if (a_xmatch.length > 0 || b_xmatch.length > 0) {
        callback.call(T, a_xmatch, b_xmatch, a, b);
    }
}


/**
 * Traverse a partial matching and detect equal structure-type nodes between
 * matched content nodes.
 */
Diff.prototype.matchStructure = function(matching) {
    // Collect unmatched sequences of siblings from tree a and b. Run lcs over
    // bones for each.
    this.forEachUnmatchedSequenceOfSiblings(matching, this.a.children,
            this.b.children, function(a_nodes, b_nodes) {
        var a_bones = [],
            b_bones = [],
            lcsinst = new lcs.LCS(a_bones, b_bones);

        // Override equality test.
        lcsinst.equals = (function(that){
            return function(a, b) {
                return that.equalStructure(matching, a, b);
            };
        }(this));

        // Populate bone array
        a_nodes.forEach(function(n) {
            Array.prototype.push.apply(a_bones, this.collectBones(n));
        }, this);
        b_nodes.forEach(function(n) {
            Array.prototype.push.apply(b_bones, this.collectBones(n));
        }, this);

        // Identify structure-preserving changes. Run lcs over lower bone ends
        // in tree a and tree b. Associate the identified nodes and also their
        // ancestors except if this would result in structure-affecting change.
        lcsinst.forEachCommonSymbol(function(x, y) {
            var a = a_bones[x], b = b_bones[y];

            // Verify that ancestor chain allows that a and b to form a pair.
            if (this.matchingCheckAncestors(matching, a, b)) {
                // Record nodes a and b and all of their ancestors in the
                // matching if and only if the nearest matched ancestors are
                // partners.
                this.matchingPutAncestors(matching, a, b);
            }
        }, this);
    }, this);
};

exports.Diff = Diff;

});

require.define("/lib/profiles/doc-tree-xml.js", function (require, module, exports, __dirname, __filename) {
    var xmlpayload = require('../delta/xmlpayload');
var fnv132 = require('../delta/fnv132');
var tree = require('../delta/tree');
var domtree = require('../delta/domtree');
var domdelta = require('../delta/domdelta');


/**
 * Return shared payload handler.
 */
exports.payloadHandler = new xmlpayload.XMLPayloadHandler();


/**
 * Return shared tree adapter.
 */
exports.treeAdapter = new domtree.DOMTreeAdapter();


/**
 * Return a new empty delta document.
 */
exports.createEmptyDocument = function() {
    var valueindex, treevalueindex;

    valueindex = new tree.NodeHashIndex(new domtree.DOMNodeHash(fnv132.Hash));
    treevalueindex = new tree.TreeHashIndex(
            new tree.SimpleTreeHash(fnv132.Hash, valueindex));

    if (typeof domdoc === 'string') {
        src = domdoc;
        domdoc = exports.payloadHandler.parseString(domdoc);
    }

    return {
        'type': 'xml',
        'name': 'untitled.xml',
        'data': exports.payloadHandler.createDocument(),
        'tree': undefined,
        'src': '',
        'valueindex': valueindex,
        'treevalueindex': treevalueindex
    };
};


/**
 * Return new document objects suitable for supplying to diff.Diff
 */
exports.loadInputDocument = function(domdoc, name) {
    var src, result, valueindex, treevalueindex;

    valueindex = new tree.NodeHashIndex(new domtree.DOMNodeHash(fnv132.Hash));
    treevalueindex = new tree.TreeHashIndex(
            new tree.SimpleTreeHash(fnv132.Hash, valueindex));

    if (typeof domdoc === 'string') {
        src = domdoc;
        domdoc = exports.payloadHandler.parseString(domdoc);
    }

    result = {
        'type': 'xml',
        'name': name,
        'data': domdoc,
        'tree': exports.treeAdapter.adaptDocument(domdoc),
        'src': src,
        'valueindex': valueindex,
        'treevalueindex': treevalueindex
    };

    return result;
}


/**
 * Return new document objects suitable for supplying to diff.Diff as the
 * original (unchanged) document.
 */
exports.loadOriginalDocument = function(domdoc, name) {
    var result = exports.loadInputDocument(domdoc, name);

    var nodeindex = new tree.DocumentOrderIndex(result.tree);
    nodeindex.buildAll();
    result.nodeindex = nodeindex;

    return result;
}


/**
 * Return the proper document fragemnt adapter for the given deltadoc.
 */
exports.createFragmentAdapter = function(type) {
    if (type === 'xml') {
        return new xmlpayload.XMLFragmentAdapter(exports.treeAdapter);
    }
    else {
        return new xmlpayload.SerializedXMLFragmentAdapter(exports.treeAdapter);
    }
}


/**
 * Return the proper node equality test.
 */
exports.createNodeEqualityTest = function(doc1, doc2) {
    if (!doc1.valueindex || !doc2.valueindex) {
        throw new Error('Parameter error: Document objects must have valueindex property');
    }

    // Use value index for node-comparison
    return function(a, b) {
        return doc1.valueindex.get(a) === doc2.valueindex.get(b);
    }
}


/**
 * Return the proper subtree equality test.
 */
exports.createTreeEqualityTest = function(doc1, doc2) {
    if (!doc1.treevalueindex || !doc2.treevalueindex) {
        throw new Error('Parameter error: Document objects must have treevalueindex property');
    }

    // Use value index for node-comparison
    return function(a, b) {
        return doc1.treevalueindex.get(a) === doc2.treevalueindex.get(b);
    }
}


/**
 * Return proper value checker.
 */
exports.createValueTest = function(doc) {
    if (!doc.valueindex) {
        throw new Error('Parameter error: Document objects must have valueindex property');
    }

    // Use value index for node-comparison
    return function(a, b) {
        return doc.valueindex.get(a) === b;
    }
};


/**
 * Returns delta operation handler factory
 */
exports.createHandlerFactory = function() {
    return new domdelta.DOMOperationHandlerFactory();
}

/**
 * Serialize the data property into the src string and return it.
 */
exports.serializeDocument = function(doc) {
    doc.src = exports.payloadHandler.serializeToString(doc.data);

    return doc.src;
};

});

require.define("/lib/delta/xmlpayload.js", function (require, module, exports, __dirname, __filename) {
    /**
 * @file:   Payload handler for XML/DOM documents
 * @module  xmlpayload
 */

/** @ignore */
var xmlshim = require('xmlshim');


/**
 * @constructor
 */
function XMLPayloadHandler() {
}

XMLPayloadHandler.prototype.serializeToString = function(doc) {
    return (new xmlshim.XMLSerializer).serializeToString(doc);
};

XMLPayloadHandler.prototype.parseString = function(string) {
    return (new xmlshim.DOMParser).parseFromString(string, 'text/xml');
};

XMLPayloadHandler.prototype.createDocument = function() {
    return xmlshim.implementation.createDocument('', '', null);
};

XMLPayloadHandler.prototype.createTreeFragmentAdapter = function(docadapter, type) {
    if (type === 'xml') {
        return new exports.XMLFragmentAdapter(docadapter);
    }
    else {
        return new exports.SerializedXMLFragmentAdapter(docadapter);
    }
};


/**
 * @constructor
 */
function XMLFragmentAdapter(docadapter) {
    this.docadapter = docadapter;
}

XMLFragmentAdapter.prototype.adapt = function(doc, nodes, deep) {
    var i, result = doc.createDocumentFragment();

    for (i = 0; i < nodes.length; i++) {
        result.appendChild(doc.importNode(nodes[i].data, deep));
    }

    return result;
};


XMLFragmentAdapter.prototype.importFragment = function(domnodes, deep) {
    var result = [], node, i;

    for (i=0; i<domnodes.length; i++) {
        node = this.docadapter.adaptElement(domnodes[i]);
        if (node) {
            result.push(node);
        }
    }

    return result;
};


/**
 * @constructor
 */
function SerializedXMLFragmentAdapter(docadapter) {
    XMLFragmentAdapter.call(this, docadapter);
}

SerializedXMLFragmentAdapter.prototype.adapt = function(doc, nodes, deep) {
    mydoc = xmlshim.implementation.createDocument('', '', null);

    var frag = XMLFragmentAdapter.prototype.adapt.call(this, mydoc, nodes, deep);
    var root = mydoc.createElement('values');

    root.appendChild(frag);
    mydoc.appendChild(root);

    return (new xmlshim.XMLSerializer).serializeToString(mydoc);
};

exports.XMLPayloadHandler = XMLPayloadHandler;
exports.XMLFragmentAdapter = XMLFragmentAdapter;
exports.SerializedXMLFragmentAdapter = SerializedXMLFragmentAdapter;

});

require.define("/node_modules/xmlshim/package.json", function (require, module, exports, __dirname, __filename) {
    module.exports = {"main":"./index.js","browserify":"./browser.js"}
});

require.define("/node_modules/xmlshim/browser.js", function (require, module, exports, __dirname, __filename) {
    exports.XMLSerializer = XMLSerializer;
exports.DOMParser = DOMParser;
exports.implementation = document.implementation;

});

require.define("/lib/delta/fnv132.js", function (require, module, exports, __dirname, __filename) {
    /**
 * @file: Implementation of FNV-1 32bit hash algorithm
 * @see: http://isthe.com/chongo/tech/comp/fnv/
 *
 * @module  fnv132
 */


/**
 * Constant FNV-1 32bit prime number
 *
 * @constant
 */
var FNV132_PRIME = 16777619;

/**
 * High 16 bits of FNV-1 32bit prime number
 *
 * @constant
 */
var FNV132_PRIME_H = (FNV132_PRIME >>> 16) & 0xFFFF;

/**
 * Low 16 bits of FNV-1 32bit prime number
 *
 * @constant
 */
var FNV132_PRIME_L = FNV132_PRIME & 0xFFFF;

/**
 * Constant FNV-1 32bit offset basis
 *
 * @constant
 */
var FNV132_INIT = 2166136261;

/**
 * Create and initialize a new 32bit FNV-1 hash object.
 *
 * @constructor
 */
function FNV132Hash() {
    this.hash = FNV132_INIT;
}


/**
 * Update the hash with the given string and return the new hash value. No
 * calculation is performed when the bytes-parameter is left out.
 */
FNV132Hash.prototype.update = function (bytes) {
    var i, ah, al;

    if (typeof bytes === 'undefined' || bytes === null) {
        return this.get();
    }

    if (typeof bytes === 'number') {
        // FXME: Actually we should test for non-integer numbers here.
        bytes = String.fromCharCode(
                (bytes & 0xFF000000) >>> 24,
                (bytes & 0x00FF0000) >>> 16,
                (bytes & 0x0000FF00) >>> 8,
                (bytes & 0x000000FF)
        );
    }

    if (typeof bytes !== 'string') {
        throw new Error(typeof bytes + ' not supported by FNV-1 Hash algorithm');
    }

    for (i=0; i<(bytes && bytes.length); i++) {
        // A rather complicated way to multiply this.hash times
        // FNV132_PRIME.  Regrettably a workaround is necessary because the
        // value of a Number class is represented as a 64bit floating point
        // internally. This can lead to precision issues if the factors are
        // big enough.
        //
        // Each factor is separated into two 16bit numbers by shifting left
        // the high part and masking the low one.
        ah = (this.hash >>> 16) & 0xFFFF;
        al = this.hash & 0xFFFF;

        // Now the both low parts are multiplied. Also each low-high pair
        // gets multiplied. There is no reason to multiply the high-high
        // pair because overflow is guaranteed here.  The result is the sum
        // of the three multiplications. Because of the floating point
        // nature of JavaScript numbers, bitwise operations are *not*
        // faster than multiplications. Therefore we do not use "<< 16"
        // here but instead "* 0x100000".
        this.hash = (al * FNV132_PRIME_L) +
            ((ah * FNV132_PRIME_L) * 0x10000) +
            ((al * FNV132_PRIME_H) * 0x10000);

        this.hash ^= bytes.charCodeAt(i);
    }

    // Get rid of signum
    return this.hash >>> 0;
};


/**
 * Return current hash value;
 */
FNV132Hash.prototype.get = function () {
    return this.hash >>> 0;
};

// CommonJS exports
exports.Hash = FNV132Hash;

});

require.define("/lib/delta/domtree.js", function (require, module, exports, __dirname, __filename) {
    /**
 * @file:   Adapter class converting an XML DOM document into a simple tree
 *          structure suitable for comparison using the XCC tree diff
 *          algorithm.
 *
 * @module  domtree
 */

/** @ignore */
var tree = require('./tree');

/**
 * A function that visits every node of a DOM tree in document order. Calls
 * a callback with the visited node and the result of the callback from
 * visitting the parent node.
 *
 * This function is a modified version of Douglas Crockfords walk_the_DOM
 * function from his book "Javascript: The Good Parts".
 *
 * @param node      The DOM node representing the starting point for the
 *                  mapping operation
 * @param callback  function(node, parents_result)
 * @param T         context parameter bound to "this" when invoking the
 *                  callback 
 * @param presult   Internal use.
 */
function mapdom(node, callback, T, presult) {
    var result = callback.call(T, node, presult);
    node = node.firstChild;
    while (node) {
        mapdom(node, callback, T, result);
        node = node.nextSibling;
    }
    return result;
}


/**
 * @constructor
 */
function DOMTreeAdapter() {
}


/**
 * Create node wrappers for the specified element or text node and all its
 * descentants and return toplevel wrapper.
 **/
DOMTreeAdapter.prototype.adaptElement = function(element) {
    return mapdom(element, function(node, wrappedParent) {
        var wrappedNode;

        if (node.nodeType === 1 || node.nodeType === 3) {
            // Use nodeName as the node value. In order to get proper results
            // when comparing XML trees, an equality-function based on a
            // hashing method must be supplied to the xcc instance.
            wrappedNode = new tree.Node(node.nodeName, node);
            if (wrappedParent) {
                wrappedParent.append(wrappedNode);
            }
        }

        return wrappedNode;
    }, this);
};


/**
 * Create node wrappers for all element and text nodes in the specified
 * document and return the root wrapper.
 */
DOMTreeAdapter.prototype.adaptDocument = function(doc) {
    return this.adaptElement(doc.documentElement);
};


/**
 * Populate the document with the given dom tree.
 */
DOMTreeAdapter.prototype.createDocument = function(doc, tree) {
    var root;

    root = doc.importNode(tree.data, true);
    doc.appendChild(root);
};


/**
 * @constructor
 */
function DOMNodeHash(HashAlgorithm) {
    this.HashAlgorithm = HashAlgorithm;
}


// FIXME: CDATA sections
DOMNodeHash.prototype.ELEMENT_PREFIX = '\x00\x00\x00\x01';
DOMNodeHash.prototype.ATTRIBUTE_PREFIX = '\x00\x00\x00\x02';
DOMNodeHash.prototype.TEXT_PREFIX = '\x00\x00\x00\x03';
DOMNodeHash.prototype.PI_PREFIX = '\x00\x00\x00\x07';
DOMNodeHash.prototype.SEPARATOR = '\x00\x00';

DOMNodeHash.prototype.process = function(node, hash) {
    var domnode = node.data;

    hash = hash || new this.HashAlgorithm();

    switch(domnode.nodeType) {
        case (domnode.ELEMENT_NODE):
            this.processElement(domnode, hash);
            break;

        case (domnode.ATTRIBUTE_NODE):
            this.processAttribute(domnode, hash);
            break;

        case (domnode.TEXT_NODE):
            this.processText(domnode, hash);
            break;

        default:
            console.error('DOMNodeHash: node-type ' + domnode.nodeType + ' not supported');
            break;
    }

    return hash.get();
};


/**
 * Helper method: Return qualified name of a DOM element or attribute node
 */
DOMNodeHash.prototype.qualifiedName = function(domnode) {
    var ns = '';
    if (domnode.namespaceURI) {
        ns = domnode.namespaceURI + ':';
    }
    return ns + domnode.nodeName.split(':').slice(-1)[0];
};


DOMNodeHash.prototype.processElement = function(domnode, hash) {
    var attrqns, attrnodes, i, n, qn;

    // Process tag
    hash.update(this.ELEMENT_PREFIX);
    hash.update(this.qualifiedName(domnode));
    hash.update(this.SEPARATOR);

    // Process attributes
    if (domnode.hasAttributes()) {
        attrqns = [];
        attrnodes = {};
        for (i = domnode.attributes.length - 1; i >= 0; i--) {
            n = domnode.attributes[i];
            if (n.name !== 'xmlns' && n.prefix !== 'xmlns') {
                qn = this.qualifiedName(n);
                attrqns.unshift(qn);
                attrnodes[qn] = n;
            }
        }
        attrqns = attrqns.sort();
        attrqns.forEach(function(qn) {
            this.processAttribute(attrnodes[qn], hash, qn);
        }, this);
    }
};


DOMNodeHash.prototype.processAttribute = function(domnode, hash, qn) {
    qn = qn || this.qualifiedName(domnode);
    hash.update(this.ATTRIBUTE_PREFIX);
    hash.update(qn);
    hash.update(this.SEPARATOR);
    hash.update(domnode.nodeValue);
};


DOMNodeHash.prototype.processText = function(domnode, hash) {
    hash.update(this.TEXT_PREFIX);
    hash.update(domnode.nodeValue);
};


exports.DOMTreeAdapter = DOMTreeAdapter;
exports.DOMNodeHash = DOMNodeHash;

});

require.define("/lib/delta/domdelta.js", function (require, module, exports, __dirname, __filename) {
    /**
 * @file:   Adapter class for XML/DOM based delta format
 * @module  domdelta
 */

/** @ignore */
var deltamod = require('./delta');
var contextdelta = require('./contextdelta');

TYPE_TAGS = {};
TYPE_TAGS[deltamod.UPDATE_NODE_TYPE] = 'node';
TYPE_TAGS[deltamod.UPDATE_FOREST_TYPE] = 'forest';
TYPE_TAGS.node = deltamod.UPDATE_NODE_TYPE;
TYPE_TAGS.forest = deltamod.UPDATE_FOREST_TYPE;

/**
 * @constructor
 */
function DOMDeltaAdapter(fragmentadapter) {
    this.fragmentadapter = fragmentadapter;
}


DOMDeltaAdapter.prototype.adaptDocument = function(doc) {
    var operations = [], root, nodes, n, i;

    // loop through children and add documents and options to delta class
    root = doc.documentElement;

    nodes = Array.prototype.slice.call(root.childNodes);
    for (i = 0; i < nodes.length; i++) {
        n = nodes[i];
        if (n.nodeType === n.ELEMENT_NODE) {
            operations.push(this.adaptOperation(n, TYPE_TAGS[n.tagName]));
        }
    }

    return operations;
};


DOMDeltaAdapter.prototype.adaptOperation = function(element, type) {
    var path = element.getAttribute('path'),
        children, remove, insert, i, n, head, tail, body;

    switch (type) {
        case deltamod.UPDATE_NODE_TYPE:
        case deltamod.UPDATE_FOREST_TYPE:
            break;
        default:
            throw new Error('Encountered unsupported change type');
    }

    // Parse path
    if (path === '') {
        path = [];
    }
    else {
        path = path.split('/').map(function(component) {
            return parseInt(component, 10);
        });
    }

    children = Array.prototype.slice.call(element.childNodes);
    node = this.nextElement('context', children);
    head = this.parseContext(node);

    node = this.nextElement('remove', children);
    remove = this.fragmentadapter.importFragment(node.childNodes);

    node = this.nextElement('insert', children);
    insert = this.fragmentadapter.importFragment(node.childNodes);

    node = this.nextElement('context', children);
    tail = this.parseContext(node);

    return new contextdelta.DetachedContextOperation(type, path, remove, insert, head, tail);
};


DOMDeltaAdapter.prototype.nextElement = function(tag, domnodes) {
    var node = domnodes.shift();
    while (node && node.nodeType !== node.ELEMENT_NODE) {
        if (node.tagName === tag) {
            break;
        }
        node = domnodes.shift();
    }
    return node;
};


DOMDeltaAdapter.prototype.nextText = function(domnodes) {
    var node = domnodes.shift();
    while(node && node.nodeType !== node.TEXT_NODE) {
        node = domnodes.shift();
    }
    return node;
};


DOMDeltaAdapter.prototype.parseContext = function(node) {
    var children = Array.prototype.slice.call(node.childNodes);
    var text = this.nextText(children);
    if (text) {
        return text.nodeValue.split(';').map(function(component) {
            component = component.trim();
            if (component.length) {
                return parseInt(component, 16);
            }
        });
    }
};


/**
 * Populate the document with settings and operations from delta.
 */
DOMDeltaAdapter.prototype.populateDocument = function(doc, operations) {
    var i, root, element;
    // Loop through operations and append them to the given document

    root = doc.createElement('delta');

    for (i = 0; i < operations.length; i++) {
        element = this.constructOperationElement(doc, operations[i]);
        root.appendChild(element);
    }

    doc.appendChild(root);
};


DOMDeltaAdapter.prototype.constructOperationElement = function(doc, op) {
    var tag = TYPE_TAGS[op.type],
        deep = (op.type !== deltamod.UPDATE_NODE_TYPE),
        element = doc.createElement(tag),
        remove = doc.createElement('remove'),
        insert = doc.createElement('insert'),
        head = doc.createElement('context'),
        tail = doc.createElement('context'),
        oldcontent, newcontent;

    element.setAttribute('path', op.path.join('/'));

    head.appendChild(doc.createTextNode(this.formatFingerprint(op.head)));
    element.appendChild(head);

    if (op.remove) {
        oldcontent = this.fragmentadapter.adapt(doc, op.remove, deep);
        if (typeof oldcontent === 'string') {
            remove.appendChild(doc.createCDATASection(oldcontent));
        }
        else {
            remove.appendChild(oldcontent);
        }
        element.appendChild(remove);
    }

    if (op.insert) {
        newcontent = this.fragmentadapter.adapt(doc, op.insert, deep);
        if (typeof newcontent === 'string') {
            insert.appendChild(doc.createCDATASection(newcontent));
        }
        else {
            insert.appendChild(newcontent);
        }
        element.appendChild(insert);
    }

    tail.appendChild(doc.createTextNode(this.formatFingerprint(op.tail)));
    element.appendChild(tail);

    return element;
};

DOMDeltaAdapter.prototype.formatFingerprint = function(parts) {
    return parts.map(function(n) {
        return n ? n.toString(16) : '';
    }).join(';');
};


/**
 * Helper class for a memoizing the currently active DOM node during a patching
 * session. This mapping is necessary because DOMNodeReplaceOperationHandler
 * swaps dom nodes when toggled. Thus, any operation attached to a child node
 * needs to be capable of detecting the currently active parent in order to
 * prevent operations on inactive nodes which may lead to loss of data.
 *
 * @constructor
 */
function DOMOperationNodeDataMap(propname) {
    this.propname = propname || 'currentDOMNode';
}


/**
 * Return active DOM node for this tree.Node.
 */
DOMOperationNodeDataMap.prototype.getCurrentDOMNode = function(node) {
    return node && (node[this.propname] || node.data);
}


/**
 * Set active DOM node for this tree.Node.
 */
DOMOperationNodeDataMap.prototype.setCurrentDOMNode = function(node, domnode) {
    node[this.propname] = domnode;
}


/**
 * @constructor
 */
function DOMNodeReplaceOperationHandler(anchor, datamap, orignode, changednode) {
    this.anchor = anchor;
    this.datamap = datamap;
    this.orignode = orignode;
    this.changednode = changednode;

    // Changed node may not have any children
    while(this.changednode.firstChild) {
        this.changednode.removeChild(this.changednode.firstChild);
    }

    this.state = false;
}


/**
 * Toggle active state of this hunk.
 */
DOMNodeReplaceOperationHandler.prototype.toggle = function() {
    var fromnode = this.state ? this.changednode : this.orignode,
        tonode = this.state ? this.orignode : this.changednode,
        parent = (fromnode === fromnode.ownerDocument.documentElement) ?
            fromnode.ownerDocument : fromnode.parentNode;

    // Move children
    while (fromnode.firstChild) {
        tonode.appendChild(fromnode.firstChild);
    }

    // Replace node
    parent.replaceChild(tonode, fromnode);

    // Update node data map
    this.datamap.setCurrentDOMNode(this.anchor, tonode);

    this.state = !this.state;
};


/**
 * Return the currently activated node
 */
DOMNodeReplaceOperationHandler.prototype.getNode = function() {
    return this.state ? this.changednode : this.orignode;
}


/**
 * Return true if this hunk is active.
 */
DOMNodeReplaceOperationHandler.prototype.isActive = function() {
    return this.state;
};


/**
 * Activate this hunk, remove old attributes and insert new attributes if
 * necessary.
 */
DOMNodeReplaceOperationHandler.prototype.activate = function() {
    if (!this.state) {
        this.toggle();
    }
};


/**
 * Deactivate this hunk, remove inserted attributes and reinsert removed
 * attributes if necessary.
 */
DOMNodeReplaceOperationHandler.prototype.deactivate = function() {
    if (this.state) {
        this.toggle();
    }
};


/**
 * Construct a new DOM operation element capable of replacing the specified
 * subtrees.
 *
 * @param   par         The tree.Node whose children should be replaced
 * @param   before      The tree.Node where new nodes should be attached
 *                      before
 * @param   oldnodes    An array of the root DOM elements of the original
 *                      subtrees
 * @param   newnodes    An array of the root DOM elements of the changed
 *                      subtrees
 * @constructor
 */
function DOMTreeSequenceOperationHandler(par, before, datamap, oldnodes,
        newnodes) {
    this.par = par;
    this.before = before;
    this.datamap = datamap;

    this.oldnodes = oldnodes;
    this.newnodes = newnodes;
}


/**
 * Toggle active state
 */
DOMTreeSequenceOperationHandler.prototype.toggle = function() {
    var remove = this.state ? this.newnodes : this.oldnodes,
        insert = this.state ? this.oldnodes : this.newnodes,
        node = this.datamap.getCurrentDOMNode(this.par),
        before = this.datamap.getCurrentDOMNode(this.before),
        i;

    for (i = 0; i < remove.length; i++) {
        node.removeChild(remove[i]);
    }
    for (i = 0; i < insert.length; i++) {
        node.insertBefore(insert[i], before);
    }

    this.state = !this.state;
};


/**
 * Return true if the hunk is active
 */
DOMTreeSequenceOperationHandler.prototype.isActive = function() {
    return this.state;
};


/**
 * Activate this hunk, inserting new subtrees and removing old subtrees if
 * necessary.
 */
DOMTreeSequenceOperationHandler.prototype.activate = function() {
    if (!this.state) {
        this.toggle();
    }
};


/**
 * Deactivate this hunk, removing inserted nodes and inserting removed
 * nodes into if necessary.
 */
DOMTreeSequenceOperationHandler.prototype.deactivate = function() {
    if (this.state) {
        this.toggle();
    }
};


/**
 * Construct a DOM operation factory.
 * @constructor
 */
function DOMOperationHandlerFactory() {
    this.dataMap = new DOMOperationNodeDataMap();
}


/**
 * Return a new node update operation on the given node.
 *
 * @param anchor    A DeltaJS.tree.Anchor pointing to the node with old values
 * @param newnode   A DeltaJS.tree.node pointing to the node with the new values
 */
DOMOperationHandlerFactory.prototype.createNodeUpdateOperationHandler = function(
        anchor, newnode) {
    var oldnode;
    if (!anchor.target) {
        throw new Error('Parameter error: node update handler needs an anchor with a target');
    }
    oldnode = anchor.target;
    remove = oldnode.data;
    insert = oldnode.data.ownerDocument.importNode(newnode.data, false);
    return new DOMNodeReplaceOperationHandler(oldnode, this.dataMap, remove, insert);
};


/**
 * Return a new forest update operation for a sequence of children of the given
 * node. Remove all children from start through length and replace them with
 * the subtrees given in the replacement array.
 *
 * @param anchor    A DeltaJS.tree.Anchor pointing to the first node which
 *                  should be removed. Should point to the location before
 *                  which elements should be inserted if no nodes are to be
 *                  removed.
 * @param length    Number of tree nodes to be removed
 * @param replacement   Array of replacement tree nodes
 */
DOMOperationHandlerFactory.prototype.createForestUpdateOperationHandler = function(
        anchor, length, replacement, parenthandler) {
    var doc, oldnodes = [], newnodes = [], i,
        node = anchor.base,
        start = anchor.index;

    if (!node) {
        throw new Error('Parameter error: forest update handler needs an anchor with a base');
    }
    else if (typeof start === 'undefined') {
        throw new Error('Parameter error: forest update handler needs an anchor with an index');
    }
    else if (!length && !replacement.length) {
        throw new Error('Forest update operation requires at least one node');
    }

    doc = node.data.ownerDocument;

    for (i = start; i < start + length; i++) {
        oldnodes.push(node.children[i].data);
    }
    for (i = 0; i < replacement.length; i++) {
        newnodes.push(doc.importNode(replacement[i].data, true));
    }

    before = node.children[start + length];

    return new DOMTreeSequenceOperationHandler(node, before, this.dataMap,
            oldnodes, newnodes, parenthandler);
};


/**
 * Return a new operation handler for the given operation at the anchor.
 *
 * @param anchor    A DeltaJS.tree.Anchor
 * @param op        The operation to create a handler for
 */
DOMOperationHandlerFactory.prototype.createOperationHandler = function(anchor, type, path, remove, insert) {
    switch (type) {
        case deltamod.UPDATE_FOREST_TYPE:
            return this.createForestUpdateOperationHandler(anchor,
                    remove.length, insert);

        case deltamod.UPDATE_NODE_TYPE:
            return this.createNodeUpdateOperationHandler(anchor,
                    insert[0]);
    }

    throw new Error('Operation type not supported by this factory');
}


exports.DOMDeltaAdapter = DOMDeltaAdapter;
exports.DOMOperationNodeDataMap = DOMOperationNodeDataMap;
exports.DOMNodeReplaceOperationHandler = DOMNodeReplaceOperationHandler;
exports.DOMTreeSequenceOperationHandler = DOMTreeSequenceOperationHandler;
exports.DOMOperationHandlerFactory = DOMOperationHandlerFactory;

});

require.define("/lib/delta/delta.js", function (require, module, exports, __dirname, __filename) {
    /**
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
 * Construct a new attached operation instance.
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
 * Create a new operation attacher instance.
 *
 * @constructor
 */
function Attacher(resolver) {
    this.resolver = resolver;
}


/**
 * Resolve anchor of one operation and return new attached operation instance.
 */
Attacher.prototype.attach = function(op, out) {
    res = this.resolver.find(op.path, op.remove, op.head, op.tail, op.type);

    if (typeof out === 'object') {
        out.res = res;
    }
    return new AttachedOperation(res.anchor, op.type, op.path, op.remove,
            op.insert);
}


exports.DeltaCollector = DeltaCollector;
exports.AttachedOperation = AttachedOperation;
exports.Attacher = Attacher;

exports.UPDATE_NODE_TYPE = UPDATE_NODE_TYPE;
exports.UPDATE_FOREST_TYPE = UPDATE_FOREST_TYPE;

});

require.define("/lib/delta/contextdelta.js", function (require, module, exports, __dirname, __filename) {
    /**
 * This module provides classes and methods for the conversion between attached
 * operations and detached context delta operations.
 */

/** @ignore */
var tree = require('./tree');

/** @ignore */
var resolvermod = require('./resolver');

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

require.define("/lib/delta/resolver.js", function (require, module, exports, __dirname, __filename) {
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
 * @module  resolver
 */

/** @ignore */
var tree = require('./tree');

/** @ignore */
var contextmatcher = require('./contextmatcher');

/**
 * Construct new resolver result instance.
 * @constructor
 */
function ResolverResult(anchor, tail, offset, quality) {
    this.anchor = anchor;
    this.tail = tail || [];
    this.offset = offset || 0;
    this.quality = quality || 1;
}

/**
 * Constructor for ContextResolver instances.
 *
 * @param refnode   A tree.Node, typically the root node
 * @param nodeindex An index class capable of accessing nodes by offset to
 *                  other nodes. Typically an instance of
 *                  DocumentOrderIndex should be used for this purpose.
 * @param radius    The search radius for the fuzzy matching algorithm
 * @param threshold The threshold of the fuzzy matching algorithm. A value
 *                  between 0.5 and 1. The authors of the xcc patching
 *                  algorithm recommend 0.7.
 * @param matcher   (optional) A matcher instance. Defaults to a
 *                  WeightedContextMatcher with radius=4.
 *
 * @constructor
 */
function ContextResolver(refnode, nodeindex, radius, threshold, matcher) {
    this.refnode = refnode;
    this.nodeindex = nodeindex;

    if (typeof radius === 'undefined') {
        radius = 4;
    }
    this.r = radius;

    if (typeof threshold === 'undefined') {
        threshold = 0.7;
    }
    this.t = threshold;

    this.matcher = matcher || new contextmatcher.WeightedContextMatcher(4);

    // Install custom equality tester for matcher
    this.matcher.equal = (function(that){
        return function(subject, offset, value, flag) {
            if (flag) {
                return that.equalContent(that.nodeindex.get(subject, offset), value, flag);
            }
            else {
                return that.equalContext(that.nodeindex.get(subject, offset), value);
            }
        };
    }(this));

    this.resolver = new exports.TopDownPathResolver(refnode);
}


/**
 * Compare a document node against a content node from the patch. Return
 * true if the docnode matches the patnode.
 *
 * Override this method if you use something different than the value
 * property of tree.Node.
 *
 * @param docnode   A candidate node from the document
 * @param patnode   A body-node from the pattern
 */
ContextResolver.prototype.equalContent = function(docnode, patnode) {
    return docnode === undefined ? patnode === undefined : 
        docnode && patnode && docnode.value === patnode.value;
};


/**
 * Compare a document node against a context node value. Return true if
 * the value of docnode matches the pattern value.
 *
 * Override this method if you use something different than the value
 * property of tree.Node.
 *
 * @param docnode   A candidate node from the document
 * @param patnode   The value from a context node
 */
ContextResolver.prototype.equalContext = function(docnode, value) {
    return docnode === undefined ? value === undefined :
        docnode.value === value;
};


/**
 * Given an anchor and a nodeindex, this method identifies the node which
 * matches the anchor as close as possible.
 */
ContextResolver.prototype.getClosestNode = function(anchor, nodeindex) {
    var result, siblings, lastsib;

    if (anchor.target) {
        result = anchor.target;
    }
    else {
        siblings = anchor.base.children;
        if (siblings.length === 0) {
            // First guess has no children. Just use that.
            result = anchor.base;
        }
        else if (anchor.index < 0) {
            result = nodeindex.get(siblings[0], -1);
        }
        else if (anchor.index < siblings.length) {
            // Start with the appointed child node
            result = siblings[anchor.index];
        }
        else {
            // Resort to the last node in the subtree under the preceeding
            // sibling if top-down resolver did not came through to the very
            // last path component.
            lastsib = siblings[siblings.length-1];
            result = nodeindex.get(lastsib, nodeindex.size(lastsib) - 1);
        }
    }

    return result;
}


/**
 * Locate a node at the given path starting at refnode. Try to locate the
 * target within a given radius using the fingerprint values if direct
 * lookup failed.
 *
 * @param   path        An array of numbers. Each value represents an index
 *                      into the childrens of a node in top-down order.
 * @param   body        An array containing the node sequence in question.
 *                      When resolving the location of insert operations,
 *                      the array is empty.  For updates, the array will
 *                      consist of exactly one node. Remove operations may
 *                      consist of one or more nodes.
 * @param   head        Leading context: An array containing the values of
 *                      leading nodes in the same generation.
 * @param   tail        Trailing context: An array containing the values of
 *                      trailing nodes in the same generation.
 * @param   type        Operation type. This parameter is passed to the
 *                      equalContent callback.
 *
 * @returns A result object with two properties: node holds the resolved
 * tree.Node and tail the unresolved part of path. Returns undefined on
 * failure.
 */
ContextResolver.prototype.find = function(path, body, head, tail, type) {
    var guess, node, i, q = 0, f, best, bestnode, anchor, result, flatbody;

    // Need a trueish value in order to differentiate context from content
    if (typeof type === 'undefined') {
        type = true;
    }

    if (path.length === 0) {
        // We are operating on the root node, initial guess is trivial.
        node = this.refnode;
    }
    else {
        // Start with an initial guess using the top-down path resolver.
        guess = this.resolver.resolve(path);
        node = this.getClosestNode(guess.anchor, this.nodeindex);
    }

    // concatenate all nodes contained in body into one array
    flatbody = [];
    body.forEach(function(n) {
        Array.prototype.push.apply(flatbody, this.nodeindex.flatten(n));
    }, this);

    // context verification and fuzzy matching
    if (node) {
        this.matcher.setPattern(flatbody, head, tail);
        for (i = -this.r; i <= this.r; i++) {
            f = this.matcher.matchQuality(node, i, type);
            if (f > q && f >= this.t) {
                q = f;
                best = i;
            }
        }
    }

    if (typeof best === 'undefined') {
        throw new Error('Failed to resolve operation');
    }
    else {
        if ((bestnode = this.nodeindex.get(node, best)) && bestnode.depth === path.length) {
            // Best points at an existing node with the required depth. Use
            // that as anchor.
            anchor = new tree.Anchor(this.refnode, bestnode);
        }
        else if ((bestnode = this.nodeindex.get(node, best-1)) && bestnode.depth >= path.length - 1) {
            // Go one node back in document order and find the node which is
            // at depth-1. Then point the anchor past the last child of this
            // node.
            while (bestnode.depth > path.length - 1) {
                bestnode = bestnode.par;
            }

            anchor = new tree.Anchor(this.refnode, bestnode,
                    bestnode.children.length);
        }
        else {
            throw new Error('Failed to resolve operation');
        }
    }

    return new ResolverResult(anchor, [], best, q);
};


/**
 * Create a new instance of top-down path resolver
 *
 * @constructor
 */
function TopDownPathResolver(refnode) {
    this.refnode = refnode;
}


/**
 * Try to resolve the given path top-down. Return an object containing the last
 * internal node which was resolved properly as well as the unresolved tail of
 * the path. Note that leaf nodes are represented by their parent and a tail
 * containing their child-index.
 *
 * @param path  Array of integers
 * @returns A result object with two properties: node holds the resolved
 * tree.Node and tail the unresolved part of path.
 */
TopDownPathResolver.prototype.resolve = function(path, base) {
    var anchor, tail, result;

    base = base || this.refnode;

    if (path.length <= 1) {
        anchor = new tree.Anchor(this.refnode, base, path[0]);
        result = new ResolverResult(anchor);
    }
    else {
        if (base.children[path[0]]) {
            result = this.resolve(path.slice(1), base.children[path[0]]);
        }
        else {
            tail = path.slice();
            anchor = new tree.Anchor(this.refnode, base, tail.shift());
            result = new ResolverResult(anchor, tail);
        }
    }

    return result;
};


exports.ResolverResult = ResolverResult;
exports.ContextResolver = ContextResolver;
exports.TopDownPathResolver = TopDownPathResolver;

});

require.define("/lib/delta/contextmatcher.js", function (require, module, exports, __dirname, __filename) {
    /**
 * @file:   Calculate matching quality of sequences as well as leading and
 *          trailing context.
 * @see:    * Sebastian Rönnau, Christian Pauli, and Uwe M. Borghoff. Merging
 *            changes in XML documents using reliable context fingerprints:
 *            http://dx.doi.org/10.1145/1410140.1410151
 *          * Original Sourcecode:
 *            https://launchpad.net/xcc
 *
 * @module  contextmatcher
 */


/**
 * Create a new WeightedContextMatcher instance implementing the fuzzy
 * matching mechanism.
 *
 * @param radius    Maximum radius of the fingerprint. Values greater than
 *                  four are not recommended.
 *
 * @constructor
 */
function WeightedContextMatcher(radius) {
    var f, cf = 0;

    if (typeof radius === 'undefined') {
        radius = 4;
    }
    this.r = radius;

    // Match quality factors
    this.qf = [];

    // Cummulative match quality factor used for normalization
    this.cqf = [];

    // Precompute match quality factors for given fingerprint radius
    for (i = 0; i < this.r; i++) {
        f = 1/Math.pow(2, i);
        this.qf[i] = f;
        cf += f;
        this.cqf[i] = cf;
    }

    this.body = [];
    this.head = [];
    this.tail = [];
}


/**
 * Return true if subject at offset is equal to the candidate value. Override
 * this method if your values need special handling.
 */
WeightedContextMatcher.prototype.equal = function(subject, offset, value, flag) {
    return subject[offset] === value;
};


/**
 * Set the pattern consisting of the body and the context which should be
 * matched against candidates using matchQuality method subsequently.
 *
 * @param body  Array of context elements between head and tail
 * @param head  Array of leading context elements
 * @param tail  Array of trailing context elements
 */
WeightedContextMatcher.prototype.setPattern = function(body, head, tail) {
    this.body = body;
    this.head = head || [];
    this.tail = tail || [];
};


/**
 * Return a number between zero and one representing the match quality of
 * the pattern.
 *
 * @param offset    An integer representing the offset to the subject.
 */
WeightedContextMatcher.prototype.matchQuality = function(subject, offset,
        contentflag, contextflag)
{
    return this.matchContent(subject, offset, contentflag) &&
        this.matchContext(subject, offset, contextflag);
};


/**
 * Return 1 if every body-item of the pattern matches the candidates
 * exactly. Otherwise return 0.
 */
WeightedContextMatcher.prototype.matchContent = function(subject, offset, flag) {
    var i, k, n;

    // Check value-array. Only consider positions where body matches.
    n = this.body.length;
    for (i = 0, k = offset; i < n; i++, k++) {
        if (!this.equal(subject, k, this.body[i], flag)) {
            return 0;
        }
    }

    return 1;
};


/**
 * Return a number between 0 and 1 representing the match quality of the
 * pattern context with the candidate.
 */
WeightedContextMatcher.prototype.matchContext = function(subject, offset, flag) {
    var i, k, n, f = 0, cf = 0;

    // Match context fingerprint if any
    if (this.qf.length && (this.head.length || this.tail.length)) {
        n = Math.min(this.head.length, this.qf.length);
        for (i = 0, k = offset - 1; i < n; i++, k--) {
            f += this.equal(subject, k, this.head[n-i-1], flag) * this.qf[i];
        }
        cf += n && this.cqf[n-1];

        n = Math.min(this.tail.length, this.qf.length);
        for (i = 0, k = offset + this.body.length; i < n; i++, k++) {
            f += this.equal(subject, k, this.tail[i], flag) * this.qf[i];
        }
        cf += n && this.cqf[n-1];

        // Normalize
        f /= cf;
    }
    else {
        f = 1;
    }

    return f;
};

exports.WeightedContextMatcher = WeightedContextMatcher;

});

require.define("/lib/profiles/delta-tree-xml.js", function (require, module, exports, __dirname, __filename) {
    var xmlpayload = require('../delta/xmlpayload');
var deltamod = require('../delta/delta');
var contextdelta= require('../delta/contextdelta');
var domdelta = require('../delta/domdelta');

/**
 * Return shared payload handler.
 */
exports.payloadHandler = new xmlpayload.XMLPayloadHandler();


/**
 * Return a new empty delta document.
 */
exports.createEmptyDocument = function(matching) {
    return {
        'type': 'xml',
        'name': 'untitled-diff.xml',
        'data': exports.payloadHandler.createDocument(),
        'attached': [], // Array of attached operations
        'detached': [], // Array of detached operations
        'messages': [], // Array of array of messages generated during the
                        // processing, indexed by operation
        'src': '',
        'matching': matching
    };
};


/**
 * Return a delta document loaded from the given string or DOMDocument.
 */
exports.loadDocument = function(domdoc, fragAdapter, name) {
    var src, operations, entries = [], i,
        deltaAdapter = new domdelta.DOMDeltaAdapter(fragAdapter);

    if (typeof domdoc === 'string') {
        src = domdoc;
        domdoc = exports.payloadHandler.parseString(domdoc);
    }

    return {
        'type': 'xml',
        'name': name,
        'data': domdoc,
        'attached': [],
        'detached': deltaAdapter.adaptDocument(domdoc),
        'messages': [],
        'src': src,
        'matching': undefined
    };
};


/**
 * Return an initialized collector instance.
 */
exports.createCollector = function(deltadoc, doc, equals) {
    var collector, root, partner;

    if (!doc.tree) {
        throw new Error('Parameter error: Document objects must have a tree property');
    }
    if (!doc.valueindex) {
        throw new Error('Parameter error: Document objects must have a valueindex property');
    }

    root = doc.tree;
    partner = deltadoc.matching.get(root);
    if (!partner) {
        throw new Error('Parameter error: Matching does not contain tree root');
    }

    collector = new deltamod.DeltaCollector(deltadoc.matching, root, partner);

    if (equals) {
        collector.equals = equals;
    }

    return collector;
}


/**
 * Return an initialized context delta detacher instance.
 */
exports.createDetacher = function(doc) {
    var contextgen = new contextdelta.ContextGenerator(4, doc.nodeindex, doc.valueindex);
    return new contextdelta.Detacher(contextgen);
}


/**
 * Return an initialized context delta attacher instance
 */
exports.createAttacher = function(resolver) {
    return new deltamod.Attacher(resolver);
}


/**
 * Return an initialized delta adapter instance.
 */
exports.createDeltaAdapter = function(fragadapter) {
    return new domdelta.DOMDeltaAdapter(fragadapter);
}


/**
 * Serialize the data property into the src string and return it.
 */
exports.serializeDocument = function(deltadoc) {
    deltadoc.src = exports.payloadHandler.serializeToString(deltadoc.data);

    return deltadoc.src;
};

});

require.define("/lib/delta/diff.js", function (require, module, exports, __dirname, __filename) {
    /**
 * @fileoverview    Abstract diff implementation
 */

/**
 * @creator
 */
function Diff(diffFactory, docFactory, deltaFactory) {
    this.diffFactory = diffFactory;
    this.docFactory = docFactory;
    this.deltaFactory = deltaFactory;
}

/**
 * Return the delta object after computing and collecting the diff between
 * doc1 and doc2.
 */
Diff.prototype.diff = function(doc1, doc2) {
    var matching = this.diffFactory.createMatching(),
        equals = this.docFactory.createNodeEqualityTest(doc1, doc2),
        diff = this.diffFactory.createDiffAlgorithm(doc1, doc2, equals);

    // diff
    diff.matchTrees(matching);

    // Collect changes
    deltadoc = this.collect(doc1, doc2, matching);

    // Populate document
    this.populate(deltadoc, doc1);

    return deltadoc;
}


/**
 * Construct delta document
 */
Diff.prototype.collect = function(doc1, doc2, matching) {
    var deltadoc = this.deltaFactory.createEmptyDocument(matching),
        equals = this.docFactory.createNodeEqualityTest(doc1, doc2),
        collector;

    collector = this.deltaFactory.createCollector(deltadoc, doc1, equals);

    // Collect changes and create operations in delta document
    collector.forEachChange(function(attached) {
        deltadoc.attached.push(attached);
    });

    return deltadoc;
};


/**
 * Populate delta document with detached operations
 */
Diff.prototype.populate = function(deltadoc, doc) {
    var i, detacher = this.deltaFactory.createDetacher(doc),
        fragadapter = this.docFactory.createFragmentAdapter(deltadoc.type),
        deltaadapter = this.deltaFactory.createDeltaAdapter(fragadapter);

    // Detach operations
    for (i = 0; i < deltadoc.attached.length; i++) {
        deltadoc.detached[i] = detacher.detach(deltadoc.attached[i]);
    }

    // Populate DOM of delta document
    deltaadapter.populateDocument(deltadoc.data, deltadoc.detached);

    return deltadoc.data;
}

exports.Diff = Diff;

});

require.define("/docannotator.js", function (require, module, exports, __dirname, __filename) {
    var style_html = require('./beautify-html').style_html;
var xs = new XMLSerializer();

/**
 * Create new DocumentAnnotator instance
 * @creator
 */
exports.DocumentAnnotator = function DocumentAnnotator(doc, nonce) {
    this.doc = doc;
    this.nonce = nonce || (new Date()).getTime().toString();
    this.indent_size = 4;
    this.indent_char = ' ';
    this.markers = [];
}

/**
 * Wrap the given DOM elements with a html element, typically a <span>.
 * Wrapped nodes will be escaped after serialization while special
 * characters of the html element will be preserved.
 */
exports.DocumentAnnotator.prototype.wrap = function(par, before, domnodes,
        starttag, endtag) {
    var content, node, indent = '',
    docfrag = this.doc.createDocumentFragment();

    // Indentation
    node = (par && par.parentNode);
    while(node) {
        for (i = 0; i < this.indent_size; i++) {
            indent += this.indent_char;
        }
        node = node.parentNode;
    }

    // Build up marker comment
    for (i = 0; i < domnodes.length; i++) {
        docfrag.appendChild(domnodes[i]);
    }

    content = '\nPRESERVE'+this.nonce+starttag+'ENDPRESERVE'+this.nonce;
    content += style_html(xs.serializeToString(docfrag), {'max_char': 70 - indent.length});
    content += 'PRESERVE'+this.nonce+endtag+'ENDPRESERVE'+this.nonce;
    content = content.replace(/^/mg, indent);
    node = this.doc.createComment(content);

    // Insert marker comment
    this.markers.push(par.insertBefore(node, before));
}


/**
 * Exclude the given DOM element from the serialized output.
 */
exports.DocumentAnnotator.prototype.exclude = function(domnode, deep) {
    var par, next, start, end;
    if (domnode.ownerDocument !== this.doc) {
        throw new Error('Cannot exclude element if it is not part of the document');
    }
    start = this.doc.createComment('EXCLUDE'+this.nonce);
    end = this.doc.createComment('ENDEXCLUDE'+this.nonce);

    par = domnode.parentNode || this.doc;
    this.markers.push(par.insertBefore(start, domnode));

    // insert after
    next = undefined;
    if (deep) {
        next = domnode.nextSibling;
    }
    else if (domnode) {
        next = domnode.firstChild || domnode.nextSibling;
        if (next) {
            par = next.parentNode || domnode.ownerDocument;
        }
        else {
            par = domnode.parentNode || domnode.ownerDocument;
        }
    }
    this.markers.push(par.insertBefore(end, next));
}

/**
 * Return the annotated source of the DOM tree.
 */
exports.DocumentAnnotator.prototype.toHTML = function(noclear) {
    var tmpdoc = document.implementation.createDocument('','',null);
    var source = style_html(xs.serializeToString(this.doc));

    // Remove excluded nodes from the output
    var exclude_pat = '<!--EXCLUDE'+this.nonce+'-->[\\s\\S]*?<!--ENDEXCLUDE'+this.nonce+'-->\n?';
    var exclude_re = new RegExp(exclude_pat, 'gm');
    source = source.replace(exclude_re,'');

    var preserve_pat = '<!--\\s*PRESERVE'+this.nonce+'([\\s\\S]*?)ENDPRESERVE'+this.nonce;
    preserve_pat += '([\\s\\S]*?)';
    preserve_pat += 'PRESERVE'+this.nonce+'([\\s\\S]*?)ENDPRESERVE'+this.nonce+'-->';
    var preserve_re = new RegExp(preserve_pat, 'gm');
    var tmptxt, result='', last=0;

    while ((match = preserve_re.exec(source))) {
        // Serialize (escape) input up to but not including the marker
        // comment
        tmptxt = this.doc.createTextNode(match.input.slice(last,
                    preserve_re.lastIndex - match[0].length));
        result += xs.serializeToString(tmptxt);

        // Append preserved start-tag unescaped
        result += match[1];
        last = preserve_re.lastIndex;

        // Append content escaped
        tmptxt = this.doc.createTextNode(match[2]);
        result += xs.serializeToString(tmptxt);

        // Append preserved end-tag unescaped
        result += match[3];
        last = preserve_re.lastIndex;
    }

    // Serialize rest
    tmptxt = this.doc.createTextNode(source.slice(last));
    result += xs.serializeToString(tmptxt);

    // Remove marker comments
    if (!noclear) {
        this.clear();
    }

    return result;
}

/**
 * Remove marker comments from underlying DOM tree.
 */
exports.DocumentAnnotator.prototype.clear = function() {
    var i, par;
    for (i = 0; i < this.markers.length; i++) {
        par = this.markers[i].parentNode || this.doc;
        par.removeChild(this.markers[i]);
    }
}

});

require.define("/beautify-html.js", function (require, module, exports, __dirname, __filename) {
    /*

 Style HTML
---------------

  Written by Nochum Sossonko, (nsossonko@hotmail.com)

  Based on code initially developed by: Einar Lielmanis, <elfz@laacz.lv>
    http://jsbeautifier.org/


  You are free to use this in any way you want, in case you find this useful or working for you.

  Usage:
    style_html(html_source);

    style_html(html_source, options);

  The options are:
    indent_size (default 4)          — indentation size,
    indent_char (default space)      — character to indent with,
    max_char (default 70)            -  maximum amount of characters per line,
    brace_style (default "collapse") - "collapse" | "expand" | "end-expand"
            put braces on the same line as control statements (default), or put braces on own line (Allman / ANSI style), or just put end braces on own line.
    unformatted (default ['a'])      - list of tags, that shouldn't be reformatted

    e.g.

    style_html(html_source, {
      'indent_size': 2,
      'indent_char': ' ',
      'max_char': 78,
      'brace_style': 'expand',
      'unformatted': ['a', 'sub', 'sup', 'b', 'i', 'u']
    });
*/

function style_html(html_source, options) {
//Wrapper function to invoke all the necessary constructors and deal with the output.

  var multi_parser,
      indent_size,
      indent_character,
      max_char,
      brace_style;

  options = options || {};
  indent_size = options.indent_size || 4;
  indent_character = options.indent_char || ' ';
  brace_style = options.brace_style || 'collapse';
  max_char = options.max_char || '70';
  unformatted = options.unformatted || ['a'];

  function Parser() {

    this.pos = 0; //Parser position
    this.token = '';
    this.current_mode = 'CONTENT'; //reflects the current Parser mode: TAG/CONTENT
    this.tags = { //An object to hold tags, their position, and their parent-tags, initiated with default values
      parent: 'parent1',
      parentcount: 1,
      parent1: ''
    };
    this.tag_type = '';
    this.token_text = this.last_token = this.last_text = this.token_type = '';

    this.Utils = { //Uilities made available to the various functions
      whitespace: "\n\r\t ".split(''),
      single_token: 'br,input,link,meta,!doctype,basefont,base,area,hr,wbr,param,img,isindex,?xml,embed'.split(','), //all the single tags for HTML
      extra_liners: 'head,body,/html'.split(','), //for tags that need a line of whitespace before them
      in_array: function (what, arr) {
        for (var i=0; i<arr.length; i++) {
          if (what === arr[i]) {
            return true;
          }
        }
        return false;
      }
    }

    this.get_content = function () { //function to capture regular content between tags

      var input_char = '';
      var content = [];
      var space = false; //if a space is needed
      while (this.input.charAt(this.pos) !== '<') {
        if (this.pos >= this.input.length) {
          return content.length?content.join(''):['', 'TK_EOF'];
        }

        input_char = this.input.charAt(this.pos);
        this.pos++;
        this.line_char_count++;

        if (this.Utils.in_array(input_char, this.Utils.whitespace)) {
          if (content.length) {
            space = true;
          }
          this.line_char_count--;
          continue; //don't want to insert unnecessary space
        }
        else if (space) {
          if (this.line_char_count >= this.max_char) { //insert a line when the max_char is reached
            content.push('\n');
            for (var i=0; i<this.indent_level; i++) {
              content.push(this.indent_string);
            }
            this.line_char_count = 0;
          }
          else{
            content.push(' ');
            this.line_char_count++;
          }
          space = false;
        }
        content.push(input_char); //letter at-a-time (or string) inserted to an array
      }
      return content.length?content.join(''):'';
    }

    this.get_script = function () { //get the full content of a script to pass to js_beautify

      var input_char = '';
      var content = [];
      var reg_match = new RegExp('\<\/script' + '\>', 'igm');
      reg_match.lastIndex = this.pos;
      var reg_array = reg_match.exec(this.input);
      var end_script = reg_array?reg_array.index:this.input.length; //absolute end of script
      while(this.pos < end_script) { //get everything in between the script tags
        if (this.pos >= this.input.length) {
          return content.length?content.join(''):['', 'TK_EOF'];
        }

        input_char = this.input.charAt(this.pos);
        this.pos++;

        content.push(input_char);
      }
      return content.length?content.join(''):''; //we might not have any content at all
    }

    this.record_tag = function (tag){ //function to record a tag and its parent in this.tags Object
      if (this.tags[tag + 'count']) { //check for the existence of this tag type
        this.tags[tag + 'count']++;
        this.tags[tag + this.tags[tag + 'count']] = this.indent_level; //and record the present indent level
      }
      else { //otherwise initialize this tag type
        this.tags[tag + 'count'] = 1;
        this.tags[tag + this.tags[tag + 'count']] = this.indent_level; //and record the present indent level
      }
      this.tags[tag + this.tags[tag + 'count'] + 'parent'] = this.tags.parent; //set the parent (i.e. in the case of a div this.tags.div1parent)
      this.tags.parent = tag + this.tags[tag + 'count']; //and make this the current parent (i.e. in the case of a div 'div1')
    }

    this.retrieve_tag = function (tag) { //function to retrieve the opening tag to the corresponding closer
      if (this.tags[tag + 'count']) { //if the openener is not in the Object we ignore it
        var temp_parent = this.tags.parent; //check to see if it's a closable tag.
        while (temp_parent) { //till we reach '' (the initial value);
          if (tag + this.tags[tag + 'count'] === temp_parent) { //if this is it use it
            break;
          }
          temp_parent = this.tags[temp_parent + 'parent']; //otherwise keep on climbing up the DOM Tree
        }
        if (temp_parent) { //if we caught something
          this.indent_level = this.tags[tag + this.tags[tag + 'count']]; //set the indent_level accordingly
          this.tags.parent = this.tags[temp_parent + 'parent']; //and set the current parent
        }
        delete this.tags[tag + this.tags[tag + 'count'] + 'parent']; //delete the closed tags parent reference...
        delete this.tags[tag + this.tags[tag + 'count']]; //...and the tag itself
        if (this.tags[tag + 'count'] == 1) {
          delete this.tags[tag + 'count'];
        }
        else {
          this.tags[tag + 'count']--;
        }
      }
    }

    this.get_tag = function () { //function to get a full tag and parse its type
      var input_char = '';
      var content = [];
      var space = false;

      do {
        if (this.pos >= this.input.length) {
          return content.length?content.join(''):['', 'TK_EOF'];
        }

        input_char = this.input.charAt(this.pos);
        this.pos++;
        this.line_char_count++;

        if (this.Utils.in_array(input_char, this.Utils.whitespace)) { //don't want to insert unnecessary space
          space = true;
          this.line_char_count--;
          continue;
        }

        if (input_char === "'" || input_char === '"') {
          if (!content[1] || content[1] !== '!') { //if we're in a comment strings don't get treated specially
            input_char += this.get_unformatted(input_char);
            space = true;
          }
        }

        if (input_char === '=') { //no space before =
          space = false;
        }

        if (content.length && content[content.length-1] !== '=' && input_char !== '>'
            && space) { //no space after = or before >
          if (this.line_char_count >= this.max_char) {
            this.print_newline(false, content);
            this.line_char_count = 0;
          }
          else {
            content.push(' ');
            this.line_char_count++;
          }
          space = false;
        }
        content.push(input_char); //inserts character at-a-time (or string)
      } while (input_char !== '>');

      var tag_complete = content.join('');
      var tag_index;
      if (tag_complete.indexOf(' ') != -1) { //if there's whitespace, thats where the tag name ends
        tag_index = tag_complete.indexOf(' ');
      }
      else { //otherwise go with the tag ending
        tag_index = tag_complete.indexOf('>');
      }
      var tag_check = tag_complete.substring(1, tag_index).toLowerCase();
      if (tag_complete.charAt(tag_complete.length-2) === '/' ||
          this.Utils.in_array(tag_check, this.Utils.single_token)) { //if this tag name is a single tag type (either in the list or has a closing /)
        this.tag_type = 'SINGLE';
      }
      else if (tag_check === 'script') { //for later script handling
        this.record_tag(tag_check);
        this.tag_type = 'SCRIPT';
      }
      else if (tag_check === 'style') { //for future style handling (for now it justs uses get_content)
        this.record_tag(tag_check);
        this.tag_type = 'STYLE';
      }
      else if (this.Utils.in_array(tag_check, unformatted)) { // do not reformat the "unformatted" tags
        var comment = this.get_unformatted('</'+tag_check+'>', tag_complete); //...delegate to get_unformatted function
        content.push(comment);
        this.tag_type = 'SINGLE';
      }
      else if (tag_check.charAt(0) === '!') { //peek for <!-- comment
        if (tag_check.indexOf('[if') != -1) { //peek for <!--[if conditional comment
          if (tag_complete.indexOf('!IE') != -1) { //this type needs a closing --> so...
            var comment = this.get_unformatted('-->', tag_complete); //...delegate to get_unformatted
            content.push(comment);
          }
          this.tag_type = 'START';
        }
        else if (tag_check.indexOf('[endif') != -1) {//peek for <!--[endif end conditional comment
          this.tag_type = 'END';
          this.unindent();
        }
        else if (tag_check.indexOf('[cdata[') != -1) { //if it's a <[cdata[ comment...
          var comment = this.get_unformatted(']]>', tag_complete); //...delegate to get_unformatted function
          content.push(comment);
          this.tag_type = 'SINGLE'; //<![CDATA[ comments are treated like single tags
        }
        else {
          var comment = this.get_unformatted('-->', tag_complete);
          content.push(comment);
          this.tag_type = 'SINGLE';
        }
      }
      else {
        if (tag_check.charAt(0) === '/') { //this tag is a double tag so check for tag-ending
          this.retrieve_tag(tag_check.substring(1)); //remove it and all ancestors
          this.tag_type = 'END';
        }
        else { //otherwise it's a start-tag
          this.record_tag(tag_check); //push it on the tag stack
          this.tag_type = 'START';
        }
        if (this.Utils.in_array(tag_check, this.Utils.extra_liners)) { //check if this double needs an extra line
          this.print_newline(true, this.output);
        }
      }
      return content.join(''); //returns fully formatted tag
    }

    this.get_unformatted = function (delimiter, orig_tag) { //function to return unformatted content in its entirety

      if (orig_tag && orig_tag.indexOf(delimiter) != -1) {
        return '';
      }
      var input_char = '';
      var content = '';
      var space = true;
      do {

        if (this.pos >= this.input.length) {
          return content;
        }

        input_char = this.input.charAt(this.pos);
        this.pos++

        if (this.Utils.in_array(input_char, this.Utils.whitespace)) {
          if (!space) {
            this.line_char_count--;
            continue;
          }
          if (input_char === '\n' || input_char === '\r') {
            content += '\n';
            /*  Don't change tab indention for unformatted blocks.  If using code for html editing, this will greatly affect <pre> tags if they are specified in the 'unformatted array'
            for (var i=0; i<this.indent_level; i++) {
              content += this.indent_string;
            }
            space = false; //...and make sure other indentation is erased
            */
            this.line_char_count = 0;
            continue;
          }
        }
        content += input_char;
        this.line_char_count++;
        space = true;


      } while (content.indexOf(delimiter) == -1);
      return content;
    }

    this.get_token = function () { //initial handler for token-retrieval
      var token;

      if (this.last_token === 'TK_TAG_SCRIPT') { //check if we need to format javascript
        var temp_token = this.get_script();
        if (typeof temp_token !== 'string') {
          return temp_token;
        }
        token = js_beautify(temp_token.replace(/^[\r\n]+/, ''), {
          'indent_size': this.indent_size,
          'indent_char': this.indent_character,
          'brace_style': this.brace_style
        }); //call the JS Beautifier
        return [token, 'TK_CONTENT'];
      }
      if (this.current_mode === 'CONTENT') {
        token = this.get_content();
        if (typeof token !== 'string') {
          return token;
        }
        else {
          return [token, 'TK_CONTENT'];
        }
      }

      if (this.current_mode === 'TAG') {
        token = this.get_tag();
        if (typeof token !== 'string') {
          return token;
        }
        else {
          var tag_name_type = 'TK_TAG_' + this.tag_type;
          return [token, tag_name_type];
        }
      }
    }

    this.printer = function (js_source, indent_character, indent_size, max_char, brace_style) { //handles input/output and some other printing functions

      this.input = js_source || ''; //gets the input for the Parser
      this.output = [];
      this.indent_character = indent_character;
      this.indent_string = '';
      this.indent_size = indent_size;
      this.brace_style = brace_style;
      this.indent_level = 0;
      this.max_char = max_char;
      this.line_char_count = 0; //count to see if max_char was exceeded

      for (var i=0; i<this.indent_size; i++) {
        this.indent_string += this.indent_character;
      }

      this.print_newline = function (ignore, arr) {
        this.line_char_count = 0;
        if (!arr || !arr.length) {
          return;
        }
        if (!ignore) { //we might want the extra line
          while (this.Utils.in_array(arr[arr.length-1], this.Utils.whitespace)) {
            arr.pop();
          }
        }
        arr.push('\n');
        for (var i=0; i<this.indent_level; i++) {
          arr.push(this.indent_string);
        }
      }

      this.print_token = function (text) {
        this.output.push(text);
      }

      this.indent = function () {
        this.indent_level++;
      }

      this.unindent = function () {
        if (this.indent_level > 0) {
          this.indent_level--;
        }
      }
    }
    return this;
  }

  /*_____________________--------------------_____________________*/

  multi_parser = new Parser(); //wrapping functions Parser
  multi_parser.printer(html_source, indent_character, indent_size, max_char, brace_style); //initialize starting values

  while (true) {
      var t = multi_parser.get_token();
      multi_parser.token_text = t[0];
      multi_parser.token_type = t[1];

    if (multi_parser.token_type === 'TK_EOF') {
      break;
    }

    switch (multi_parser.token_type) {
      case 'TK_TAG_START':
      case 'TK_TAG_STYLE':
        multi_parser.print_newline(false, multi_parser.output);
        multi_parser.print_token(multi_parser.token_text);
        multi_parser.indent();
        multi_parser.current_mode = 'CONTENT';
        break;
      case 'TK_TAG_SCRIPT':
        multi_parser.print_newline(false, multi_parser.output);
        multi_parser.print_token(multi_parser.token_text);
        multi_parser.current_mode = 'CONTENT';
        break;
      case 'TK_TAG_END':
        multi_parser.print_newline(true, multi_parser.output);
        multi_parser.print_token(multi_parser.token_text);
        multi_parser.current_mode = 'CONTENT';
        break;
      case 'TK_TAG_SINGLE':
        multi_parser.print_newline(false, multi_parser.output);
        multi_parser.print_token(multi_parser.token_text);
        multi_parser.current_mode = 'CONTENT';
        break;
      case 'TK_CONTENT':
        if (multi_parser.token_text !== '') {
          multi_parser.print_newline(false, multi_parser.output);
          multi_parser.print_token(multi_parser.token_text);
        }
        multi_parser.current_mode = 'TAG';
        break;
    }
    multi_parser.last_token = multi_parser.token_type;
    multi_parser.last_text = multi_parser.token_text;
  }
  return multi_parser.output.join('');
}

exports.style_html = style_html;

});

require.define("/srcdiff-entry.js", function (require, module, exports, __dirname, __filename) {
    var xccDiffProfile = require('./lib/profiles/algo-diff-xcc');
var skelmatchDiffProfile = require('./lib/profiles/algo-diff-skelmatch');
var docProfile = require('./lib/profiles/doc-tree-xml');
var deltaProfile = require('./lib/profiles/delta-tree-xml');

var diff = require('./lib/delta/diff');

var da = require('./docannotator');
var style_html = require('./beautify-html').style_html;

/**
 * Annotate source tree by injecting comments into the underlying DOM
 */
function annotate_source(doc, matching, invert) {
    var collector = deltaProfile.createCollector(delta, doc,
            docProfile.createNodeEqualityTest(doc, doc));
    var domdoc = doc.tree.data.ownerDocument;
    var annotator = new da.DocumentAnnotator(domdoc);
    var excludes = [];

    
    //collector.forEachChange(function(type, path, par, remove, insert) {
    collector.forEachChange(function(op) {
        var deep = (op.type === 2),
        i, nodes, dompar, before, ancestors;

    if (op.anchor.base) {
        dompar = op.anchor.base.data;
        before = op.anchor.target;
        before = before && before.data;
    }
    else {
        dompar = domdoc;
        before = doc.tree.data;
    }

    for (nodes = [], i = 0; i < op.remove.length; i++) {
        nodes.push(op.remove[i].data.cloneNode(deep));
    }
    annotator.wrap(dompar, before, nodes,
        '<span class="change change-remove">', '</span>');

    for (nodes = [], i = 0; i < op.insert.length; i++) {
        nodes.push(domdoc.importNode(op.insert[i].data, deep));
    }
    annotator.wrap(dompar, before, nodes,
            '<span class="change change-insert">', '</span>');

    for (nodes = [], i = 0; i < op.remove.length; i++) {
        excludes.push([op.remove[i].data, deep]);
    }
    });

    for (var i = 0; i < excludes.length; i++) {
        annotator.exclude.apply(annotator, excludes[i]);
    }

    return annotator.toHTML();
}

function refresh() {
    if (doc1.tree && doc2.tree) {
        var d = new diff.Diff(skelmatchDiffProfile, docProfile, deltaProfile);
        delta = d.diff(doc1, doc2);

        $('#patch > pre').text(style_html(deltaProfile.serializeDocument(delta)));

        doc1.ansrc = annotate_source(doc1, delta.matching, false);
        doc2.ansrc = annotate_source(doc2, delta.matching, true);
    }
    $('#src1 > pre').html(doc1.ansrc);
    $('#src2 > pre').html(doc2.ansrc);
    prettyPrint();
}

function load_document(files, doc) {
    var file = files[0];
    var reader;
    var me = this;
    if (file) {
        if (file.type.match(/^(text\/xml|text\/html|.*\+xml)$/)) {
            reader = new FileReader();
            reader.onload = function(evt) {
                me[doc] = docProfile.loadOriginalDocument(evt.target.result);
                refresh();
            }
            reader.onerror = function(evt) {
                alert('Failed to load document.');
            }
            reader.readAsText(file);
        }
        else {
            alert('Filetype not supported');
        }
    }
}

$(function() {
    $('#file1').change(function() {
        load_document(this.files, 'doc1')
    });
    $('#file2').change(function() {
        load_document(this.files, 'doc2')
    });
});

});
require("/srcdiff-entry.js");

