function Patch(resolverFactory, docFactory, deltaFactory) {
    this.resolverFactory = resolverFactory;
    this.docFactory = docFactory;
    this.deltaFactory = deltaFactory;
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
    var equalValue = this.docFactory.createValueTest(doc),
        equalNode = this.docFactory.createNodeEqualityTest(doc, doc),
        equalTree = this.docFactory.createTreeEqualityTest(doc, doc),
        resolver = this.resolverFactory.createResolver(doc, equalValue,
            equalNode, equalTree),
        attacher = this.deltaFactory.createAttacher(resolver),
        i, fails = 0;

    // Resolve all anchor nodes
    for (i = 0; i < deltadoc.detached.length; i++) {
        try {
            deltadoc.attached[i] = attacher.attach(deltadoc.detached[i]);
        }
        catch (err) {
            // FIXME: collect messages somewhere into deltadoc
            fails++;
        }
    }

    return fails;
}


/**
 * Install handlers for a resolved delta
 */
Patch.prototype.attach = function(deltadoc) {
    var i, op,
        handlerfactory = this.docFactory.createHandlerFactory();

    // Install handlers for resolved anchors
    for (i = 0; i < deltadoc.attached.length; i++) {
        op = deltadoc.attached[i];
        op.handler = handlerfactory.createOperationHandler(op.anchor, op.type,
                op.path, op.remove, op.insert);
    }
}


/**
 * Toggle all handlers of a delta document
 */
Patch.prototype.toggle = function(deltadoc) {
    var i, op;

    for (i = 0; i < deltadoc.attached.length; i++) {
        op = deltadoc.attached[i];
        if (op.handler) {
            op.handler.toggle();
        }
    }
}

exports.Patch = Patch;
