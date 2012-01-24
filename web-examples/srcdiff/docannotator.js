var style_html = require('./beautify-html').style_html;
var xs = new XMLSerializer();

/**
 * Create new DocumentAnnotator instance
 * @creator
 */
exports.DocumentAnnotator = function DocumentAnnotator(doc, nonce) {
    this.doc = doc;
    this.nonce = nonce || (new Date()).getTime().toString();
    this.indent_size = 4;
    this.indent_char = ' ';
    this.markers = [];
}

/**
 * Wrap the given DOM elements with a html element, typically a <span>.
 * Wrapped nodes will be escaped after serialization while special
 * characters of the html element will be preserved.
 */
exports.DocumentAnnotator.prototype.wrap = function(par, before, domnodes,
        starttag, endtag) {
    var content, node, indent = '',
    docfrag = this.doc.createDocumentFragment();

    // Indentation
    node = (par && par.parentNode);
    while(node) {
        for (i = 0; i < this.indent_size; i++) {
            indent += this.indent_char;
        }
        node = node.parentNode;
    }

    // Build up marker comment
    for (i = 0; i < domnodes.length; i++) {
        docfrag.appendChild(domnodes[i]);
    }

    content = '\nPRESERVE'+this.nonce+starttag+'ENDPRESERVE'+this.nonce;
    content += style_html(xs.serializeToString(docfrag), {'max_char': 70 - indent.length});
    content += 'PRESERVE'+this.nonce+endtag+'ENDPRESERVE'+this.nonce;
    content = content.replace(/^/mg, indent);
    node = this.doc.createComment(content);

    // Insert marker comment
    this.markers.push(par.insertBefore(node, before));
}


/**
 * Exclude the given DOM element from the serialized output.
 */
exports.DocumentAnnotator.prototype.exclude = function(domnode, deep) {
    var par, next, start, end;
    if (domnode.ownerDocument !== this.doc) {
        throw new Error('Cannot exclude element if it is not part of the document');
    }
    start = this.doc.createComment('EXCLUDE'+this.nonce);
    end = this.doc.createComment('ENDEXCLUDE'+this.nonce);

    par = domnode.parentNode || this.doc;
    this.markers.push(par.insertBefore(start, domnode));

    // insert after
    next = undefined;
    if (deep) {
        next = domnode.nextSibling;
    }
    else if (domnode) {
        next = domnode.firstChild || domnode.nextSibling;
        if (next) {
            par = next.parentNode || domnode.ownerDocument;
        }
        else {
            par = domnode.parentNode || domnode.ownerDocument;
        }
    }
    this.markers.push(par.insertBefore(end, next));
}

/**
 * Return the annotated source of the DOM tree.
 */
exports.DocumentAnnotator.prototype.toHTML = function(noclear) {
    var tmpdoc = document.implementation.createDocument('','',null);
    var source = style_html(xs.serializeToString(this.doc));

    // Remove excluded nodes from the output
    var exclude_pat = '<!--EXCLUDE'+this.nonce+'-->[\\s\\S]*?<!--ENDEXCLUDE'+this.nonce+'-->\n?';
    var exclude_re = new RegExp(exclude_pat, 'gm');
    source = source.replace(exclude_re,'');

    var preserve_pat = '<!--\\s*PRESERVE'+this.nonce+'([\\s\\S]*?)ENDPRESERVE'+this.nonce;
    preserve_pat += '([\\s\\S]*?)';
    preserve_pat += 'PRESERVE'+this.nonce+'([\\s\\S]*?)ENDPRESERVE'+this.nonce+'-->';
    var preserve_re = new RegExp(preserve_pat, 'gm');
    var tmptxt, result='', last=0;

    while ((match = preserve_re.exec(source))) {
        // Serialize (escape) input up to but not including the marker
        // comment
        tmptxt = this.doc.createTextNode(match.input.slice(last,
                    preserve_re.lastIndex - match[0].length));
        result += xs.serializeToString(tmptxt);

        // Append preserved start-tag unescaped
        result += match[1];
        last = preserve_re.lastIndex;

        // Append content escaped
        tmptxt = this.doc.createTextNode(match[2]);
        result += xs.serializeToString(tmptxt);

        // Append preserved end-tag unescaped
        result += match[3];
        last = preserve_re.lastIndex;
    }

    // Serialize rest
    tmptxt = this.doc.createTextNode(source.slice(last));
    result += xs.serializeToString(tmptxt);

    // Remove marker comments
    if (!noclear) {
        this.clear();
    }

    return result;
}

/**
 * Remove marker comments from underlying DOM tree.
 */
exports.DocumentAnnotator.prototype.clear = function() {
    var i, par;
    for (i = 0; i < this.markers.length; i++) {
        par = this.markers[i].parentNode || this.doc;
        par.removeChild(this.markers[i]);
    }
}
