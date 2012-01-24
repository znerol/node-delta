define([
    'delta/patch',
    './dataurl',
    'delta/resolve-xcc-factory',
    'delta/doc-xml-factory',
    'delta/delta-xml-factory'],
function(patch, dataurl, xccfac, docxmlfac, deltaxmlfac) {
    var resolveFactory = new xccfac.ResolveXCCFactory();
    var docFactory = new docxmlfac.DocumentXMLFactory();
    var deltaFactory = new deltaxmlfac.DeltaXMLFactory();

    /**
     * Construct a new patch instance from the original document and the
     * supplied patch. Both need to be UTF-8 encoded xml files.
     *
     * @constructor
     */
    function PatchCommand(orig, patchfile, mime) {
        var fragadapter = docFactory.createFragmentAdapter('xml');

        this.orig = docFactory.loadOriginalDocument(orig);
        this.changed = undefined;
        this.delta = deltaFactory.loadDocument(patchfile, fragadapter);

        this.mime = mime || 'text/html';

        this.type = 'patch';
    }

    /**
     * Apply the patch
     */
    PatchCommand.prototype.run = function() {
        var p = new patch.Patch(resolveFactory, docFactory, deltaFactory);
        this.changed = p.patch(this.orig, this.delta);
    }

    /**
     * Return a dataurl of the patched document
     */
    PatchCommand.prototype.getResult = function() {
        var src = docFactory.serializeDocument(this.orig);
        return dataurl(this.mime, src);
    }

    /**
     * Return a dataurl of the patched document
     */
    PatchCommand.prototype.getPreview = function() {
        return this.getResult();
    }

    return PatchCommand;
});
