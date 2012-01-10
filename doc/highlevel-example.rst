Example code
============

Example in CommonJS module format
---------------------------------

In this example module a diff-function is exported as the only member of a
CommonJS module. The function operates on XML documents, uses the skelmatch
algorithm and produces patch files in XML format.

.. code-block:: javascript

    // CommonJS imports
    var diffcmd = require('./delta/diff');
    var diffmod = require('./delta/diff-skelmatch-factory');
    var docmod = require('./delta/doc-xml-factory');
    var deltamod = require('./delta/delta-xml-factory');

    // Instantiate factory methods
    var difffact = new diffmod.DiffSkelmatchFactory();
    var docfact = new docmod.DocumentXMLFactory();
    var deltafact = new deltamod.DeltaXMLFactory();

    module.exports = function(origcontent, changedcontent) {
        // Load documents
        var doc1 = docfact.loadOriginalDocument(origcontent);
        var doc2 = docfact.loadInputDocument(changedcontent);

        // Construct patch
        var d = new diffcmd.Diff(difffact, docfact, deltafact);
        var deltadoc = d.diff(doc1, doc2);

        // Serialize patch
        return deltafact.serializeDocument(deltadoc);
    };


Example in AWM module format
----------------------------

In this example module a diff-function is exported as the only member of a
CommonJS module. The function operates on XML documents, uses the XCC diff
algorithm and produces patch files in XML format.

.. code-block:: javascript

    define([
        './delta/diff',
        './delta/diff-xcc-factory',
        './delta/doc-xml-factory',
        './delta/delta-xml-factory'],
    function(diffcmd, diffmod, docmod, deltamod) {
        // Instantiate factory methods
        var difffact = new diffmod.DiffXCCFactory();
        var docfact = new docmod.DocumentXMLFactory();
        var deltafact = new deltamod.DeltaXMLFactory();

        // This module simply exports one XML diff function
        return function(origcontent, changedcontent) {
            // Load documents
            var doc1 = docfact.loadOriginalDocument(origcontent);
            var doc2 = docfact.loadInputDocument(chanchedcontent);

            // Construct patch
            var d = new diffcmd.Diff(difffact, docfact, deltafact);
            var deltadoc = d.diff(doc1, doc2);

            // Serialize patch
            return deltafact.serializeDocument(deltadoc);
        };
    });
