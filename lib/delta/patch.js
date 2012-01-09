/**
 * @fileoverview High-level interface for the patching process
 */

/**
 * Create a new instance of a patch command based on the given factory objects.
 *
 * @param {Object} resolverFactory  A reference to a resolver profile.
 * @param {Object} docFactory       A reference to a document profile.
 * @param {Object} deltaFactory     A reference to a delta profile.
 *
 * Usage example:
 *
 * .. code-block:: javascript
 * 
 *      var resolverProfile = require('./lib/profiles/algo-resolver-xcc');
 *      var docProfile = require('./lib/profiles/doc-tree-xml');
 *      var deltaProfile = require('./lib/profiles/delta-tree-xml');
 *      var patch = require('./lib/delta/patch');
 *      
 *      var p = new patch.Patch(resolverProfile, docProfile, deltaProfile);
 *
 *      var doc = docProfile.loadOriginalDocument(document_content);
 *      var delta = deltaProfile.loadDocument(patch_content);
 *
 *      p.patch(doc, delta);
 *
 *      var result = docProfile.serializeDocument(doc);
 *
 * @constructor
 * @name patch.Patch
 */
function Patch(resolverFactory, docFactory, deltaFactory) {
    this.resolverFactory = resolverFactory;
    this.docFactory = docFactory;
    this.deltaFactory = deltaFactory;
}


/**
 * Patch the doc using the operations found in deltadoc. Resolve all
 * operations, install change handlers and activate all of them in one step.
 *
 * @param {Object}  doc         An instance returned by the document factory
 *                              loadInputDocument method.
 * @param {Object}  deltadoc    An instance returned from the delta factory
 *                              loadDocument method.
 *
 * @return {Number} The number of changes which were not resolved properly.
 * @memberOf patch.Patch
 */
Patch.prototype.patch = function(doc, deltadoc) {
    // Resolve all anchor nodes
    fails = this.resolve(doc, deltadoc);

    // Install handlers for resolved anchors
    this.attach(deltadoc);

    // Apply patch
    this.toggle(deltadoc);

    return fails;
}


/**
 * Resolve all operations in the given delta document and create an attached
 * operation for each of them.
 *
 * @param {Object}  deltadoc    An instance returned from the delta factory
 *                              loadDocument method.
 *
 * @return {Number} The number of changes which were not resolved properly.
 * @memberOf patch.Patch
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
            deltadoc.attached[i] = undefined;
            // FIXME: collect messages somewhere into deltadoc
            fails++;
        }
    }

    return fails;
}


/**
 * Install handlers for a resolved delta.
 *
 * @param {Object}  deltadoc    An instance returned from the delta factory
 *                              loadDocument method.
 * @memberOf patch.Patch
 */
Patch.prototype.attach = function(deltadoc) {
    var i, op,
        handlerfactory = this.docFactory.createHandlerFactory();

    // Install handlers for resolved anchors
    for (i = 0; i < deltadoc.attached.length; i++) {
        op = deltadoc.attached[i];
        if (op) {
            op.handler = handlerfactory.createOperationHandler(op.anchor,
                    op.type, op.path, op.remove, op.insert);
        }
    }
}


/**
 * Toggle all handlers of a delta document.
 *
 * @param {Object}  deltadoc    An instance returned from the delta factory
 *                              loadDocument method.
 * @memberOf patch.Patch
 */
Patch.prototype.toggle = function(deltadoc) {
    var i, op;

    for (i = 0; i < deltadoc.attached.length; i++) {
        op = deltadoc.attached[i];
        if (op && op.handler) {
            op.handler.toggle();
        }
    }
}

exports.Patch = Patch;
