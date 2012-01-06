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
    var fails = deltadoc.delta.attach(resolver, handlerfactory);
    var i = 1;

    // Apply patch
    deltadoc.delta.forEach(function(op, handler) {
        if (handler) {
            handler.toggle();
        }
        else {
            console.error('Failed to resolve hunk ' + i + ': ' + op.toString());
        }
        i++;
    });

    return fails;
}

exports.Patch = Patch;
