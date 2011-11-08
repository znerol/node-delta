(function(exports, xmltree, platform){
    exports['Simple subtree operation'] = function(test) {
        var original_doc = platform.parseXML('<r><c1/><c2/><c3/><c4/></r>');
        var r = original_doc.firstChild;
        var c1= r.firstChild;
        var c2 = c1.nextSibling;
        var c3 = c2.nextSibling;
        var c4 = c3.nextSibling;
        var original_nodes = [c2, c3];
        var anchor_node = c4;

        var replacement_doc = platform.parseXML('<d><c2x/></d>');
        var c2xr = replacement_doc.firstChild.firstChild;
        var c2xo = original_doc.importNode(c2xr, true);
        var replacement_nodes = [c2xo];

        var op = new xmltree.DOMTreeSequenceOperation(original_doc, r, anchor_node, original_nodes, replacement_nodes);

        var expect_siblings;
        var actual_siblings;

        // replace original nodes with replacement nodes
        op.toggle();

        expect_siblings = [c1, c2xo, c4];
        actual_siblings = Array.prototype.slice.call(r.childNodes);
        test.deepEqual(actual_siblings, expect_siblings);

        // switch back from replacement nodes to original nodes
        op.toggle();

        expect_siblings = [c1, c2, c3, c4];
        actual_siblings = Array.prototype.slice.call(r.childNodes);
        test.deepEqual(actual_siblings, expect_siblings);

        test.done();
    }

    exports['Simple attribute operation'] = function(test) {
        var original_doc = platform.parseXML('<n id="1" name="test" style="color: black"/>');
        var original_node = original_doc.firstChild;
        var original_attrs = [
            original_node.getAttributeNode('id'),
            original_node.getAttributeNode('name'),
            original_node.getAttributeNode('style')
        ];

        var replacement_doc = platform.parseXML('<n name="changed"/>');
        var replacement_node = original_doc.importNode(replacement_doc.firstChild, true);
        var replacement_attrs = [
            replacement_node.getAttributeNode('name'),
        ];

        var op = new xmltree.DOMNodeAttributeOperation(original_doc, original_node, replacement_node);

        var expect_attributes;
        var actual_attributes;

        // replace original attrs with replacement attrs
        op.toggle();

        expect_attributes = replacement_attrs;
        actual_attributes = platform.attributesArray(original_node);
        test.deepEqual(actual_attributes, expect_attributes);

        // switch back from replacement attrs to original attrs
        op.toggle();

        expect_attributes = original_attrs;
        actual_attributes = platform.attributesArray(original_node);
        test.deepEqual(actual_attributes, expect_attributes);

        test.done();
    }

}(
    typeof exports === 'undefined' ? (DeltaJS.xmltreeTest={}) : exports,
    typeof require === 'undefined' ? DeltaJS.xmltree : require('deltajs').xmltree,
    typeof require === 'undefined' ? DeltaJS.platform : require('deltajs').platform
));
