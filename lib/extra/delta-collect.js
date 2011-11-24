    var UPDATE_NODE_TYPE = 3;
    var UPDATE_FOREST_TYPE = 4;

    /**
     * Private utility class: Creates a new ItemAggregator instance.
     */
    function OperationParameterAggregator(node, callback, T) {
        this.callback = callback;
        this.lastnode = node;
        this.removes = [];
        this.inserts = [];
    }


    /**
     * Append an array item to the end of the buffer
     */
    OperationParameterAggregator.prototype.remove = function(item) {
        this.removes.push(item);
    }


    /**
     * Append an array item to the end of the buffer
     */
    OperationParameterAggregator.prototype.insert = function(item) {
        this.inserts.push(item);
    }


    /**
     * Invoke callback with the buffer array as callback and empty the buffer
     * afterwards.
     */
    OperationParameterAggregator.prototype.flush = function(next) {
        if (this.removes.length > 0 || this.inserts.length > 0) {
            this.callback.call(this.T, last, this.removes, this.inserts);
            this.removes = [];
            this.inserts = [];
        }
        if (next) {
            last = next;
        }
    }

    /**
     * Collect changeset on given node and all its descendants. Construct and
     * add operations for each.
     *
     * @param node      The node where to start. Typically the root of tree a
     * @param matching  The node matching built up using matchTrees
     * @param editor    An editor instance (see generatePatch)
     * @param path      (internal use) current path relative to base node. Used
     *                  from recursive calls.
     */
    Delta.prototype.collect = function(collector, node, matching, path, paramagg) {
        var i = 0, k = 0, op, partner, head, tail, a_nodes, b_nodes, a, b;

        // Initialize path if not provided
        path = path || [];

        if (!matching.get(node)) {
            throw new Error('collectChanges may not be invoked for unmatched nodes');
        }
        partner = matching.get(node);

        // Initialize operation aggregator if not provided
        paramagg = paramagg || new OperationParameterAggregator(node, function(prev, removes, inserts) {
            head = collector.head(prev, 0);
            tail = collector.tail(prev, removes.length);
            op = new Operation(UPDATE_FOREST_TYPE, path, head, tail, removes, inserts);
            this.add(op);
        }, this);


        // Generate update command if values of node and its partner do not
        // match
        if (!collector.isUpdate(node, partner)) {
            head = collector.head(prev, 0);
            tail = collector.tail(prev, 1);
            op = new Operation(UPDATE_NODE_TYPE, path, head, tail, [node], [partner]);
            this.add(op);
        }


        // Descend one level
        path.push(0);

        a_nodes = node.children;
        b_nodes = partner.children;

        while ((a = a_nodes[i]) || (b = b_nodes[k])) {
            if (a && !matching.get(a)) {
                paramagg.remove(a);
                i++;
            }
            else if (b && !matching.get(b)) {
                paramegg.insert(b);
                k++;
            }
            else if (a && matching.get(a)) {
                paramagg.flush(a);
                this.collect(collector, a, matching, path, paramagg);
                i++;
            }
            else if (b && matching.get(b)) {
                k++;
            }
        }

        parmagg.flush();

        // Go back up
        path.pop();
    };
