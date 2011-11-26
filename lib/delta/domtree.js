/**
 * @file:   Adapter class converting an XML DOM document into a simple tree
 *          structure suitable for comparison using the XCC tree diff
 *          algorithm.
 */

var tree = require('./tree.js');
var platform = require('./platform.js');

/**
 * A function that visits every node of a DOM tree in document order. Calls
 * a callback with the visited node and the result of the callback from
 * visitting the parent node.
 *
 * This function is a modified version of Douglas Crockfords walk_the_DOM
 * function from his book "Javascript: The Good Parts".
 *
 * @param node      The DOM node representing the starting point for the
 *                  mapping operation
 * @param callback  function(node, parents_result)
 * @param T         context parameter bound to "this" when invoking the
 *                  callback 
 * @param presult   Internal use.
 */
function mapdom(node, callback, T, presult) {
    var result = callback.call(T, node, presult);
    node = node.firstChild;
    while (node) {
        mapdom(node, callback, T, result);
        node = node.nextSibling;
    }
    return result;
}


function DOMTreeAdapter() {
}


DOMTreeAdapter.prototype.hash = function(node) {
    // FIXME
    return node.tagName;
};


/**
 * Create node wrappers for the specified element or text node and all its
 * descentants and return toplevel wrapper.
 **/
DOMTreeAdapter.prototype.adaptElement = function(element) {
    return mapdom(element, function(node, wrappedParent) {
        var wrappedNode;

        if (node.nodeType === 1 || node.nodeType === 3) {
            wrappedNode = new tree.Node(this.hash(node), node);
            if (wrappedParent) {
                wrappedParent.append(wrappedNode);
            }
        }

        return wrappedNode;
    }, this);
};


/**
 * Create node wrappers for all element and text nodes in the specified
 * document and return the root wrapper.
 */
DOMTreeAdapter.prototype.adaptDocument = function(doc) {
    return this.adaptElement(doc.documentElement);
};


/**
 * Populate the document with the given dom tree.
 */
DOMTreeAdapter.prototype.createDocument = function(doc, tree) {
    var root;

    root = doc.importNode(tree.data, true);
    doc.appendChild(root);
};


function DOMNodeHash(HashAlgorithm) {
    this.HashAlgorithm = HashAlgorithm;
}


// FIXME: CDATA sections
DOMNodeHash.prototype.ELEMENT_PREFIX = '\x00\x00\x00\x01';
DOMNodeHash.prototype.ATTRIBUTE_PREFIX = '\x00\x00\x00\x02';
DOMNodeHash.prototype.TEXT_PREFIX = '\x00\x00\x00\x03';
DOMNodeHash.prototype.PI_PREFIX = '\x00\x00\x00\x07';
DOMNodeHash.prototype.SEPARATOR = '\x00\x00';

DOMNodeHash.prototype.process = function(node, hash) {
    var domnode = node.data;

    hash = hash || new this.HashAlgorithm();

    switch(domnode.nodeType) {
        case (domnode.ELEMENT_NODE):
            this.processElement(domnode, hash);
            break;

        case (domnode.ATTRIBUTE_NODE):
            this.processAttribute(domnode, hash);
            break;

        case (domnode.TEXT_NODE):
            this.processText(domnode, hash);
            break;

        default:
            console.log('DOMNodeHash: node-type ' + domnode.nodeType + ' not supported');
            break;
    }

    return hash.get();
};


/**
 * Helper method: Return qualified name of a DOM element or attribute node
 */
DOMNodeHash.prototype.qualifiedName = function(domnode) {
    var ns = '';
    if (domnode.namespaceURI) {
        ns = domnode.namespaceURI + ':';
    }
    return ns + domnode.nodeName.split(':').slice(-1)[0];
};


DOMNodeHash.prototype.processElement = function(domnode, hash) {
    var attrqns, attrnodes;

    // Process tag
    hash.update(this.ELEMENT_PREFIX);
    hash.update(this.qualifiedName(domnode));
    hash.update(this.SEPARATOR);

    // Process attributes
    if (domnode.hasAttributes()) {
        attrqns = [];
        attrnodes = {};
        platform.attributesArray(domnode).forEach(function(n) {
            if (n.name !== 'xmlns' && n.prefix !== 'xmlns') {
                var qn = this.qualifiedName(n);
                attrqns.push(qn);
                attrnodes[qn] = n;
            }
        }, this);
        attrqns = attrqns.sort();
        attrqns.forEach(function(qn) {
            this.processAttribute(attrnodes[qn], hash, qn);
        }, this);
    }
};


DOMNodeHash.prototype.processAttribute = function(domnode, hash, qn) {
    qn = qn || this.qualifiedName(domnode);
    hash.update(this.ATTRIBUTE_PREFIX);
    hash.update(qn);
    hash.update(this.SEPARATOR);
    hash.update(domnode.nodeValue);
};


DOMNodeHash.prototype.processText = function(domnode, hash) {
    hash.update(this.TEXT_PREFIX);
    hash.update(domnode.nodeValue);
};


exports.DOMTreeAdapter = DOMTreeAdapter;
exports.DOMNodeHash = DOMNodeHash;
