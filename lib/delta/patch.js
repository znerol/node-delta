function Patch(resolverFactory, docFactory) {
    this.resolverFactory = resolverFactory;
    this.docFactory = docFactory;
}

/**
 * Patch the doc using operations from deltadoc.
 */
Patch.prototype.patch = function(doc, deltadoc) {
    var equalValue = this.docFactory.createValueTest(doc);
    var equalNode = this.docFactory.createNodeEqualityTest(doc, doc);
    var equalTree = this.docFactory.createTreeEqualityTest(doc, doc);
    var resolver = this.resolverFactory.createResolver(doc, equalValue,
            equalNode, equalTree);
    var handlerfactory = this.docFactory.createHandlerFactory();
    var i = 1;
    var res;
    var entry;
    var op;
    var handler;
    var fails = 0;

    // Resolve all anchor nodes
    fails = this.resolve(doc, deltadoc);

    // Install handlers for resolved anchors
    this.attach(deltadoc);

    // Apply patch
    this.toggle(deltadoc);

    return fails;
}


/**
 * Resolve all anchors in the given deltadoc.
 */
Patch.prototype.resolve = function(doc, deltadoc) {
    var equalValue = this.docFactory.createValueTest(doc);
    var equalNode = this.docFactory.createNodeEqualityTest(doc, doc);
    var equalTree = this.docFactory.createTreeEqualityTest(doc, doc);
    var resolver = this.resolverFactory.createResolver(doc, equalValue,
            equalNode, equalTree);
    var i;
    var res;
    var entry;
    var op;
    var fails = 0;

    // Resolve all anchor nodes
    for (i = 0; i < deltadoc.entries.length; i++) {
        entry = deltadoc.entries[i];
        op = entry.operation;

        res = resolver.find(op.path, op.remove, op.head, op.tail, op.type);

        if (res.anchor && res.tail.length === 0) {
            entry.anchor = res.anchor;
        }
        else {
            fails++;
        }
    }

    return fails;
}


/**
 * Install handlers for a resolved delta
 */
Patch.prototype.attach = function(deltadoc) {
    var i, entry, op,
        handlerfactory = this.docFactory.createHandlerFactory();

    // Install handlers for resolved anchors
    for (i = 0; i < deltadoc.entries.length; i++) {
        entry = deltadoc.entries[i];
        op = entry.operation;

        if (entry.anchor) {
            entry.handler = handlerfactory.createOperationHandler(entry.anchor,
                    op.type, op.path, op.remove, op.insert);
        }
    }
}


/**
 * Toggle all handlers of a delta document
 */
Patch.prototype.toggle = function(deltadoc) {
    var i, entry;

    for (i = 0; i < deltadoc.entries.length; i++) {
        entry = deltadoc.entries[i];

        if (entry.handler) {
            entry.handler.toggle();
        }
    }
}

exports.Patch = Patch;
