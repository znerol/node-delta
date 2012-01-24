/**
 * Calculate and assign x/y positions of all nodes in the given tree.
 */
DeltaJS.xcc.layout_tree = function(root, nx, ny, xinit) {
    // x position for new leaf nodes
    var mx = xinit || 1;

    // Visit nodes in postorder
    root.forEachPostorder(function(node) {
        if (node.children.length === 0) {
            // leaf node
            node.x = mx;
            node.y = ny * node.depth;
            mx += nx;
        }
        else {
            // internal node
            node.x = node.children[0].x / 2 +
                node.children[node.children.length-1].x / 2;
            node.y = ny * node.depth;
        }
    });

    return mx;
};


/**
 * Parse a string of the form 'r +a ++a1 ++a2 +b +c ++c1 ++c2' into a tree
 * structure.
 */
DeltaJS.xcc.parse_tree = function(str) {
    // Split input string, use plus-sign as separator.
    var s = str.split(/\+/),
        parents = [],
        depth = 0,
        root;

    if (s.length === 0) {
        return;
    }

    // Create root node
    root = new DeltaJS.tree.Node(s.shift().trim());
    parents[0] = root;

    s.forEach(function(label) {
        var node;
        label = label.trim();
        if (label) {
            node = new DeltaJS.tree.Node(label);
            parents[depth].append(node);
            parents[depth+1] = node;
            depth = 0;
        }
        else {
            // An empty string is produced by adjacent plus-signs. Increase
            // depth.
            depth++;
        }
    });

    return root;
};
