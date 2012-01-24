define([
    'delta/diff',
    './dataurl',
    'delta/diff-skelmatch-factory',
    'delta/doc-xml-factory',
    'delta/delta-xml-factory'],
function(diff, dataurl, skelmatchfac, docxmlfac, deltaxmlfac) {
    var diffFactory = new skelmatchfac.DiffSkelmatchFactory();
    var docFactory = new docxmlfac.DocumentXMLFactory();
    var deltaFactory = new deltaxmlfac.DeltaXMLFactory();

    function DiffCommand(orig, changed, mime) {
        this.orig = docFactory.loadOriginalDocument(orig);
        this.changed = docFactory.loadInputDocument(changed);
        this.mime = mime || 'text/xml';
        this.delta = undefined;

        this.type = 'diff';
    }

    DiffCommand.prototype.run = function() {
        var d = new diff.Diff(diffFactory, docFactory, deltaFactory);
        this.delta = d.diff(this.orig, this.changed);
    };

    DiffCommand.prototype.getResult = function() {
        var src = deltaFactory.serializeDocument(this.delta);
        return dataurl('application/deltajs+xml', src);
    };

    DiffCommand.prototype.getPreview = function() {
        return dataurl(this.mime, this.changed.src);
    }

    return DiffCommand;
});
